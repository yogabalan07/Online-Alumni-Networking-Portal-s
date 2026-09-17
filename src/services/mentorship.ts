import {
  addDoc,
  collection,
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
} from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import type { MentorshipRequest, MentorshipStatus } from '@/types';
import { createNotification } from './notifications';
import { tsNum } from '@/lib/utils';

export async function requestMentorship(
  studentId: string,
  alumniId: string,
  topic: string,
  message: string,
  studentName: string,
): Promise<void> {
  const existing = query(
    collection(db, 'mentorshipRequests'),
    where('studentId', '==', studentId),
    where('alumniId', '==', alumniId),
    where('status', 'in', ['pending', 'accepted'] as MentorshipStatus[]),
  );
  const snap = await getDocs(existing);
  if (!snap.empty) {
    throw new Error('You already have a pending or active mentorship request with this alumni.');
  }

  await addDoc(collection(db, 'mentorshipRequests'), {
    studentId,
    alumniId,
    topic,
    message,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await createNotification({
    recipientId: alumniId,
    type: 'mentorship_request',
    title: 'Mentorship request',
    message: `${studentName} requested mentorship on "${topic}".`,
    relatedUserId: studentId,
  });
}

export async function respondToMentorship(
  requestId: string,
  status: MentorshipStatus,
  alumniName: string,
): Promise<void> {
  await updateDoc(doc(db, 'mentorshipRequests', requestId), {
    status,
    updatedAt: serverTimestamp(),
  });

  if (status === 'accepted') {
    const req = await getMentorshipRequest(requestId);
    if (req) {
      await createNotification({
        recipientId: req.studentId,
        type: 'mentorship_accepted',
        title: 'Mentorship accepted',
        message: `${alumniName} accepted your mentorship request.`,
        relatedId: requestId,
        relatedUserId: req.alumniId,
      });
    }
  }
}

export async function getMentorshipRequest(requestId: string): Promise<MentorshipRequest | null> {
  const snap = await getDoc(doc(db, 'mentorshipRequests', requestId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as MentorshipRequest) : null;
}

export function listenMentorshipRequests(
  uid: string,
  cb: (requests: MentorshipRequest[]) => void,
  pageSize = 50,
): () => void {
  const q1 = query(
    collection(db, 'mentorshipRequests'),
    where('studentId', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(pageSize),
  );
  const q2 = query(
    collection(db, 'mentorshipRequests'),
    where('alumniId', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(pageSize),
  );

  let unsub2: (() => void) | null = null;

  function combine(
    docs1: { id: string; data: () => unknown }[],
    docs2: { id: string; data: () => unknown }[],
  ) {
    const map = new Map<string, MentorshipRequest>();
    [...docs1, ...docs2].forEach((d) => {
      map.set(
        d.id,
        d.data() as MentorshipRequest,
      );
    });
    const list = Array.from(map.values()).sort(
      (a, b) => tsNum(b.createdAt) - tsNum(a.createdAt),
    );
    cb(list);
  }

  const unsub1 = onSnapshot(q1, (snap1) => {
    if (!unsub2) {
      unsub2 = onSnapshot(q2, (snap2) => {
        combine(snap1.docs, snap2.docs);
      });
    } else {
      combine(snap1.docs, []);
    }
  });

  return () => {
    unsub1();
    unsub2?.();
  };
}