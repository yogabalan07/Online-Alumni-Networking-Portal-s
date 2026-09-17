import { useEffect, useState } from 'react';
import type { PresenceState } from '@/types';
import { listenPresence } from '@/services/presence';

export function usePresence(uid: string | undefined) {
  const [presence, setPresence] = useState<PresenceState | null>(null);

  useEffect(() => {
    if (!uid) {
      setPresence(null);
      return;
    }
    let unsub: (() => void) | null = null;
    let mounted = true;
    try {
      unsub = listenPresence(uid, (state) => {
        if (mounted) setPresence(state);
      });
    } catch {
      setPresence(null);
    }
    return () => {
      mounted = false;
      unsub?.();
    };
  }, [uid]);

  const isOnline = presence?.state === 'online';
  return { presence, isOnline, lastChanged: presence?.lastChanged };
}