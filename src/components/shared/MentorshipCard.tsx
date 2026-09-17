import { Check, CheckCheck, MessageSquare, X } from 'lucide-react';
import type { MentorshipRequest, UserProfile } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { timeAgo, tsNum } from '@/lib/utils';

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'destructive' | 'secondary' | 'accent'> = {
  pending: 'secondary',
  accepted: 'success',
  rejected: 'destructive',
  completed: 'accent',
};

interface MentorshipCardProps {
  request: MentorshipRequest;
  me: UserProfile;
  student?: UserProfile;
  alumni?: UserProfile;
  onRespond?: (request: MentorshipRequest, status: 'accepted' | 'rejected' | 'completed') => void;
  onMessage?: (other: UserProfile) => void;
}

export function MentorshipCard({ request, me, student, alumni, onRespond, onMessage }: MentorshipCardProps) {
  const isAlumni = request.alumniId === me.uid;
  const other = isAlumni ? student : alumni;
  const otherName = other?.name ?? (isAlumni ? 'Student' : 'Alumni');

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <Avatar src={other?.profileImageUrl} name={otherName} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold">{otherName}</p>
            <Badge variant={STATUS_VARIANT[request.status] ?? 'secondary'} className="capitalize">
              {request.status}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isAlumni ? 'Requested mentorship' : 'Mentorship request'} · {timeAgo(tsNum(request.createdAt))}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-lg bg-muted/60 p-3">
        <p className="text-sm font-medium">{request.topic}</p>
        {request.message && (
          <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{request.message}</p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {isAlumni && request.status === 'pending' && onRespond && (
          <>
            <Button size="sm" variant="success" onClick={() => onRespond(request, 'accepted')}>
              <Check className="h-3.5 w-3.5" /> Accept
            </Button>
            <Button size="sm" variant="outline" onClick={() => onRespond(request, 'rejected')}>
              <X className="h-3.5 w-3.5" /> Reject
            </Button>
          </>
        )}
        {isAlumni && request.status === 'accepted' && onRespond && (
          <Button size="sm" variant="outline" onClick={() => onRespond(request, 'completed')}>
            <CheckCheck className="h-3.5 w-3.5" /> Mark completed
          </Button>
        )}
        {(request.status === 'accepted' || request.status === 'completed') && other && onMessage && (
          <Button size="sm" variant="outline" onClick={() => onMessage(other)}>
            <MessageSquare className="h-3.5 w-3.5" /> Open chat
          </Button>
        )}
      </div>
    </Card>
  );
}