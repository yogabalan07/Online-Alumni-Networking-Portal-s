import { useEffect, useMemo, useState } from 'react';
import type { NotificationItem } from '@/types';
import { countUnread, listenNotifications } from '@/services/notifications';

export function useNotifications(recipientId: string | undefined) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!recipientId) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = listenNotifications(recipientId, (list) => {
      setNotifications(list);
      setLoading(false);
    });
    return unsub;
  }, [recipientId]);

  const unread = useMemo(() => (recipientId ? countUnread(notifications) : 0), [notifications, recipientId]);

  return { notifications, unread, loading };
}