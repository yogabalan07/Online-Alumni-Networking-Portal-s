import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as fbUpdateProfile,
  type User,
} from 'firebase/auth';
import { setDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/firebase';
import type { UserProfile, UserRole } from '@/types';
import { uploadProfilePhoto } from './storage';
import { incrementStat } from './stats';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
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
  photoFile?: File | null;
}

export async function registerWithEmail(input: RegisterInput): Promise<UserProfile> {
  const { user } = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);

  await fbUpdateProfile(user, { displayName: input.name });

  const profile: Omit<UserProfile, 'uid'> = {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    role: input.role,
    department: input.department?.trim() || undefined,
    batch: input.batch?.trim() || undefined,
    rollNumber: input.rollNumber?.trim() || undefined,
    graduationYear: input.graduationYear?.trim() || undefined,
    company: input.role === 'alumni' ? input.company?.trim() : undefined,
    jobRole: input.role === 'alumni' ? input.jobRole?.trim() : undefined,
    skills: input.skills?.length ? input.skills : undefined,
    location: input.role === 'alumni' ? input.location?.trim() : undefined,
    bio: input.role === 'alumni' ? input.bio?.trim() : undefined,
    linkedIn: input.linkedIn?.trim() || undefined,
    verified: input.role === 'alumni' ? false : undefined,
    isActive: true,
    isOnline: true,
  };

  await setDoc(doc(db, 'users', user.uid), {
    ...profile,
    nameLower: input.name.trim().toLowerCase(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await incrementStat('totalUsers');
  await incrementStat(input.role === 'student' ? 'students' : 'alumni');

  let photoUrl = '';
  if (input.photoFile) {
    try {
      photoUrl = await uploadProfilePhoto(user.uid, input.photoFile);
      await updateDoc(doc(db, 'users', user.uid), {
        profileImageUrl: photoUrl,
        updatedAt: serverTimestamp(),
      });
    } catch {
      // Profile photo upload failed; account still created. User can add later.
    }
  }

  const snap = {
    uid: user.uid,
    ...profile,
    profileImageUrl: photoUrl || (user.photoURL ?? undefined),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  } as UserProfile;

  return snap;
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  return (await signInWithEmailAndPassword(auth, email.trim(), password)).user;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export function getCurrentAuthUser(): User | null {
  return auth.currentUser;
}

export function getAuthToken(): Promise<string> {
  return auth.currentUser ? auth.currentUser.getIdToken() : Promise.reject(new Error('Not signed in'));
}