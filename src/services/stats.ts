import { doc, getDoc, increment, runTransaction, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebase';

export type StatKey =
  | 'students'
  | 'alumni'
  | 'verifiedAlumni'
  | 'connectedUsers'
  | 'connections'
  | 'messages'
  | 'jobs'
  | 'internships'
  | 'events'
  | 'totalUsers';

const STATS_DOC = 'stats/platform';

export async function incrementStat(key: StatKey, by = 1): Promise<void> {
  const ref = doc(db, 'stats', 'platform');
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists() ? (snap.data() as Record<string, number>) : {};
    tx.set(ref, { ...data, [key]: (data[key] ?? 0) + by }, { merge: true });
  });
}

export async function getStats(): Promise<Partial<Record<StatKey, number>>> {
  const snap = await getDoc(doc(db, STATS_DOC));
  if (!snap.exists()) return {};
  return snap.data() as Partial<Record<StatKey, number>>;
}

export async function initStats(): Promise<void> {
  await setDoc(doc(db, STATS_DOC), {}, { merge: true });
}

export { increment };