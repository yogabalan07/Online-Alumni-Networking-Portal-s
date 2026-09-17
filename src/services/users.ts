import {
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
  startAfter,
  updateDoc,
  where,
  type FieldValue,
} from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import type { UserProfile } from '@/types';
import { incrementStat } from './stats';

export interface ProfilePatch {
  name?: string;
  department?: string;
  batch?: string;
  rollNumber?: string;
  graduationYear?: string;
  company?: string;
  jobRole?: string;
  skills?: string[];
  location?: string;
  bio?: string;
  linkedIn?: string;
  profileImageUrl?: string;
}

export async function getUser(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as UserProfile;
}

export async function updateProfile(uid: string, patch: ProfilePatch): Promise<void> {
  const data: Record<string, FieldValue | string | number | boolean | string[] | null | undefined> = { ...patch, updatedAt: serverTimestamp() };
  if (patch.name) data.nameLower = patch.name.toLowerCase();
  await updateDoc(doc(db, 'users', uid), data);
}

export async function getUsersByIds(ids: string[]): Promise<Record<string, UserProfile>> {
  const result: Record<string, UserProfile> = {};
  const batches: string[][] = [];
  for (let i = 0; i < ids.length; i += 10) batches.push(ids.slice(i, i + 10));
  await Promise.all(
    batches.map(async (batch) => {
      const q = query(collection(db, 'users'), where('__name__', 'in', batch));
      const snap = await getDocs(q);
      snap.forEach((s) => {
        result[s.id] = { uid: s.id, ...s.data() } as UserProfile;
      });
    }),
  );
  return result;
}

export interface AlumniFilters {
  name?: string;
  department?: string;
  graduationYear?: string;
  company?: string;
  jobRole?: string;
  skill?: string;
  location?: string;
  verifiedOnly?: boolean;
}

export interface AlumniPage {
  items: UserProfile[];
  nextCursor: unknown | null;
}

const PAGE_SIZE = 24;

export async function searchAlumni(
  filters: AlumniFilters,
  start: unknown = null,
): Promise<AlumniPage> {
  let q = query(
    collection(db, 'users'),
    where('role', '==', 'alumni'),
    where('isActive', '==', true),
    orderBy('nameLower'),
    limit(PAGE_SIZE),
  );
  if (filters.name) {
    const prefix = filters.name.toLowerCase();
    q = query(
      q,
      where('nameLower', '>=', prefix),
      where('nameLower', '<=', prefix + '\uf8ff'),
    );
  }
  if (start) q = query(q, startAfter(start));

  const snap = await getDocs(q);
  const items: UserProfile[] = [];
  snap.forEach((s) => items.push({ uid: s.id, ...s.data() } as UserProfile));

  const filtered = items.filter((u) => {
    if (filters.department && u.department?.toLowerCase() !== filters.department.toLowerCase()) return false;
    if (filters.graduationYear && u.graduationYear !== filters.graduationYear) return false;
    if (filters.company && !u.company?.toLowerCase().includes(filters.company.toLowerCase())) return false;
    if (filters.jobRole && !u.jobRole?.toLowerCase().includes(filters.jobRole.toLowerCase())) return false;
    if (filters.skill && !(u.skills ?? []).some((s) => s.toLowerCase().includes((filters.skill ?? '').toLowerCase()))) return false;
    if (filters.location && !u.location?.toLowerCase().includes(filters.location.toLowerCase())) return false;
    if (filters.verifiedOnly && !u.verified) return false;
    return true;
  });

  // If the filtered slice was reduced below page size, fetch the next page too.
  let nextCursor: unknown = null;
  if (snap.size === PAGE_SIZE) {
    nextCursor = snap.docs[snap.docs.length - 1];
  }

  return { items: filtered, nextCursor };
}

export interface AdminUserFilter {
  query?: string;
  role?: string;
  verified?: boolean | null;
}

export async function listUsersForAdmin(filter: AdminUserFilter, start: unknown = null, pageSize = 30) {
  const constr: Parameters<typeof query>[1][] = [];
  if (filter.role) constr.push(where('role', '==', filter.role));
  if (filter.verified !== null && filter.verified !== undefined && filter.role === 'alumni') {
    constr.push(where('verified', '==', filter.verified));
  }
  constr.push(orderBy('createdAt', 'desc'));
  if (!start) constr.push(limit(pageSize));

  let q = query(collection(db, 'users'), ...constr);
  if (start) q = query(q, startAfter(start), limit(pageSize));

  const snap = await getDocs(q);
  const result: UserProfile[] = [];
  snap.forEach((s) => result.push({ uid: s.id, ...s.data() } as UserProfile));
  const items = filter.query
    ? result.filter((u) => u.name?.toLowerCase().includes(filter.query!.toLowerCase()))
    : result;
  return { items, next: snap.docs.length === pageSize ? snap.docs[snap.docs.length - 1] : null };
}

export async function setUserActive(uid: string, active: boolean): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { isActive: active, updatedAt: serverTimestamp() });
}

export async function setAlumniVerified(uid: string, verified: boolean): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { verified, updatedAt: serverTimestamp() });
  if (verified) {
    await incrementStat('verifiedAlumni');
  }
}

export async function deleteUserDoc(uid: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid));
}

export async function watchUser(uid: string, cb: (u: UserProfile | null) => void): Promise<() => void> {
  const q = doc(db, 'users', uid);
  const unsub = onSnapshot(q, (snap) => {
    if (!snap.exists()) {
      cb(null);
      return;
    }
    cb({ uid: snap.id, ...snap.data() } as UserProfile);
  });
  return unsub;
}