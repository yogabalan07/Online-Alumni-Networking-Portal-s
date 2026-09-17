import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import type { Connection, ConnectionStatus } from '@/types';
import { createNotification } from './notifications';
import { incrementStat } from './stats';

export function connectionId(a: string, b: string): string {
  return [a, b].sort().join('_');
}

export interface ConnectionWithUsers extends Connection {
  otherUser?: { uid: string } | null;
}

export async function getConnectionStatus(
  meUid: string,
  otherUid: string,
): Promise<Connection | null> {
  const snap = await getDoc(doc(db, 'connections', connectionId(meUid, otherUid)));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Connection;
}

export async function sendConnectionRequest(
  requesterId: string,
  recipientId: string,
  requesterName: string,
): Promise<void> {
  const id = connectionId(requesterId, recipientId);
  const ref = doc(db, 'connections', id);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    const cur = existing.data() as Partial<Connection>;
    if (cur.status === 'pending' || cur.status === 'accepted') {
      throw new Error('A connection with this user already exists. You are already connected or have a pending request.');
    }
  }

  if (requesterId === recipientId) {
    throw new Error('You cannot connect with yourself.');
  }

  const [idA, idB] = [requesterId, recipientId].sort();
  await setDoc(ref, {
    requesterId,
    recipientId,
    status: 'pending',
    participantIds: [requesterId, recipientId],
    idA,
    idB,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await createNotification({
    recipientId,
    type: 'connection_request',
    title: 'New connection request',
    message: `${requesterName} sent you a connection request.`,
    relatedId: id,
    relatedUserId: requesterId,
  });
}

export async function respondToConnectionRequest(
  connection: Connection,
  accept: boolean,
  receiverName: string,
): Promise<void> {
  const status: ConnectionStatus = accept ? 'accepted' : 'rejected';
  await updateDoc(doc(db, 'connections', connection.id), {
    status,
    updatedAt: serverTimestamp(),
  });

  if (accept) {
    await incrementStat('connections');
    await incrementStat('connectedUsers');
    await createNotification({
      recipientId: connection.requesterId,
      type: 'connection_accepted',
      title: 'Connection accepted',
      message: `${receiverName} accepted your connection request. You can now chat.`,
      relatedId: connection.id,
      relatedUserId: connection.recipientId,
    });
  }
}

export async function removeConnection(connection: Connection): Promise<void> {
  await updateDoc(doc(db, 'connections', connection.id), {
    status: 'rejected',
    updatedAt: serverTimestamp(),
  });
}

export async function blockConnection(connection: Connection): Promise<void> {
  await updateDoc(doc(db, 'connections', connection.id), {
    status: 'blocked',
    updatedAt: serverTimestamp(),
  });
}

export function listenConnections(
  uid: string,
  cb: (connections: Connection[]) => void,
): () => void {
  const q = query(
    collection(db, 'connections'),
    where('participantIds', 'array-contains', uid),
    orderBy('updatedAt', 'desc'),
  );
  return onSnapshot(q, (snap) => {
    const list: Connection[] = [];
    snap.forEach((s) => list.push({ id: s.id, ...s.data() } as Connection));
    cb(list);
  });
}

export function listenConnectionsWithStatus(
  uid: string,
  status: ConnectionStatus,
  cb: (connections: Connection[]) => void,
): () => void {
  const q = query(
    collection(db, 'connections'),
    where('participantIds', 'array-contains', uid),
    where('status', '==', status),
    orderBy('updatedAt', 'desc'),
  );
  return onSnapshot(q, (snap) => {
    const list: Connection[] = [];
    snap.forEach((s) => list.push({ id: s.id, ...s.data() } as Connection));
    cb(list);
  });
}

export async function getPendingOutgoing(uid: string): Promise<Connection[]> {
  const q = query(
    collection(db, 'connections'),
    where('requesterId', '==', uid),
    where('status', '==', 'pending'),
  );
  const snap = await getDocs(q);
  const list: Connection[] = [];
  snap.forEach((s) => list.push({ id: s.id, ...s.data() } as Connection));
  return list;
}

export async function getConnectedIds(uid: string): Promise<string[]> {
  const q = query(
    collection(db, 'connections'),
    where('participantIds', 'array-contains', uid),
    where('status', '==', 'accepted'),
  );
  const snap = await getDocs(q);
  const ids = new Set<string>();
  snap.forEach((s) => {
    const d = s.data();
    (d.participantIds as string[]).forEach((id) => {
      if (id !== uid) ids.add(id);
    });
  });
  return Array.from(ids);
}