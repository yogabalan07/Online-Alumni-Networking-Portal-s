import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronUp,
  Info,
  Search,
  X,
} from 'lucide-react';
import type { Conversation, UserProfile } from '@/types';
import { useMessages } from '@/hooks/useMessages';
import { usePresence } from '@/hooks/usePresence';
import { listenTyping, setTyping, clearTyping } from '@/services/chat';
import { uploadChatAttachment } from '@/services/storage';
import { MessageBubble } from './MessageBubble';
import { ChatComposer } from './ChatComposer';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import { cn, formatFullDate, getErrorMessage, timeAgo } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';

interface ChatWindowProps {
  conversation: Conversation;
  me: UserProfile;
  otherUser: UserProfile | null;
  onBack: () => void;
  onViewProfile: (user: UserProfile) => void;
}

export function ChatWindow({ conversation, me, otherUser, onBack, onViewProfile }: ChatWindowProps) {
  const { success, error } = useToast();
  const { messages, loading, hasOlder, loadOlder, send, removeMessage } = useMessages(
    conversation.id,
    me.uid,
  );
  const { isOnline, lastChanged } = usePresence(otherUser?.uid);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [pendingOverlay, setPendingOverlay] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<number | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    const unsub = listenTyping(conversation.id, me.uid, setTypingUsers);
    return () => {
      unsub();
      clearTyping(conversation.id, me.uid);
    };
  }, [conversation.id, me.uid]);

  const otherIsTyping = typingUsers.length > 0;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (nearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, otherIsTyping]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [conversation.id]);

  const onTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      setTyping(conversation.id, me.uid, true);
    }
    if (typingTimeout.current) window.clearTimeout(typingTimeout.current);
    typingTimeout.current = window.setTimeout(() => {
      isTypingRef.current = false;
      setTyping(conversation.id, me.uid, false);
    }, 2500);
  }, [conversation.id, me.uid]);

  const handleSendText = useCallback(
    async (text: string) => {
      if (!otherUser?.uid) return;
      await send(otherUser.uid, text, 'text');
    },
    [otherUser?.uid, send],
  );

  const handleSendFile = useCallback(
    async (
      file: File,
      kind: 'image' | 'document',
      caption: string,
      onProgress: (p: number) => void,
    ) => {
      if (!otherUser?.uid) return;
      setPendingOverlay(true);
      try {
        const uploaded = await uploadChatAttachment(conversation.id, me.uid, kind, file, onProgress);
        await send(otherUser.uid, caption, kind, uploaded);
      } finally {
        setPendingOverlay(false);
      }
    },
    [conversation.id, me.uid, otherUser?.uid, send],
  );

  const handleDelete = useCallback(
    async (messageId: string) => {
      try {
        setPendingOverlay(true);
        await removeMessage(messageId);
      } catch (e) {
        error(getErrorMessage(e, 'Message could not be deleted.'));
      } finally {
        setPendingOverlay(false);
      }
    },
    [removeMessage, error],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return messages;
    const q = search.toLowerCase();
    return messages.filter(
      (m) => !m.deleted && m.content?.toLowerCase().includes(q),
    );
  }, [messages, search]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-chat-bg chat-pattern">
      <div className="flex items-center gap-2 border-b bg-card px-3 py-2">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onBack} aria-label="Back to conversations">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <button
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          onClick={() => otherUser && onViewProfile(otherUser)}
        >
          <Avatar
            src={otherUser?.profileImageUrl}
            name={otherUser?.name ?? 'User'}
            size="md"
            showStatus
            status={isOnline ? 'online' : 'offline'}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{otherUser?.name ?? 'Unknown user'}</p>
            <p className="truncate text-xs text-muted-foreground">
              {otherIsTyping
                ? 'typing…'
                : isOnline
                  ? 'Online'
                  : lastChanged
                    ? `Last seen ${timeAgo(lastChanged)}`
                    : 'Offline'}
            </p>
          </div>
        </button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setSearchOpen((v) => !v);
            setSearch('');
          }}
          aria-label="Search messages"
        >
          <Search className="h-5 w-5" />
        </Button>
        {otherUser && (
          <Button variant="ghost" size="icon" onClick={() => onViewProfile(otherUser)} aria-label="View profile">
            <Info className="h-5 w-5" />
          </Button>
        )}
      </div>

      {searchOpen && (
        <div className="flex items-center gap-2 border-b bg-card px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages in this chat…"
            className="flex-1 bg-transparent text-sm focus-visible:outline-none"
            aria-label="Search messages"
          />
          <button onClick={() => { setSearch(''); setSearchOpen(false); }} aria-label="Close search">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-5">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="ml-auto h-10 w-40" />
            <Skeleton className="h-10 w-52" />
            <Skeleton className="ml-auto h-10 w-32" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={search ? 'No matching messages' : 'No messages yet'}
            description={search ? 'Try a different search term.' : 'Say hello to start the conversation.'}
            className="border-none bg-transparent"
          />
        ) : (
          <>
            {hasOlder && !search && (
              <div className="flex justify-center">
                <Button variant="outline" size="sm" onClick={loadOlder}>
                  <ChevronUp className="h-3.5 w-3.5" /> Load older messages
                </Button>
              </div>
            )}
            {groups.map((group) => (
              <div key={group.label} className="space-y-2">
                <div className="flex justify-center">
                  <span className="rounded-full bg-background/80 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm">
                    {group.label}
                  </span>
                </div>
                {group.messages.map((m) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    isOwn={m.senderId === me.uid}
                    onDelete={(msg) => handleDelete(msg.id)}
                    onImageClick={setLightbox}
                  />
                ))}
              </div>
            ))}
          </>
        )}
        {otherIsTyping && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-chat-received px-4 py-2.5 shadow-sm">
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {pendingOverlay && (
        <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-muted">
          <div className="h-full w-1/3 animate-pulse bg-primary" />
        </div>
      )}

      <ChatComposer
        onSendText={handleSendText}
        onSendFile={handleSendFile}
        disabled={!otherUser}
        onTyping={onTyping}
      />

      <Modal open={Boolean(lightbox)} onClose={() => setLightbox(null)} size="xl">
        {lightbox && (
          <img src={lightbox} alt="Shared attachment" className="max-h-[80vh] w-full object-contain" />
        )}
      </Modal>
    </div>
  );
}

function groupByDate(messages: ReturnType<typeof useMessages>['messages']) {
  const groups: { label: string; messages: typeof messages }[] = [];
  messages.forEach((m) => {
    const label = formatFullDate(m.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.messages.push(m);
    } else {
      groups.push({ label, messages: [m] });
    }
  });
  return groups;
}
