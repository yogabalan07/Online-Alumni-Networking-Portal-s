import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { Conversation, UserProfile } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations } from '@/hooks/useConversations';
import { useConnections } from '@/hooks/useConnections';
import { useUsersByIds } from '@/hooks/useUsersByIds';
import { usePresence } from '@/hooks/usePresence';
import { getConversationId } from '@/services/chat';
import { sendConnectionRequest, respondToConnectionRequest } from '@/services/connections';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { UserProfileModal } from '@/components/shared/UserProfileModal';
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/contexts/ToastContext';
import { getErrorMessage } from '@/lib/utils';

export default function MessagesPage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const [searchParams] = useSearchParams();
  const toParam = searchParams.get('to');

  const { conversations, loading } = useConversations(user?.uid);
  const { byOther } = useConnections(user?.uid);
  const [profileOpen, setProfileOpen] = useState(false);

  const selectedConversation: Conversation | null = useMemo(() => {
    if (!user) return null;
    const real = conversations.find((c) => c.id === conversationId);
    if (real) return real;
    if (toParam && toParam !== user.uid && conversationId === getConversationId(user.uid, toParam)) {
      return {
        id: conversationId,
        participantIds: [user.uid, toParam].sort(),
        unreadCounts: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }
    return null;
  }, [conversations, conversationId, toParam, user]);

  const partnerIds = useMemo(() => {
    const ids = conversations
      .map((c) => c.participantIds.find((id) => id !== user?.uid) ?? '')
      .filter(Boolean);
    if (toParam) ids.push(toParam);
    return ids;
  }, [conversations, toParam, user?.uid]);

  const users = useUsersByIds(partnerIds);

  const otherUid = selectedConversation?.participantIds.find((id) => id !== user?.uid) ?? toParam ?? undefined;
  const otherUser = otherUid ? users[otherUid] ?? null : null;
  const { isOnline } = usePresence(otherUser?.uid);

  useEffect(() => {
    if (!user || !conversationId) return;
    if (conversationId && !selectedConversation) {
      const target = searchParams.get('to');
      if (!target) {
        navigate('/messages', { replace: true });
      }
    }
  }, [user, conversationId, selectedConversation, navigate, searchParams]);

  if (!user) return null;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;

  const selectConversation = (id: string) => {
    navigate(`/messages/${id}`);
  };

  const connect = async (target: UserProfile) => {
    try {
      await sendConnectionRequest(user.uid, target.uid, user.name);
      success(`Connection request sent to ${target.name}.`);
    } catch (e) {
      error(getErrorMessage(e, 'Could not send connection request.'));
    }
  };

  const accept = async (target: UserProfile) => {
    const connection = byOther.get(target.uid);
    if (!connection) return;
    try {
      await respondToConnectionRequest(connection, true, user.name);
      success('Connection accepted.');
    } catch (e) {
      error(getErrorMessage(e, 'Could not accept the request.'));
    }
  };

  return (
    <div>
      <PageHeader
        title="Messages"
        description="Chat in real time with your connections."
      />

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex h-[calc(100dvh-13rem)] min-h-[420px]">
          <div
            className={
              selectedConversation
                ? 'hidden w-full lg:block lg:w-80 lg:shrink-0'
                : 'w-full lg:block lg:w-80 lg:shrink-0'
            }
          >
            <ConversationList
              conversations={conversations}
              users={users}
              meUid={user.uid}
              selectedId={conversationId}
              onSelect={selectConversation}
              loading={loading}
            />
          </div>

          <div className={selectedConversation ? 'flex min-w-0 flex-1 flex-col' : 'hidden min-w-0 flex-1 lg:flex'}>
            {selectedConversation ? (
              <ChatWindow
                conversation={selectedConversation}
                me={user}
                otherUser={otherUser}
                onBack={() => navigate('/messages')}
                onViewProfile={() => setProfileOpen(true)}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 bg-chat-bg chat-pattern text-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <MessageSquarePlaceholder />
                </div>
                <h3 className="text-sm font-semibold">Your messages</h3>
                <p className="max-w-xs text-sm text-muted-foreground">
                  Select a conversation to start chatting, or connect with alumni to begin a new one.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {otherUser?.isOnline ? `${otherUser.name} is online` : ''}
      </p>

      <UserProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        profile={otherUser}
        me={user}
        connection={otherUser ? byOther.get(otherUser.uid) ?? null : null}
        onConnect={connect}
        onAccept={accept}
      />
    </div>
  );
}

function MessageSquarePlaceholder() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-primary">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}