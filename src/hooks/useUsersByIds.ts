import { useEffect, useMemo, useState } from 'react';
import type { UserProfile } from '@/types';
import { getUsersByIds } from '@/services/users';

/**
 * Batch-resolves a list of user ids to profiles (no per-user listeners).
 * Re-fetches when the set of ids changes. Use for lists such as conversations.
 */
export function useUsersByIds(ids: string[]) {
  const [map, setMap] = useState<Record<string, UserProfile>>({});
  const key = useMemo(() => Array.from(new Set(ids.filter(Boolean))).sort().join(','), [ids]);

  useEffect(() => {
    if (!key) {
      setMap({});
      return;
    }
    let active = true;
    void getUsersByIds(key.split(',')).then((res) => {
      if (active) setMap(res);
    });
    return () => {
      active = false;
    };
  }, [key]);

  return map;
}