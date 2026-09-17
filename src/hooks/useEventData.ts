import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import { listenEventRegistrations } from '@/services/events';

/** Live registration counts for a set of event ids. */
export function useEventRegistrationCounts(eventIds: string[]) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const unsubsRef = useRef<Record<string, () => void>>({});
  const key = useMemo(() => Array.from(new Set(eventIds.filter(Boolean))).sort().join(','), [eventIds]);

  useEffect(() => {
    const ids = key ? key.split(',') : [];
    ids.forEach((id) => {
      if (unsubsRef.current[id]) return;
      unsubsRef.current[id] = listenEventRegistrations(id, (count) => {
        setCounts((prev) => ({ ...prev, [id]: count }));
      });
    });
  }, [key]);

  useEffect(
    () => () => {
      Object.values(unsubsRef.current).forEach((u) => u());
      unsubsRef.current = {};
    },
    [],
  );

  return counts;
}

/** The event ids the current user is registered for. */
export function useMyEventRegistrations(uid: string | undefined) {
  const [registered, setRegistered] = useState<string[]>([]);

  useEffect(() => {
    if (!uid) {
      setRegistered([]);
      return;
    }
    const q = query(collection(db, 'eventRegistrations'), where('userId', '==', uid));
    const unsub = onSnapshot(q, (snap) => {
      setRegistered(snap.docs.map((d) => d.data().eventId as string));
    });
    return unsub;
  }, [uid]);

  return registered;
}

export async function fetchRegisteredIds(uid: string): Promise<string[]> {
  const q = query(collection(db, 'eventRegistrations'), where('userId', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data().eventId as string);
}