import { Briefcase, Building2, CalendarDays, GraduationCap, Linkedin, MapPin, Mail, Send, UserPlus, X } from 'lucide-react';
import type { Connection, UserProfile } from '@/types';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { VerifiedBadge, OnlineStatus } from './VerifiedBadge';
import { timeAgo, tsNum } from '@/lib/utils';

interface UserProfileModalProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  me: UserProfile;
  connection?: Connection | null;
  onConnect?: (profile: UserProfile) => void;
  onAccept?: (profile: UserProfile, connection: Connection) => void;
  onMessage?: (profile: UserProfile) => void;
  onRequestMentorship?: (profile: UserProfile) => void;
  onReport?: (profile: UserProfile) => void;
}

export function UserProfileModal({
  open,
  onClose,
  profile,
  me,
  connection,
  onConnect,
  onAccept,
  onMessage,
  onRequestMentorship,
  onReport,
}: UserProfileModalProps) {
  if (!profile) return null;

  const isSelf = profile.uid === me.uid;
  const status = connection?.status;
  const connected = status === 'accepted';
  const pendingOutgoing = status === 'pending' && connection?.requesterId === me.uid;
  const pendingIncoming = status === 'pending' && connection?.recipientId === me.uid;

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="relative">
        <div className="h-28 bg-gradient-to-r from-primary/80 to-primary/40" />
        <button
          className="absolute right-3 top-3 rounded-full bg-black/30 p-1.5 text-white hover:bg-black/50"
          onClick={onClose}
          aria-label="Close profile"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="px-5 pb-5">
          <div className="-mt-12 flex items-end gap-4">
            <Avatar
              src={profile.profileImageUrl}
              name={profile.name}
              size="xl"
              className="ring-4 ring-card"
            />
            <div className="mb-1 min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="truncate text-lg font-bold">{profile.name}</h2>
                <VerifiedBadge verified={profile.verified} />
              </div>
              <p className="truncate text-sm text-muted-foreground">{profile.jobRole || profile.role}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="accent" className="capitalize">
              {profile.role}
            </Badge>
            {profile.department && <Badge variant="outline">{profile.department}</Badge>}
            <OnlineStatus
              isOnline={profile.isOnline}
              lastSeen={tsNum(profile.lastSeen)}
            />
          </div>

          {!isSelf && (
            <div className="mt-4 flex flex-wrap gap-2">
              {connected ? (
                <Button onClick={() => onMessage?.(profile)}>
                  <Send className="h-4 w-4" /> Message
                </Button>
              ) : pendingOutgoing ? (
                <Button variant="secondary" disabled>
                  Request pending
                </Button>
              ) : pendingIncoming && connection ? (
                <Button variant="success" onClick={() => onAccept?.(profile, connection)}>
                  Accept request
                </Button>
              ) : (
                <Button onClick={() => onConnect?.(profile)}>
                  <UserPlus className="h-4 w-4" /> Connect
                </Button>
              )}
              {profile.role === 'alumni' && onRequestMentorship && (
                <Button variant="outline" onClick={() => onRequestMentorship(profile)}>
                  Request mentorship
                </Button>
              )}
              {onReport && (
                <Button variant="ghost" className="text-muted-foreground" onClick={() => onReport(profile)}>
                  Report
                </Button>
              )}
            </div>
          )}

          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <Detail icon={Mail} label="Email" value={profile.email} />
            {profile.role === 'student' ? (
              <>
                <Detail icon={GraduationCap} label="Department" value={profile.department} />
                <Detail icon={CalendarDays} label="Batch" value={profile.batch} />
                <Detail icon={Briefcase} label="Roll number" value={profile.rollNumber} />
              </>
            ) : (
              <>
                <Detail icon={GraduationCap} label="Department" value={profile.department} />
                <Detail icon={CalendarDays} label="Graduation year" value={profile.graduationYear} />
                <Detail icon={Building2} label="Company" value={profile.company} />
                <Detail icon={Briefcase} label="Job role" value={profile.jobRole} />
                <Detail icon={MapPin} label="Location" value={profile.location} />
              </>
            )}
            {profile.linkedIn && (
              <div className="flex items-start gap-3">
                <Linkedin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <dt className="text-xs text-muted-foreground">LinkedIn</dt>
                  <dd className="truncate">
                    <a
                      href={profile.linkedIn}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {profile.linkedIn}
                    </a>
                  </dd>
                </div>
              </div>
            )}
          </dl>

          {profile.skills && profile.skills.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Skills
              </p>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((s) => (
                  <Badge key={s} variant="secondary">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {profile.bio && (
            <div className="mt-5">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                About
              </p>
              <p className="whitespace-pre-wrap text-sm">{profile.bio}</p>
            </div>
          )}

          {profile.updatedAt ? (
            <p className="mt-5 text-[11px] text-muted-foreground">
              Profile updated {timeAgo(profile.updatedAt as number)}
            </p>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="truncate text-sm">{value}</dd>
      </div>
    </div>
  );
}