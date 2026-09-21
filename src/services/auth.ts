import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  updateProfile as fbUpdateProfile,
  type User,
} from 'firebase/auth';
import { setDoc, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
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

/** Remove undefined values so Firestore setDoc/updateDoc doesn't reject them. */
function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
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

  await setDoc(doc(db, 'users', user.uid), stripUndefined({
    ...profile,
    nameLower: input.name.trim().toLowerCase(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }));

  // Fire-and-forget: stat increments should not block or fail registration.
  incrementStat('totalUsers').catch(() => {});
  incrementStat(input.role === 'student' ? 'students' : 'alumni').catch(() => {});

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

// ==================== GOOGLE AUTH ====================

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === 'auth/popup-blocked') {
      await signInWithRedirect(auth, googleProvider);
      return auth.currentUser!;
    }
    throw err;
  }
}

export async function handleGoogleRedirectResult(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) return result.user;
  } catch {
    // Redirect result error — caller should handle via onAuthStateChanged.
  }
  return null;
}

/** Check if a Google-authenticated user has no Firestore profile yet (first-time sign-in). */
export async function isGoogleUserNew(user: User): Promise<boolean> {
  const snap = await getDoc(doc(db, 'users', user.uid));
  return !snap.exists();
}

/**
 * Called after a first-time Google user selects their role.
 * Creates the Firestore user document with the chosen role.
 */
export async function completeGoogleRoleSelection(
  user: User,
  role: UserRole,
): Promise<UserProfile> {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);

  // If profile already exists (race condition / double-click), just return it.
  if (snap.exists()) {
    return { uid: snap.id, ...(snap.data() as Omit<UserProfile, 'uid'>) } as UserProfile;
  }

  const profile: Omit<UserProfile, 'uid'> = {
    name: user.displayName || user.email?.split('@')[0] || 'Google User',
    email: user.email || '',
    role,
    profileImageUrl: user.photoURL ?? undefined,
    isActive: true,
    isOnline: true,
    verified: role === 'alumni' ? false : undefined,
  };

  await setDoc(ref, stripUndefined({
    ...profile,
    nameLower: profile.name.toLowerCase(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }));

  console.log('[Auth] Created Google profile with role:', role, 'for uid:', user.uid);

  // Fire-and-forget: stat increments should not block or fail profile creation.
  incrementStat('totalUsers').catch(() => {});
  incrementStat(role === 'student' ? 'students' : 'alumni').catch(() => {});

  return {
    uid: user.uid,
    ...profile,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  } as UserProfile;
}

/**
 * @deprecated Use `isGoogleUserNew` + `completeGoogleRoleSelection` instead.
 * Kept for backward compatibility only.
 */
export async function getOrCreateGoogleProfile(user: User): Promise<UserProfile> {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data() as Omit<UserProfile, 'uid'>;
    const patch: Record<string, string | ReturnType<typeof serverTimestamp>> = { updatedAt: serverTimestamp() };
    if (user.displayName && user.displayName !== data.name) {
      patch.name = user.displayName;
      patch.nameLower = user.displayName.toLowerCase();
    }
    if (user.photoURL && user.photoURL !== data.profileImageUrl) {
      patch.profileImageUrl = user.photoURL;
    }
    if (Object.keys(patch).length > 1) {
      await updateDoc(ref, patch);
    }
    return { uid: snap.id, ...data, ...patch } as UserProfile;
  }

  const profile: Omit<UserProfile, 'uid'> = {
    name: user.displayName || user.email?.split('@')[0] || 'Google User',
    email: user.email || '',
    role: 'student',
    profileImageUrl: user.photoURL ?? undefined,
    isActive: true,
    isOnline: true,
  };

  await setDoc(ref, stripUndefined({
    ...profile,
    nameLower: profile.name.toLowerCase(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }));

  incrementStat('totalUsers').catch(() => {});
  incrementStat('students').catch(() => {});

  return {
    uid: user.uid,
    ...profile,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  } as UserProfile;
}