import { useState } from 'react';
import { LogOut, Mail, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getErrorMessage } from '@/lib/utils';

export default function SettingsPage() {
  const { user, logout, resetPassword } = useAuth();
  const { success, error: toastError } = useToast();
  const [sendingReset, setSendingReset] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    try {
      await resetPassword(user.email);
      success('Password reset email sent. Check your inbox.');
    } catch (err) {
      toastError(getErrorMessage(err, 'Failed to send reset email.'));
    } finally {
      setSendingReset(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      toastError(getErrorMessage(err, 'Failed to log out.'));
      setLoggingOut(false);
    }
  };

  if (!user) return null;

  return (
    <div>
      <PageHeader title="Settings" description="Manage your account settings." />

      <div className="space-y-5 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{user.email}</p>
                <p className="text-xs text-muted-foreground">Email address</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium capitalize">{user.role}</p>
                <p className="text-xs text-muted-foreground">Account role</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Receive a password reset link at your registered email address.
            </p>
            <Button variant="outline" disabled={sendingReset} onClick={handlePasswordReset}>
              {sendingReset ? 'Sending…' : 'Send password reset email'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" disabled={loggingOut} onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              {loggingOut ? 'Logging out…' : 'Log out'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
