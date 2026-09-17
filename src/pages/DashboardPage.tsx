import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  Check,
  GraduationCap,
  MessageSquare,
  Search,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import type { EventItem, Job, UserProfile } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useConversations } from '@/hooks/useConversations';
import { useConnections } from '@/hooks/useConnections';
import { useMentorship } from '@/hooks/useMentorship';
import { useUserMap } from '@/hooks/useUserMap';
import { listenJobs } from '@/services/jobs';
import { listenEvents } from '@/services/events';
import { searchAlumni } from '@/services/users';
import { getConversationId } from '@/services/chat';
import { respondToConnectionRequest, sendConnectionRequest } from '@/services/connections';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { StatCard } from '@/components/shared/StatCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { formatTime, getErrorMessage, timeAgo, tsNum } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

function useProfileCompletion(user: UserProfile): number {
  return useMemo(() => {
    const fields: (string | string[] | undefined)[] = [
      user.name,
      user.email,
      user.profileImageUrl,
      user.department,
      user.bio,
      user.location,
      user.skills?.length ? user.skills : undefined,
      user.role === 'alumni' ? user.company : user.batch,
      user.role === 'alumni' ? user.jobRole : user.rollNumber,
      user.role === 'alumni' ? user.graduationYear : user.batch,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [user]);
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { conversations } = useConversations(user?.uid);
  const { incomingPending } = useConnections(user?.uid);
  const { requests: mentorshipRequests } = useMentorship(user?.uid);
  const completion = useProfileCompletion(user!);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [recommended, setRecommended] = useState<UserProfile[]>([]);
  const [loadingRecommended, setLoadingRecommended] = useState(true);

  const recentConversations = conversations.slice(0, 5);
  const conversationPartnerIds = recentConversations
    .map((c) => c.participantIds.find((id) => id !== user?.uid) ?? '')
    .filter(Boolean);
  const requesterIds = incomingPending.map((c) => c.requesterId);
  const mentorshipPartnerIds = mentorshipRequests
    .slice(0, 5)
    .map((r) => (r.studentId === user?.uid ? r.alumniId : r.studentId));
  const userMap = useUserMap([
    ...conversationPartnerIds,
    ...requesterIds,
    ...mentorshipPartnerIds,
  ]);

  useEffect(() => {
    const unsubJobs = listenJobs(setJobs, undefined, 5);
    const unsubEvents = listenEvents((list) => {
      setEvents(list.filter((e) => tsNum(e.date) >= Date.now()).slice(0, 3));
    }, 50);
    return () => {
      unsubJobs();
      unsubEvents();
    };
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'student') {
      setLoadingRecommended(false);
      return;
    }
    let active = true;
    setLoadingRecommended(true);
    searchAlumni({}, null)
      .then((page) => {
        if (!active) return;
        setRecommended(page.items.slice(0, 4));
      })
      .catch(() => undefined)
      .finally(() => active && setLoadingRecommended(false));
    return () => {
      active = false;
    };
  }, [user]);

  if (!user) return null;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  const pendingMentorship = mentorshipRequests.filter(
    (r) => r.status === 'pending' && (user.role === 'alumni' ? r.alumniId === user.uid : r.studentId === user.uid),
  );

  const acceptConnection = async (requesterId: string) => {
    const connection = incomingPending.find((c) => c.requesterId === requesterId);
    if (!connection) return;
    try {
      await respondToConnectionRequest(connection, true, user.name);
      success('Connection accepted. You can now chat.');
    } catch (e) {
      error(getErrorMessage(e, 'Could not accept the request.'));
    }
  };

  const rejectConnection = async (requesterId: string) => {
    const connection = incomingPending.find((c) => c.requesterId === requesterId);
    if (!connection) return;
    try {
      await respondToConnectionRequest(connection, false, user.name);
      success('Connection request declined.');
    } catch (e) {
      error(getErrorMessage(e, 'Could not decline the request.'));
    }
  };

  const quickConnect = async (alumni: UserProfile) => {
    try {
      await sendConnectionRequest(user.uid, alumni.uid, user.name);
      success(`Connection request sent to ${alumni.name}.`);
    } catch (e) {
      error(getErrorMessage(e, 'Could not send connection request.'));
    }
  };

  const openChat = (otherUid: string) => {
    navigate(`/messages/${getConversationId(user.uid, otherUid)}`);
  };

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user.name.split(' ')[0]} 👋`}
        description={
          user.role === 'student'
            ? 'Discover alumni, find mentors and explore opportunities.'
            : 'Manage your connections, mentorship and opportunities.'
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Connections"
          value={incomingPending.length ? `${incomingPending.length} pending` : 'View all'}
          icon={UserCheck}
          hint={`${conversations.length} active chat${conversations.length === 1 ? '' : 's'}`}
        />
        <StatCard
          label="Mentorship"
          value={pendingMentorship.length}
          icon={Users}
          hint={pendingMentorship.length ? 'Awaiting action' : 'Up to date'}
        />
        <StatCard label="Opportunities" value={jobs.length} icon={Briefcase} hint="Latest postings" />
        <StatCard
          label="Upcoming events"
          value={events.length}
          icon={CalendarDays}
          hint="Don't miss out"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Recent conversations</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/messages')}>
                Open messages <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent>
              {recentConversations.length === 0 ? (
                <EmptyState
                  icon={MessageSquare}
                  title="No conversations yet"
                  description="Connect with alumni and start a chat to see it here."
                  action={
                    <Button size="sm" onClick={() => navigate('/alumni')}>
                      Find alumni
                    </Button>
                  }
                />
              ) : (
                <ul className="divide-y">
                  {recentConversations.map((c) => {
                    const otherId = c.participantIds.find((id) => id !== user.uid) ?? '';
                    const other = userMap[otherId];
                    const unread = c.unreadCounts?.[user.uid] ?? 0;
                    return (
                      <li key={c.id}>
                        <button
                          onClick={() => openChat(otherId)}
                          className="flex w-full items-center gap-3 py-2.5 text-left"
                        >
                          <Avatar src={other?.profileImageUrl} name={other?.name ?? 'User'} size="md" showStatus status={other?.isOnline ? 'online' : 'offline'} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{other?.name ?? 'User'}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {c.lastMessageSenderId === user.uid ? 'You: ' : ''}
                              {c.lastMessage || 'Start the conversation'}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[11px] text-muted-foreground">
                              {formatTime(tsNum(c.lastMessageAt ?? c.updatedAt))}
                            </span>
                            {unread > 0 && (
                              <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                                {unread}
                              </span>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Latest opportunities</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/jobs')}>
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <EmptyState icon={Briefcase} title="No opportunities posted yet" description="New jobs and internships will appear here." />
              ) : (
                <ul className="divide-y">
                  {jobs.map((job) => (
                    <li key={job.id} className="flex items-center gap-3 py-2.5">
                      <div className="rounded-lg bg-primary/10 p-2 text-primary">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{job.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {job.company} · {job.location}
                        </p>
                      </div>
                      <Badge variant={job.type === 'job' ? 'default' : 'accent'} className="capitalize">
                        {job.type}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Profile completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="relative h-16 w-16 shrink-0">
                  <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3.5" className="stroke-muted" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      className="stroke-primary"
                      strokeDasharray={`${(completion / 100) * 97.4} 97.4`}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                    {completion}%
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {completion === 100 ? 'Profile complete' : 'Complete your profile'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    A complete profile helps others connect with you.
                  </p>
                  <Button variant="link" size="sm" className="h-auto px-0" onClick={() => navigate('/profile')}>
                    Edit profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {incomingPending.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Connection requests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {incomingPending.slice(0, 3).map((c) => {
                  const requester = userMap[c.requesterId];
                  return (
                    <div key={c.id} className="flex items-center gap-2">
                      <Avatar src={requester?.profileImageUrl} name={requester?.name ?? 'User'} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{requester?.name ?? 'User'}</p>
                        <p className="text-[11px] text-muted-foreground">{timeAgo(tsNum(c.createdAt))}</p>
                      </div>
                      <Button size="iconSm" variant="success" onClick={() => acceptConnection(c.requesterId)} aria-label="Accept request">
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="iconSm" variant="outline" onClick={() => rejectConnection(c.requesterId)} aria-label="Decline request">
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
                <Button variant="link" size="sm" className="h-auto px-0" onClick={() => navigate('/connections')}>
                  Manage all requests
                </Button>
              </CardContent>
            </Card>
          )}

          {user.role === 'student' && (
            <Card>
              <CardHeader>
                <CardTitle>Recommended alumni</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loadingRecommended ? (
                  <>
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </>
                ) : recommended.length === 0 ? (
                  <EmptyState icon={GraduationCap} title="No alumni yet" />
                ) : (
                  recommended.map((a) => (
                    <div key={a.uid} className="flex items-center gap-2">
                      <Avatar src={a.profileImageUrl} name={a.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <p className="truncate text-sm font-medium">{a.name}</p>
                          <VerifiedBadge verified={a.verified} />
                        </div>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {a.jobRole || 'Alumni'}
                          {a.company ? ` at ${a.company}` : ''}
                        </p>
                      </div>
                      <Button size="iconSm" variant="outline" onClick={() => quickConnect(a)} aria-label={`Connect with ${a.name}`}>
                        <UserPlus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
                )}
                <Button variant="link" size="sm" className="h-auto px-0" onClick={() => navigate('/alumni')}>
                  Browse alumni directory
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Upcoming events</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/events')}>
                <CalendarDays className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <EmptyState icon={CalendarDays} title="No upcoming events" />
              ) : (
                <ul className="space-y-3">
                  {events.map((e) => (
                    <li key={e.id} className="flex items-start gap-3">
                      <div className="rounded-lg bg-accent px-2.5 py-1.5 text-center text-accent-foreground">
                        <p className="text-[10px] font-semibold uppercase">
                          {new Date(tsNum(e.date)).toLocaleString('default', { month: 'short' })}
                        </p>
                        <p className="text-sm font-bold leading-none">{new Date(tsNum(e.date)).getDate()}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{e.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{e.venue}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="justify-start" onClick={() => navigate('/alumni')}>
                <Search className="h-4 w-4" /> Find alumni
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => navigate('/mentorship')}>
                <Sparkles className="h-4 w-4" /> Find mentor
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => navigate('/jobs')}>
                <Briefcase className="h-4 w-4" /> Jobs
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => navigate('/events')}>
                <CalendarDays className="h-4 w-4" /> Events
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}