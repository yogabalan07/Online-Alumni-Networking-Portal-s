import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import type { Report, ReportStatus } from '@/types';

export type ReportTargetType = 'user' | 'message' | 'job' | 'event';

export async function createReport(
  reporterId: string,
  targetType: ReportTargetType,
  targetId: string,
  reason: string,
  description?: string,
): Promise<void> {
  await addDoc(collection(db, 'reports'), {
    reporterId,
    targetType,
    targetId,
    reason,
    description: description?.trim() || null,
    status: 'open',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function listenReports(
  callback: (reports: Report[]) => void,
  fromReporterOnly?: string,
  pageSize = 100,
): () => void {
  const constr = [orderBy('createdAt', 'desc'), limit(pageSize)] as const;
  const q = fromReporterOnly
    ? query(collection(db, 'reports'), where('reporterId', '==', fromReporterOnly), ...constr)
    : query(collection(db, 'reports'), ...constr);
  return onSnapshot(q, (snap) => {
    const list: Report[] = [];
    snap.forEach((s) => list.push({ id: s.id, ...s.data() } as Report));
    callback(list);
  });
}

export async function updateReportStatus(id: string, status: ReportStatus): Promise<void> {
  await updateDoc(doc(db, 'reports', id), {
    status,
    updatedAt: serverTimestamp(),
  });
}