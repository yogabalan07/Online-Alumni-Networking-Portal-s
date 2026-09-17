import { useMemo, useState } from 'react';
import { MessageSquarePlus, Search } from 'lucide-react';
import type { Conversation, UserProfile } from '@/types';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { cn, formatTime, tsNum } from '@/lib/utils';

interface ConversationListProps {
  conversations: Conversation[];
  users: Record<string, UserProfile>;
  meUid: string;
  selectedId?: string;
  onSelect: (conversationId: string) => void;
  loading?: boolean;
}

export function ConversationList({
  conversations,
  users,
  meUid,
  selectedId,
  onSelect,
  loading,
}: ConversationListProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return conversations;
    const q = query.toLowerCase();
    return conversations.filter((c) => {
      const other = users[c.participantIds.find((id) => id !== meUid) ?? ''];
      return (
        other?.name?.toLowerCase().includes(q) ||
        c.lastMessage?.toLowerCase().includes(q)
      );
    });
  }, [conversations, query, users, meUid]);

  return (
    <div className="flex h-full min-h-0 flex-col border-r bg-card">
      <div className="border-b p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations…"
            aria-label="Search conversations"
            className="h-9 w-full rounded-full border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-1 p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg p-2">
                <div className="h-11 w-11 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={MessageSquarePlus}
            title={query ? 'No conversations found' : 'No conversations yet'}
            description={
              query
                ? 'Try a different search.'
                : 'Connect with alumni and start chatting — your conversations appear here.'
            }
            className="border-none"
          />
        ) : (
          <ul className="divide-y">
            {filtered.map((c) => {
              const otherId = c.participantIds.find((id) => id !== meUid) ?? '';
              const other = users[otherId];
              const unread = c.unreadCounts?.[meUid] ?? 0;
              const active = selectedId === c.id;
              return (
                <li key={c.id}>
                  <button
                    onClick={() => onSelect(c.id)}
                    className={cn(
                      'flex w-full items-center gap-3 px-3 py-3 text-left transition-colors',
                      active ? 'bg-primary/10' : 'hover:bg-muted/60',
                    )}
                  >
                    <Avatar
                      src={other?.profileImageUrl}
                      name={other?.name ?? 'User'}
                      size="md"
                      showStatus
                      status={other?.isOnline ? 'online' : 'offline'}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{other?.name ?? 'User'}</p>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatTime(tsNum(c.lastMessageAt ?? c.updatedAt))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs text-muted-foreground">
                          {c.lastMessageSenderId === meUid ? 'You: ' : ''}
                          {c.lastMessageType === 'image'
                            ? '📷 Photo'
                            : c.lastMessageType === 'document'
                              ? '📄 Document'
                              : c.lastMessage || 'Start the conversation'}
                        </p>
                        {unread > 0 && (
                          <Badge className="shrink-0 bg-primary">
                            {unread > 99 ? '99+' : unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}