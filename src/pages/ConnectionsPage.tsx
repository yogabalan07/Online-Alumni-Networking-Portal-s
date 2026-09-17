import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ban, Check, MessageSquare, UserCheck, UserMinus, UserPlus, X } from 'lucide-react';
import type { Connection, UserProfile } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useConnections } from '@/hooks/useConnections';
import { useUsersByIds } from '@/hooks/useUsersByIds';
import {
  blockConnection,
  removeConnection,
  respondToConnectionRequest,
} from '@/services/connections';
import { getConversationId } from '@/services/chat';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Tabs } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { ListSkeleton } from '@/components/ui/skeleton';
import { getErrorMessage, timeAgo, tsNum } from '@/lib/utils';

export default function ConnectionsPage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const { connections, loading } = useConnections(user?.uid);
  const [tab, setTab] = useState('requests');

  const partnerIds = useMemo(() => {
    const ids: string[] = [];
    connections.forEach((c) => {
      ids.push(c.requesterId, c.recipientId);
    });
    return ids;
  }, [connections]);

  const users = useUsersByIds(partnerIds);

  if (!user) return null;

  const incoming = connections.filter((c) => c.recipientId === user.uid && c.status === 'pending');
  const outgoing = connections.filter((c) => c.requesterId === user.uid && c.status === 'pending');
  const accepted = connections.filter((c) => c.status === 'accepted');
  const blocked = connections.filter((c) => c.status === 'blocked');

  const otherId = (c: Connection) =>
    c.participantIds?.find((id) => id !== user.uid) ??
    (c.requesterId === user.uid ? c.recipientId : c.requesterId);

  const accept = async (c: Connection) => {
    try {
      await respondToConnectionRequest(c, true, user.name);
      success('Connection accepted. You can now chat.');
    } catch (e) {
      error(getErrorMessage(e, 'Could not accept the request.'));
    }
  };

  const reject = async (c: Connection) => {
    try {
      await respondToConnectionRequest(c, false, user.name);
      success('Connection request declined.');
    } catch (e) {
      error(getErrorMessage(e, 'Could not decline the request.'));
    }
  };

  const remove = async (c: Connection) => {
    try {
      await removeConnection(c);
      success('Connection removed.');
    } catch (e) {
      error(getErrorMessage(e, 'Could not remove the connection.'));
    }
  };

  const block = async (c: Connection) => {
    try {
      await blockConnection(c);
      success('User blocked.');
    } catch (e) {
      error(getErrorMessage(e, 'Could not block the user.'));
    }
  };

  const openChat = (uid: string) => {
    navigate(`/messages/${getConversationId(user.uid, uid)}?to=${uid}`);
  };

  const renderRow = (
    c: Connection,
    actions: React.ReactNode,
    subtitle: string,
  ) => {
    const other = users[otherId(c)] as UserProfile | undefined;
    return (
      <li key={c.id} className="flex items-center gap-3 py-3">
        <Avatar src={other?.profileImageUrl} name={other?.name ?? 'User'} size="md" showStatus status={other?.isOnline ? 'online' : 'offline'} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{other?.name ?? 'User'}</p>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">{actions}</div>
      </li>
    );
  };

  const tabs = [
    { value: 'requests', label: 'Requests', badge: incoming.length },
    { value: 'sent', label: 'Sent', badge: outgoing.length },
    { value: 'connected', label: 'Connections', badge: accepted.length },
    { value: 'blocked', label: 'Blocked', badge: blocked.length },
  ];

  return (
    <div>
      <PageHeader
        title="Connections"
        description="Manage your network, accept requests and start conversations."
      />

      <Tabs value={tab} onValueChange={setTab} items={tabs} className="mb-4 flex-wrap" />

      {loading ? (
        <ListSkeleton count={4} />
      ) : (
        <Card className="px-5 py-2">
          {tab === 'requests' &&
            (incoming.length === 0 ? (
              <EmptyState icon={UserPlus} title="No pending requests" description="New connection requests will appear here." className="border-none" />
            ) : (
              <ul className="divide-y">
                {incoming.map((c) =>
                  renderRow(
                    c,
                    <>
                      <Button size="sm" variant="success" onClick={() => accept(c)}>
                        <Check className="h-3.5 w-3.5" /> Accept
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => reject(c)}>
                        <X className="h-3.5 w-3.5" /> Decline
                      </Button>
                    </>,
                    `Requested ${timeAgo(tsNum(c.createdAt))}`,
                  ),
                )}
              </ul>
            ))}

          {tab === 'sent' &&
            (outgoing.length === 0 ? (
              <EmptyState icon={UserCheck} title="No sent requests" description="Requests you send will appear here until they are accepted." className="border-none" />
            ) : (
              <ul className="divide-y">
                {outgoing.map((c) =>
                  renderRow(
                    c,
                    <span className="text-xs text-muted-foreground">Awaiting response</span>,
                    `Sent ${timeAgo(tsNum(c.createdAt))}`,
                  ),
                )}
              </ul>
            ))}

          {tab === 'connected' &&
            (accepted.length === 0 ? (
              <EmptyState icon={UserCheck} title="No connections yet" description="Start connecting with alumni from the directory." className="border-none" />
            ) : (
              <ul className="divide-y">
                {accepted.map((c) =>
                  renderRow(
                    c,
                    <>
                      <Button size="sm" onClick={() => openChat(otherId(c))}>
                        <MessageSquare className="h-3.5 w-3.5" /> Message
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => remove(c)}>
                        <UserMinus className="h-3.5 w-3.5" /> Remove
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => block(c)} aria-label="Block user">
                        <Ban className="h-3.5 w-3.5" />
                      </Button>
                    </>,
                    otherId(c) && users[otherId(c)]
                      ? `${(users[otherId(c)] as UserProfile).jobRole || 'Connected'}`
                      : 'Connected',
                  ),
                )}
              </ul>
            ))}

          {tab === 'blocked' &&
            (blocked.length === 0 ? (
              <EmptyState icon={Ban} title="No blocked users" className="border-none" />
            ) : (
              <ul className="divide-y">
                {blocked.map((c) =>
                  renderRow(
                    c,
                    <Button size="sm" variant="outline" onClick={() => remove(c)}>
                      Unblock
                    </Button>,
                    'Blocked',
                  ),
                )}
              </ul>
            ))}
        </Card>
      )}
    </div>
  );
}