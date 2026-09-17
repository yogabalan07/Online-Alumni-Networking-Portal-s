import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import type { NotificationItem, NotificationType } from '@/types';

export interface NewNotification {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  relatedUserId?: string;
}

export async function createNotification(data: NewNotification): Promise<void> {
  await addDoc(collection(db, 'notifications'), {
    ...data,
    read: false,
    createdAt: serverTimestamp(),
  }).catch(() => undefined);
}

export function listenNotifications(
  recipientId: string,
  cb: (notifications: NotificationItem[]) => void,
  pageSize = 40,
): () => void {
  const q = query(
    collection(db, 'notifications'),
    where('recipientId', '==', recipientId),
    orderBy('createdAt', 'desc'),
    limit(pageSize),
  );
  return onSnapshot(q, (snap) => {
    const list: NotificationItem[] = [];
    snap.forEach((s) => list.push({ id: s.id, ...s.data() } as NotificationItem));
    cb(list);
  });
}

export async function markNotificationRead(id: string): Promise<void> {
  await updateDoc(doc(db, 'notifications', id), { read: true });
}

export async function markAllNotificationsRead(recipientId: string): Promise<void> {
  const q = query(
    collection(db, 'notifications'),
    where('recipientId', '==', recipientId),
    where('read', '==', false),
    limit(100),
  );
  const snap = await getDocs(q);
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.forEach((s) => batch.update(s.ref, { read: true }));
  await batch.commit();
}

export async function deleteNotification(id: string): Promise<void> {
  await import('firebase/firestore')
    .then(({ deleteDoc }) => deleteDoc(doc(db, 'notifications', id)))
    .catch(() => undefined);
}

export function countUnread(list: NotificationItem[]): number {
  return list.filter((n) => !n.read).length;
}