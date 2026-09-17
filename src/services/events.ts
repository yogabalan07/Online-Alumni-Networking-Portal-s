import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
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
import type { EventItem } from '@/types';
import { incrementStat } from './stats';

export interface EventInput {
  title: string;
  description: string;
  date: number;
  time: string;
  venue: string;
  registrationDeadline?: number;
  eventType?: string;
}

export async function createEvent(input: EventInput, organizerId: string): Promise<string> {
  const ref = await addDoc(collection(db, 'events'), {
    ...input,
    organizerId,
    createdAt: serverTimestamp(),
  });
  await incrementStat('events');
  return ref.id;
}

export async function updateEvent(id: string, patch: Partial<EventInput>): Promise<void> {
  await updateDoc(doc(db, 'events', id), { ...patch });
}

export async function deleteEvent(id: string): Promise<void> {
  await deleteDoc(doc(db, 'events', id));
}

export function listenEvents(cb: (events: EventItem[]) => void, pageSize = 100): () => void {
  const q = query(collection(db, 'events'), orderBy('date', 'asc'), limit(pageSize));
  return onSnapshot(q, (snap) => {
    const list: EventItem[] = [];
    snap.forEach((s) => list.push({ id: s.id, ...s.data() } as EventItem));
    cb(list);
  });
}

export async function registerForEvent(eventId: string, userId: string): Promise<void> {
  const existing = query(
    collection(db, 'eventRegistrations'),
    where('eventId', '==', eventId),
    where('userId', '==', userId),
  );
  const snap = await getDocs(existing);
  if (!snap.empty) {
    throw new Error('You are already registered for this event.');
  }
  await addDoc(collection(db, 'eventRegistrations'), {
    eventId,
    userId,
    createdAt: serverTimestamp(),
  });
}

export async function unregisterFromEvent(eventId: string, userId: string): Promise<void> {
  const q = query(
    collection(db, 'eventRegistrations'),
    where('eventId', '==', eventId),
    where('userId', '==', userId),
  );
  const snap = await getDocs(q);
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.forEach((s) => batch.delete(s.ref));
  await batch.commit();
}

export async function isRegisteredForEvent(eventId: string, userId: string): Promise<boolean> {
  const q = query(
    collection(db, 'eventRegistrations'),
    where('eventId', '==', eventId),
    where('userId', '==', userId),
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

export function listenEventRegistrations(
  eventId: string,
  cb: (count: number) => void,
): () => void {
  const q = query(collection(db, 'eventRegistrations'), where('eventId', '==', eventId));
  return onSnapshot(q, (snap) => cb(snap.size));
}

export function getEvent(id: string): Promise<EventItem | null> {
  return getDoc(doc(db, 'events', id)).then((s) =>
    s.exists() ? ({ id: s.id, ...s.data() } as EventItem) : null,
  );
}

export { writeBatch };