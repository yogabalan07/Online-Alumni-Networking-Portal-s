import { useEffect, useMemo, useState } from 'react';
import type { Conversation } from '@/types';
import { listenConversations } from '@/services/chat';
import { tsNum } from '@/lib/utils';

export function useConversations(uid: string | undefined) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setConversations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = listenConversations(uid, (list) => {
      setConversations(list);
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  const totalUnread = useMemo(() => {
    return conversations.reduce((acc, c) => acc + (c.unreadCounts?.[uid ?? ''] ?? 0), 0);
  }, [conversations, uid]);

  const sorted = useMemo(
    () =>
      [...conversations].sort(
        (a, b) => (tsNum(b.updatedAt) || tsNum(b.lastMessageAt)) - (tsNum(a.updatedAt) || tsNum(a.lastMessageAt)),
      ),
    [conversations],
  );

  return { conversations: sorted, totalUnread, loading };
}