import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute, PublicOnlyRoute } from './ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { FullPageLoader } from '@/components/ui/select';

import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import RoleSelectionPage from '@/pages/auth/RoleSelectionPage';
import DashboardPage from '@/pages/DashboardPage';
import AlumniDirectoryPage from '@/pages/AlumniDirectoryPage';
import MessagesPage from '@/pages/MessagesPage';
import ConnectionsPage from '@/pages/ConnectionsPage';
import MentorshipPage from '@/pages/MentorshipPage';
import JobsPage from '@/pages/JobsPage';
import EventsPage from '@/pages/EventsPage';
import NotificationsPage from '@/pages/NotificationsPage';
import ProfilePage from '@/pages/ProfilePage';
import SettingsPage from '@/pages/SettingsPage';
import NotFoundPage from '@/pages/NotFoundPage';

import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminVerificationPage from '@/pages/admin/AdminVerificationPage';
import AdminJobsPage from '@/pages/admin/AdminJobsPage';
import AdminEventsPage from '@/pages/admin/AdminEventsPage';
import AdminReportsPage from '@/pages/admin/AdminReportsPage';
import AdminPlatformPage from '@/pages/admin/AdminPlatformPage';
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage';

function RoleHome() {
  const { user, authLoading } = useAuth();
  if (authLoading) {
    return (
      <div className="min-h-screen">
        <FullPageLoader />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  console.log('[RoleHome] User role:', user.role, 'Redirecting to:', user.role === 'admin' ? '/admin' : '/dashboard');
  return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Role selection for first-time Google users — accessible without a full profile. */}
      <Route path="/role-selection" element={<RoleSelectionPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/alumni" element={<AlumniDirectoryPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/messages/:conversationId" element={<MessagesPage />} />
        <Route path="/connections" element={<ConnectionsPage />} />
        <Route path="/mentorship" element={<MentorshipPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute allow={['admin']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/verification" element={<AdminVerificationPage />} />
        <Route path="/admin/jobs" element={<AdminJobsPage />} />
        <Route path="/admin/events" element={<AdminEventsPage />} />
        <Route path="/admin/reports" element={<AdminReportsPage />} />
        <Route path="/admin/platform" element={<AdminPlatformPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
      </Route>

      <Route path="/" element={<RoleHome />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}