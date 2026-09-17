import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Sparkles, Users } from 'lucide-react';
import type { MentorshipRequest } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useMentorship } from '@/hooks/useMentorship';
import { useUsersByIds } from '@/hooks/useUsersByIds';
import { respondToMentorship } from '@/services/mentorship';
import { getConversationId } from '@/services/chat';
import { MentorshipCard } from '@/components/shared/MentorshipCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { ListSkeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/utils';

export default function MentorshipPage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const { requests, loading } = useMentorship(user?.uid);
  const [tab, setTab] = useState(user?.role === 'alumni' ? 'received' : 'sent');

  const partnerIds = useMemo(
    () => requests.flatMap((r) => [r.studentId, r.alumniId]),
    [requests],
  );
  const users = useUsersByIds(partnerIds);

  if (!user) return null;

  const received = requests.filter((r) => r.alumniId === user.uid);
  const sent = requests.filter((r) => r.studentId === user.uid);
  const active = requests.filter((r) => r.status === 'accepted');
  const completed = requests.filter((r) => r.status === 'completed');

  const respond = async (
    request: MentorshipRequest,
    status: 'accepted' | 'rejected' | 'completed',
  ) => {
    try {
      await respondToMentorship(request.id, status, user.name);
      success(
        status === 'accepted'
          ? 'Mentorship accepted.'
          : status === 'rejected'
            ? 'Mentorship request declined.'
            : 'Mentorship marked as completed.',
      );
    } catch (e) {
      error(getErrorMessage(e, 'Could not update the mentorship request.'));
    }
  };

  const openChat = (otherUid: string) => {
    navigate(`/messages/${getConversationId(user.uid, otherUid)}?to=${otherUid}`);
  };

  const renderList = (list: MentorshipRequest[], emptyTitle: string, emptyDesc: string) =>
    list.length === 0 ? (
      <EmptyState
        icon={Users}
        title={emptyTitle}
        description={emptyDesc}
        action={
          user.role === 'student' ? (
            <Button onClick={() => navigate('/alumni')}>
              <Sparkles className="h-4 w-4" /> Find a mentor
            </Button>
          ) : undefined
        }
      />
    ) : (
      <div className="grid gap-4 lg:grid-cols-2">
        {list.map((r) => (
          <MentorshipCard
            key={r.id}
            request={r}
            me={user}
            student={users[r.studentId]}
            alumni={users[r.alumniId]}
            onRespond={respond}
            onMessage={(other) => openChat(other.uid)}
          />
        ))}
      </div>
    );

  return (
    <div>
      <PageHeader
        title="Mentorship"
        description={
          user.role === 'student'
            ? 'Request guidance from experienced alumni.'
            : 'Guide students and shape the next generation.'
        }
        actions={
          user.role === 'student' ? (
            <Button onClick={() => navigate('/alumni')}>
              <Sparkles className="h-4 w-4" /> Find a mentor
            </Button>
          ) : undefined
        }
      />

      <Tabs
        value={tab}
        onValueChange={setTab}
        className="mb-4 flex-wrap"
        items={[
          { value: 'received', label: 'Received', badge: received.length },
          { value: 'sent', label: 'Sent', badge: sent.length },
          { value: 'active', label: 'Active', badge: active.length },
          { value: 'completed', label: 'Completed', badge: completed.length },
        ]}
      />

      {loading ? (
        <ListSkeleton count={4} />
      ) : tab === 'received' ? (
        received.length === 0 && user.role === 'student' ? (
          <EmptyState
            icon={GraduationCap}
            title="No requests received"
            description="Students will be able to request mentorship from your profile."
          />
        ) : (
          renderList(received, 'No requests received', 'Students will contact you here.')
        )
      ) : tab === 'sent' ? (
        renderList(sent, 'No mentorship requests', 'Find an alumni mentor to get started.')
      ) : tab === 'active' ? (
        renderList(active, 'No active mentorships', 'Accepted mentorships appear here.')
      ) : (
        renderList(completed, 'No completed mentorships', 'Finished mentorships are archived here.')
      )}
    </div>
  );
}