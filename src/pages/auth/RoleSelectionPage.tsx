import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { GraduationCap, Briefcase, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

export default function RoleSelectionPage() {
  const { roleSelectionPending, pendingAuthUser, completeRoleSelection, user, authLoading } = useAuth();
  const { success, error } = useToast();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If auth is still loading, show nothing (ProtectedRoute will show loader).
  if (authLoading) return null;

  // If no role selection is pending and user already has a profile, redirect to their dashboard.
  if (!roleSelectionPending && user) {
    console.log('[RoleSelection] User already has profile, redirecting to dashboard. Role:', user.role);
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  // If no role selection is pending and no user, redirect to login.
  if (!roleSelectionPending && !pendingAuthUser) {
    return <Navigate to="/login" replace />;
  }

  const onSelect = async (role: UserRole) => {
    if (submitting) return;
    setSelectedRole(role);
    setSubmitting(true);
    try {
      console.log('[RoleSelection] User selected role:', role);
      await completeRoleSelection(role);
      success(`Welcome! Your ${role} account is ready.`);
      // Navigation happens automatically — AuthContext now has the user profile,
      // so RoleHome / ProtectedRoute will redirect to the correct dashboard.
    } catch (err) {
      console.error('[RoleSelection] Failed to complete role selection:', err);
      error('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left decorative panel */}
      <div className="relative hidden flex-col justify-between bg-gradient-to-br from-primary via-primary/90 to-indigo-700 p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <GraduationCap className="h-6 w-6" />
          </div>
          <span className="text-lg font-bold">Alumni Networking Portal</span>
        </div>
        <div>
          <h1 className="max-w-md text-4xl font-extrabold leading-tight">
            Choose how you want to use the portal
          </h1>
          <p className="mt-4 max-w-md text-primary-foreground/80">
            Select your account type to get started. This determines what features you can access.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/70">
          © {new Date().getFullYear()} Alumni Networking Portal
        </p>
      </div>

      {/* Right role selection panel */}
      <div className="flex items-center justify-center bg-background px-5 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="font-bold">Alumni Networking Portal</span>
          </div>

          <h2 className="text-2xl font-bold">Welcome, {pendingAuthUser?.displayName || 'there'}!</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Before we get started, please tell us which type of account you need.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {/* Student option */}
            <button
              type="button"
              onClick={() => onSelect('student')}
              disabled={submitting}
              className={cn(
                'group relative flex flex-col items-center gap-4 rounded-xl border-2 p-6 text-center transition-all',
                selectedRole === 'student'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-primary/5',
                submitting && 'cursor-not-allowed opacity-60',
              )}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <GraduationCap className="h-8 w-8" />
              </div>
              <div>
                <p className="text-lg font-bold">Student</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Connect with alumni, find mentors, explore opportunities
                </p>
              </div>
              {submitting && selectedRole === 'student' && (
                <Loader2 className="absolute right-3 top-3 h-5 w-5 animate-spin text-primary" />
              )}
            </button>

            {/* Alumni option */}
            <button
              type="button"
              onClick={() => onSelect('alumni')}
              disabled={submitting}
              className={cn(
                'group relative flex flex-col items-center gap-4 rounded-xl border-2 p-6 text-center transition-all',
                selectedRole === 'alumni'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-primary/5',
                submitting && 'cursor-not-allowed opacity-60',
              )}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/50 text-accent-foreground transition-transform group-hover:scale-110">
                <Briefcase className="h-8 w-8" />
              </div>
              <div>
                <p className="text-lg font-bold">Alumni</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Give back, mentor students, share opportunities
                </p>
              </div>
              {submitting && selectedRole === 'alumni' && (
                <Loader2 className="absolute right-3 top-3 h-5 w-5 animate-spin text-primary" />
              )}
            </button>
          </div>

          {submitting && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Setting up your account…
            </p>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            You can complete your full profile after choosing your account type.
          </p>
        </div>
      </div>
    </div>
  );
}
