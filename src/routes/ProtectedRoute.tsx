import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FullPageLoader } from '@/components/ui/select';
import type { UserRole } from '@/types';

export function ProtectedRoute({
  children,
  allow,
}: {
  children: ReactNode;
  allow?: UserRole[];
}) {
  const { user, authLoading, roleSelectionPending } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-screen">
        <FullPageLoader />
      </div>
    );
  }

  // First-time Google user hasn't chosen a role yet — send to role selection.
  if (roleSelectionPending && !user) {
    return <Navigate to="/role-selection" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  console.log('[ProtectedRoute] User role:', user.role, 'Path:', location.pathname, 'Allowed:', allow);

  if (allow && !allow.includes(user.role)) {
    // Redirect to the user's own dashboard based on their actual role.
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user, authLoading, roleSelectionPending } = useAuth();
  if (authLoading) {
    return (
      <div className="min-h-screen">
        <FullPageLoader />
      </div>
    );
  }

  // Allow role-selection page even when not fully authenticated.
  // This is handled by the RoleSelectionPage route being outside PublicOnlyRoute.

  if (user) {
    console.log('[PublicOnlyRoute] User already authenticated, role:', user.role, 'redirecting to dashboard');
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  // If role selection is pending, don't redirect to login — let them complete selection.
  if (roleSelectionPending) {
    return <Navigate to="/role-selection" replace />;
  }

  return <>{children}</>;
}
