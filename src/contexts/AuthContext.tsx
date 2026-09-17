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
  disabledNotice: string | null;
  login: (email: string, password: string) => Promise<void>;
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
  const [disabledNotice, setDisabledNotice] = useState<string | null>(null);
  const unsubUserRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let active = true;
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!active) return;
      setAuthUser(fbUser);

      if (fbUser) {
        const profile = await getUser(fbUser.uid).catch(() => null);
        if (!active) return;

        if (!profile) {
          await authService.logout().catch(() => undefined);
          setUser(null);
          setAuthLoading(false);
          return;
        }

        if (!profile.isActive) {
          setDisabledNotice(
            'Your account has been disabled. Please contact an administrator.',
          );
          await authService.logout().catch(() => undefined);
          setUser(null);
          setAuthLoading(false);
          return;
        }

        setDisabledNotice(null);
        setUser(profile);
        setAuthLoading(false);
        initPresence(profile.uid);

        // Live watch so admins' deactivation / role changes apply immediately.
        unsubUserRef.current?.();
        unsubUserRef.current = null;
        watchUser(profile.uid, (up) => {
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
      } else {
        unsubUserRef.current?.();
        unsubUserRef.current = null;
        setUser(null);
        setAuthLoading(false);
      }
    });

    window.addEventListener('beforeunload', () => {
      if (authUser) void setOfflineNow(authUser.uid);
    });

    return () => {
      active = false;
      unsub();
      unsubUserRef.current?.();
    };
  }, [authUser]);

  const login = useCallback(async (email: string, password: string) => {
    await authService.loginWithEmail(email, password);
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
      disabledNotice,
      login,
      register,
      logout,
      resetPassword,
      refreshProfile,
    }),
    [user, authUser, authLoading, disabledNotice, login, register, logout, resetPassword, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}