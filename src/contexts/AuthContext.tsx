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
import type { UserProfile } from '@/types';
import * as authService from '@/services/auth';
import { getUser, watchUser } from '@/services/users';
import { initPresence, setOfflineNow } from '@/services/presence';

interface AuthContextValue {
  user: UserProfile | null;
  authUser: User | null;
  authLoading: boolean;
  profileLoading: boolean;
  disabledNotice: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (input: authService.RegisterInput) => Promise<UserProfile>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [disabledNotice, setDisabledNotice] = useState<string | null>(null);
  const unsubUserRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let active = true;

    // Handle redirect result from Google sign-in on page load.
    authService.handleGoogleRedirectResult().catch(() => {});

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
          // First-time Google user — create profile from Firebase Auth data.
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
            console.error('[AuthContext] Failed to create Google profile:', err);
            // Profile creation failed — sign out to prevent stuck state.
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

    const handleBeforeUnload = () => {
      if (auth.currentUser) void setOfflineNow(auth.currentUser.uid);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      active = false;
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

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      authUser,
      authLoading,
      profileLoading,
      disabledNotice,
      login,
      loginWithGoogle,
      register,
      logout,
      resetPassword,
      refreshProfile,
    }),
    [user, authUser, authLoading, profileLoading, disabledNotice, login, loginWithGoogle, register, logout, resetPassword, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
