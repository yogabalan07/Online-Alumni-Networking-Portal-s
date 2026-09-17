import { Briefcase, Building2, MapPin, MessageSquare, Send, UserPlus } from 'lucide-react';
import type { Connection, UserProfile } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { VerifiedBadge, OnlineStatus } from './VerifiedBadge';
import { tsNum } from '@/lib/utils';

interface AlumniCardProps {
  alumni: UserProfile;
  me: UserProfile;
  connection?: Connection | null;
  onView: (alumni: UserProfile) => void;
  onConnect: (alumni: UserProfile) => void;
  onMessage: (alumni: UserProfile) => void;
  onAccept?: (alumni: UserProfile, connection: Connection) => void;
}

export function AlumniCard({
  alumni,
  me,
  connection,
  onView,
  onConnect,
  onMessage,
  onAccept,
}: AlumniCardProps) {
  const status = connection?.status;
  const connected = status === 'accepted';
  const pendingOutgoing = status === 'pending' && connection?.requesterId === me.uid;
  const pendingIncoming = status === 'pending' && connection?.recipientId === me.uid;

  return (
    <Card className="flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3 p-4">
        <button onClick={() => onView(alumni)} aria-label={`View ${alumni.name}'s profile`}>
          <Avatar src={alumni.profileImageUrl} name={alumni.name} size="lg" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onView(alumni)}
              className="truncate text-left text-sm font-semibold hover:text-primary"
            >
              {alumni.name}
            </button>
            <VerifiedBadge verified={alumni.verified} />
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {alumni.jobRole || 'Alumni'}
            {alumni.company ? ` · ${alumni.company}` : ''}
          </p>
          <OnlineStatus isOnline={alumni.isOnline} lastSeen={tsNum(alumni.lastSeen)} className="mt-1" />
        </div>
      </div>

      <div className="space-y-1.5 px-4 text-xs text-muted-foreground">
        {alumni.department && (
          <p className="flex items-center gap-1.5 truncate">
            <Building2 className="h-3.5 w-3.5 shrink-0" /> {alumni.department}
          </p>
        )}
        <p className="flex items-center gap-1.5 truncate">
          <Briefcase className="h-3.5 w-3.5 shrink-0" />
          {alumni.graduationYear ? `Class of ${alumni.graduationYear}` : 'Alumni'}
        </p>
        {alumni.location && (
          <p className="flex items-center gap-1.5 truncate">
            <MapPin className="h-3.5 w-3.5 shrink-0" /> {alumni.location}
          </p>
        )}
      </div>

      {alumni.skills && alumni.skills.length > 0 && (
        <div className="flex flex-wrap gap-1 px-4 pt-3">
          {alumni.skills.slice(0, 4).map((s) => (
            <Badge key={s} variant="secondary" className="text-[10px]">
              {s}
            </Badge>
          ))}
          {alumni.skills.length > 4 && (
            <Badge variant="outline" className="text-[10px]">
              +{alumni.skills.length - 4}
            </Badge>
          )}
        </div>
      )}

      <div className="mt-auto flex gap-2 p-4 pt-3">
        {connected ? (
          <Button size="sm" className="flex-1" onClick={() => onMessage(alumni)}>
            <MessageSquare className="h-3.5 w-3.5" /> Message
          </Button>
        ) : pendingIncoming && connection ? (
          <Button
            size="sm"
            variant="success"
            className="flex-1"
            onClick={() => onAccept?.(alumni, connection)}
          >
            Accept request
          </Button>
        ) : pendingOutgoing ? (
          <Button size="sm" variant="secondary" className="flex-1" disabled>
            Request sent
          </Button>
        ) : (
          <Button size="sm" className="flex-1" onClick={() => onConnect(alumni)}>
            <UserPlus className="h-3.5 w-3.5" /> Connect
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => onView(alumni)}>
          <Send className="h-3.5 w-3.5" /> Profile
        </Button>
      </div>
    </Card>
  );
}