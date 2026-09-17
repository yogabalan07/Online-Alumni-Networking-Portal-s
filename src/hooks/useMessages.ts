import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatMessage, MessageType } from '@/types';
import {
  loadOlderMessages,
  markConversationRead,
  sendMessage,
  deleteMessage as deleteMessageService,
  type SendMessageAttachment,
} from '@/services/chat';
import { tsNum } from '@/lib/utils';

const FIRST_PAGE = 50;

export function useMessages(convId: string | undefined, uid: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasOlder, setHasOlder] = useState(false);
  const markedRef = useRef<string>('');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
  }, []);

  useEffect(() => {
    if (!convId || !uid) {
      setMessages([]);
      setLoading(false);
      setHasOlder(false);
      return;
    }
    setMessages([]);
    setLoading(true);
    setHasOlder(false);

    let unsub: (() => void) | null = null;
    let mounted = true;

    import('@/services/chat')
      .then(({ listenMessages }) => {
        if (!mounted) return;
        unsub = listenMessages(convId, (list) => {
          if (!mounted) return;
          setMessages(list);
          setLoading(false);
          setHasOlder(list.length >= FIRST_PAGE);

          const unread = list.filter(
            (m) => m.receiverId === uid && !m.readAt && !m.deleted,
          );
          if (unread.length > 0 && markedRef.current !== convId) {
            markedRef.current = convId;
            markConversationRead(convId, uid).catch(() => undefined);
          }
        }, FIRST_PAGE);
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
      unsub?.();
      if (markedRef.current === convId) markedRef.current = '';
    };
  }, [convId, uid]);

  const loadOlder = useCallback(async () => {
    if (!convId || messages.length === 0) return;
    const earliest = tsNum(messages[0].createdAt);
    if (!earliest) return;
    try {
      const older = await loadOlderMessages(convId, earliest);
      if (older.length === 0) {
        setHasOlder(false);
        return;
      }
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        const dedup = older.filter((m) => !ids.has(m.id));
        return [...dedup, ...prev];
      });
      setHasOlder(older.length >= FIRST_PAGE);
    } catch {
      // ignore older load failures
    }
  }, [convId, messages]);

  const send = useCallback(
    async (
      receiverUid: string,
      content: string,
      type: MessageType,
      attachment?: SendMessageAttachment,
    ) => {
      if (!convId) return;
      await sendMessage(convId, uid ?? '', receiverUid, content, type, attachment);
    },
    [convId, uid],
  );

  const removeMessage = useCallback(
    async (messageId: string) => {
      if (!convId) return;
      await deleteMessageService(convId, messageId, uid ?? '');
    },
    [convId, uid],
  );

  return { messages, loading, hasOlder, loadOlder, send, removeMessage };
}