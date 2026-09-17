import { useEffect, useMemo, useRef, useState } from 'react';
import type { UserProfile } from '@/types';
import { getUsersByIds, watchUser } from '@/services/users';

/**
 * Resolves a set of user ids to profiles. Fetches once and then keeps each
 * resolved user fresh via a lightweight per-user snapshot listener.
 */
export function useUserMap(uids: string[]) {
  const [map, setMap] = useState<Record<string, UserProfile>>({});
  const unsubsRef = useRef<Record<string, () => void>>({});
  const key = useMemo(() => Array.from(new Set(uids.filter(Boolean))).sort().join(','), [uids]);

  useEffect(() => {
    const ids = key ? key.split(',') : [];
    if (ids.length === 0) return;

    let cancelled = false;
    const missing = ids.filter((id) => !unsubsRef.current[id]);

    if (missing.length > 0) {
      void getUsersByIds(missing).then((res) => {
        if (cancelled) return;
        setMap((prev) => ({ ...prev, ...res }));
      });
    }

    ids.forEach((id) => {
      if (unsubsRef.current[id]) return;
      watchUser(id, (u) => {
        if (cancelled) return;
        if (u) setMap((prev) => ({ ...prev, [id]: u }));
      }).then((unsub) => {
        if (cancelled) {
          unsub();
          return;
        }
        unsubsRef.current[id] = unsub;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [key]);

  useEffect(() => {
    return () => {
      Object.values(unsubsRef.current).forEach((u) => u());
      unsubsRef.current = {};
    };
  }, []);

  return map;
}