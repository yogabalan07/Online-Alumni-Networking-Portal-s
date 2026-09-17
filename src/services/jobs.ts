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
import type { Job, JobType } from '@/types';
import { incrementStat } from './stats';

export interface JobInput {
  type: JobType;
  title: string;
  company: string;
  description: string;
  location: string;
  employmentType?: string;
  skills: string[];
  eligibility?: string;
  applicationUrl?: string;
  deadline?: number;
}

export async function createJob(input: JobInput, postedBy: string): Promise<string> {
  const ref = await addDoc(collection(db, 'jobs'), {
    ...input,
    postedBy,
    status: 'open',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await incrementStat(input.type === 'job' ? 'jobs' : 'internships');
  return ref.id;
}

export async function updateJob(id: string, patch: Partial<JobInput>): Promise<void> {
  await updateDoc(doc(db, 'jobs', id), { ...patch, updatedAt: serverTimestamp() });
}

export async function deleteJob(id: string): Promise<void> {
  await deleteDoc(doc(db, 'jobs', id));
}

export async function setJobStatus(id: string, status: 'open' | 'closed'): Promise<void> {
  await updateDoc(doc(db, 'jobs', id), { status, updatedAt: serverTimestamp() });
}

export function listenJobs(cb: (jobs: Job[]) => void, onlyType?: JobType, pageSize = 50): () => void {
  const constr = [orderBy('createdAt', 'desc'), limit(pageSize)] as const;
  const q = onlyType
    ? query(collection(db, 'jobs'), where('type', '==', onlyType), ...constr)
    : query(collection(db, 'jobs'), ...constr);
  return onSnapshot(q, (snap) => {
    const list: Job[] = [];
    snap.forEach((s) => list.push({ id: s.id, ...s.data() } as Job));
    cb(list);
  });
}

export function listenJobApplications(
  jobId: string,
  cb: (count: number) => void,
): () => void {
  const q = query(collection(db, 'jobApplications'), where('jobId', '==', jobId));
  return onSnapshot(q, (snap) => {
    cb(snap.size);
  });
}

export async function applyToJob(
  jobId: string,
  studentId: string,
): Promise<void> {
  const existing = query(
    collection(db, 'jobApplications'),
    where('jobId', '==', jobId),
    where('studentId', '==', studentId),
  );
  const snap = await getDocs(existing);
  if (!snap.empty) {
    throw new Error('You have already applied for this opportunity.');
  }
  await addDoc(collection(db, 'jobApplications'), {
    jobId,
    studentId,
    createdAt: serverTimestamp(),
  });
}

export async function hasApplied(jobId: string, studentId: string): Promise<boolean> {
  const q = query(
    collection(db, 'jobApplications'),
    where('jobId', '==', jobId),
    where('studentId', '==', studentId),
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

export function getJob(id: string): Promise<Job | null> {
  return getDoc(doc(db, 'jobs', id)).then((s) =>
    s.exists() ? ({ id: s.id, ...s.data() } as Job) : null,
  );
}

export async function getJobApplicationsForStudent(studentId: string): Promise<string[]> {
  const q = query(
    collection(db, 'jobApplications'),
    where('studentId', '==', studentId),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data().jobId as string);
}

export { writeBatch };