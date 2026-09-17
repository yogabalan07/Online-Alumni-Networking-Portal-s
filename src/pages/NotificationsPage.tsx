import { useState } from 'react';
import {
  Bell,
  BellOff,
  CheckCheck,
  Briefcase,
  CalendarDays,
  GraduationCap,
  MessageSquare,
  Shield,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import {
  markNotificationRead,
  markAllNotificationsRead,
} from '@/services/notifications';
import { useToast } from '@/contexts/ToastContext';
import { timeAgo, getErrorMessage } from '@/lib/utils';
import type { NotificationType } from '@/types';

const TYPE_ICONS: Record<NotificationType, typeof Bell> = {
  connection_request: UserPlus,
  connection_accepted: UserCheck,
  new_message: MessageSquare,
  mentorship_request: GraduationCap,
  mentorship_accepted: GraduationCap,
  new_job: Briefcase,
  new_internship: Briefcase,
  event: CalendarDays,
  admin: Shield,
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const { notifications, unread, loading } = useNotifications(user?.uid);
  const { success, error: toastError } = useToast();
  const [markingAll, setMarkingAll] = useState(false);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
    } catch (err) {
      toastError(getErrorMessage(err, 'Could not mark notification as read.'));
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsRead(user.uid);
      success('All notifications marked as read.');
    } catch (err) {
      toastError(getErrorMessage(err, 'Could not mark all as read.'));
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Stay up to date with your activity."
        actions={
          unread > 0 ? (
            <Button
              variant="outline"
              size="sm"
              disabled={markingAll}
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="h-4 w-4" />
              {markingAll ? 'Marking…' : 'Mark all as read'}
            </Button>
          ) : undefined
        }
      />

      {!loading && notifications.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="No notifications"
          description="You're all caught up. New activity will appear here."
        />
      ) : (
        <div className="space-y-2 max-w-3xl">
          {notifications.map((n) => {
            const Icon = TYPE_ICONS[n.type] ?? Bell;
            return (
              <Card
                key={n.id}
                className={!n.read ? 'border-primary/30 bg-primary/5' : ''}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="rounded-lg bg-muted p-2 shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && (
                    <Button
                      variant="ghost"
                      size="iconSm"
                      onClick={() => handleMarkRead(n.id)}
                      aria-label="Mark as read"
                    >
                      <CheckCheck className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
