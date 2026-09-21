import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase/firebase';
import type { UserProfile, UserRole } from '@/types';
import * as authService from '@/services/auth';
import { getUser, watchUser } from '@/services/users';
import { initPresence, setOfflineNow } from '@/services/presence';

interface AuthContextValue {
  user: UserProfile | null;
  authUser: User | null;
  authLoading: boolean;
  profileLoading: boolean;
  disabledNotice: string | null;
  /** True when a first-time Google user must select a role before the profile is created. */
  roleSelectionPending: boolean;
  /** The Firebase Auth user awaiting role selection (set only when roleSelectionPending is true). */
  pendingAuthUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (input: authService.RegisterInput) => Promise<UserProfile>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** Called by the role-selection page after the user picks Student or Alumni. */
  completeRoleSelection: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [disabledNotice, setDisabledNotice] = useState<string | null>(null);
  const [roleSelectionPending, setRoleSelectionPending] = useState(false);
  const [pendingAuthUser, setPendingAuthUser] = useState<User | null>(null);
  const unsubUserRef = useRef<(() => void) | null>(null);
  const activeRef = useRef(true);

  // Stable reference to watchProfile so it can be called from both
  // the onAuthStateChanged handler and completeRoleSelection.
  const watchProfileRef = useRef<(uid: string) => void>(() => {});

  useEffect(() => {
    let active = true;
    activeRef.current = true;

    // Handle redirect result from Google sign-in on page load.
    authService.handleGoogleRedirectResult().catch(() => {});

    // Define watchProfile so it can be used inside onAuthStateChanged
    // and also stored in the ref for external callers.
    function watchProfile(uid: string) {
      unsubUserRef.current?.();
      unsubUserRef.current = null;
      watchUser(uid, (up) => {
        if (!active) return;
        if (!up) return;
        if (!up.isActive) {
          setDisabledNotice(
            'Your account has been disabled. Please contact an administrator.',
          );
          authService.logout().catch(() => undefined);
          setUser(null);
          return;
        }
        setUser((prev) => (prev && prev.uid === up.uid ? { ...up } : prev));
      }).then((u) => {
        if (active) unsubUserRef.current = u;
      });
    }

    // Store in ref so completeRoleSelection can call it.
    watchProfileRef.current = watchProfile;

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!active) return;
      setAuthUser(fbUser);

      if (fbUser) {
        // Ensure authLoading is true while fetching the Firestore profile so
        // ProtectedRoute / RoleHome render a loader instead of redirecting
        // to /login before the profile is available.
        setAuthLoading(true);
        setProfileLoading(true);
        const profile = await getUser(fbUser.uid).catch((err) => {
          console.error('[AuthContext] Failed to load user profile:', err);
          return null;
        });
        if (!active) return;

        if (!profile) {
          console.warn('[AuthContext] No Firestore profile found for uid:', fbUser.uid);

          // Check if this is a Google user.
          const isGoogleUser = fbUser.providerData.some(
            (p) => p.providerId === 'google.com',
          );

          if (isGoogleUser) {
            // First-time Google user — do NOT create profile yet.
            // Show role-selection page instead.
            console.log('[AuthContext] First-time Google user detected, prompting role selection');
            setPendingAuthUser(fbUser);
            setRoleSelectionPending(true);
            setAuthUser(fbUser);
            setAuthLoading(false);
            setProfileLoading(false);
            return;
          }

          // Non-Google user without profile — fallback.
          try {
            const newProfile = await authService.getOrCreateGoogleProfile(fbUser);
            if (!active) return;
            setDisabledNotice(null);
            setUser(newProfile);
            setAuthLoading(false);
            setProfileLoading(false);
            initPresence(newProfile.uid);
            watchProfile(newProfile.uid);
          } catch (err) {
            console.error('[AuthContext] Failed to create profile:', err);
            await authService.logout().catch(() => undefined);
            setUser(null);
            setAuthLoading(false);
            setProfileLoading(false);
          }
          return;
        }

        if (!profile.isActive) {
          setDisabledNotice(
            'Your account has been disabled. Please contact an administrator.',
          );
          await authService.logout().catch(() => undefined);
          setUser(null);
          setAuthLoading(false);
          setProfileLoading(false);
          return;
        }

        setDisabledNotice(null);
        setUser(profile);
        setAuthLoading(false);
        setProfileLoading(false);
        console.log('[AuthContext] Profile loaded — UID:', profile.uid, 'Role:', profile.role);
        initPresence(profile.uid);
        watchProfile(profile.uid);
      } else {
        unsubUserRef.current?.();
        unsubUserRef.current = null;
        setUser(null);
        setAuthLoading(false);
        setProfileLoading(false);
      }
    });

    const handleBeforeUnload = () => {
      if (auth.currentUser) void setOfflineNow(auth.currentUser.uid);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      active = false;
      activeRef.current = false;
      unsub();
      unsubUserRef.current?.();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await authService.loginWithEmail(email, password);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    await authService.signInWithGoogle();
  }, []);

  const register = useCallback(async (input: authService.RegisterInput) => {
    const profile = await authService.registerWithEmail(input);
    initPresence(profile.uid);
    return profile;
  }, []);

  const logout = useCallback(async () => {
    if (auth.currentUser) await setOfflineNow(auth.currentUser.uid);
    await authService.logout();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await authService.requestPasswordReset(email);
  }, []);

  const refreshProfile = useCallback(async () => {
    const fbUser = auth.currentUser;
    if (!fbUser) return;
    const profile = await getUser(fbUser.uid);
    if (profile) setUser(profile);
  }, []);

  const completeRoleSelection = useCallback(async (role: UserRole) => {
    const fbUser = auth.currentUser;
    if (!fbUser) throw new Error('No authenticated user');

    console.log('[AuthContext] Completing role selection:', role, 'for uid:', fbUser.uid);
    const profile = await authService.completeGoogleRoleSelection(fbUser, role);

    setPendingAuthUser(null);
    setRoleSelectionPending(false);
    setDisabledNotice(null);
    setUser(profile);
    setAuthUser(fbUser);
    initPresence(profile.uid);
    watchProfileRef.current(profile.uid);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      authUser,
      authLoading,
      profileLoading,
      disabledNotice,
      roleSelectionPending,
      pendingAuthUser,
      login,
      loginWithGoogle,
      register,
      logout,
      resetPassword,
      refreshProfile,
      completeRoleSelection,
    }),
    [user, authUser, authLoading, profileLoading, disabledNotice, roleSelectionPending, pendingAuthUser, login, loginWithGoogle, register, logout, resetPassword, refreshProfile, completeRoleSelection],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
