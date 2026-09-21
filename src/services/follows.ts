import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import type { Follow, UserProfile } from '@/types';
import { createNotification } from './notifications';

function followId(followerId: string, followingId: string): string {
  return [followerId, followingId].sort().join('_');
}

export async function toggleFollow(
  followerId: string,
  followingId: string,
  followerName: string,
): Promise<boolean> {
  if (followerId === followingId) throw new Error('You cannot follow yourself.');

  const id = followId(followerId, followingId);
  const ref = doc(db, 'follows', id);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    await deleteDoc(ref);
    return false;
  }

  await setDoc(ref, {
    followerId,
    followingId,
    createdAt: serverTimestamp(),
  });

  // Notify the followed user
  await createNotification({
    recipientId: followingId,
    type: 'new_follower',
    title: 'New follower',
    message: `${followerName} started following you.`,
    relatedUserId: followerId,
  });

  return true;
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const id = followId(followerId, followingId);
  const snap = await getDoc(doc(db, 'follows', id));
  return snap.exists();
}

export function listenFollowStatus(
  followerId: string,
  followingId: string,
  cb: (following: boolean) => void,
): () => void {
  const id = followId(followerId, followingId);
  return onSnapshot(doc(db, 'follows', id), (snap) => cb(snap.exists()));
}

export function listenFollowers(
  userId: string,
  cb: (follows: Follow[]) => void,
): () => void {
  const q = query(
    collection(db, 'follows'),
    where('followingId', '==', userId),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(q, (snap) => {
    const list: Follow[] = [];
    snap.forEach((s) => list.push({ id: s.id, ...s.data() } as Follow));
    cb(list);
  });
}

export function listenFollowing(
  userId: string,
  cb: (follows: Follow[]) => void,
): () => void {
  const q = query(
    collection(db, 'follows'),
    where('followerId', '==', userId),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(q, (snap) => {
    const list: Follow[] = [];
    snap.forEach((s) => list.push({ id: s.id, ...s.data() } as Follow));
    cb(list);
  });
}

export async function getFollowerCount(userId: string): Promise<number> {
  const q = query(collection(db, 'follows'), where('followingId', '==', userId));
  const snap = await getDocs(q);
  return snap.size;
}

export async function getFollowingCount(userId: string): Promise<number> {
  const q = query(collection(db, 'follows'), where('followerId', '==', userId));
  const snap = await getDocs(q);
  return snap.size;
}
