import { CalendarCheck, CalendarDays, Clock, MapPin, Trash2, User } from 'lucide-react';
import type { EventItem, UserProfile } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatFullDate, tsNum } from '@/lib/utils';

interface EventCardProps {
  event: EventItem;
  me: UserProfile;
  registered?: boolean;
  registrationCount?: number;
  onRegister?: (event: EventItem) => void;
  onUnregister?: (event: EventItem) => void;
  onDelete?: (event: EventItem) => void;
}

export function EventCard({
  event,
  me,
  registered,
  registrationCount,
  onRegister,
  onUnregister,
  onDelete,
}: EventCardProps) {
  const isPast = tsNum(event.date) < Date.now();
  const deadlinePassed = event.registrationDeadline ? tsNum(event.registrationDeadline) < Date.now() : false;
  const canManage = event.organizerId === me.uid || me.role === 'admin';

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {event.eventType && <Badge variant="accent">{event.eventType}</Badge>}
            {isPast ? <Badge variant="secondary">Past</Badge> : <Badge variant="success">Upcoming</Badge>}
          </div>
          <h3 className="mt-2 text-base font-semibold">{event.title}</h3>
        </div>
        <div className="hidden shrink-0 rounded-lg bg-primary/10 px-3 py-2 text-center text-primary sm:block">
          <p className="text-[10px] font-semibold uppercase">
            {new Date(tsNum(event.date)).toLocaleString('default', { month: 'short' })}
          </p>
          <p className="text-lg font-bold leading-none">{new Date(tsNum(event.date)).getDate()}</p>
        </div>
      </div>

      <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
        {event.description}
      </p>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CalendarDays className="h-3.5 w-3.5" /> {formatFullDate(event.date)}
        </span>
        {event.time && (
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {event.time}
          </span>
        )}
        {event.venue && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {event.venue}
          </span>
        )}
        {event.registrationDeadline && (
          <span className="flex items-center gap-1">
            <CalendarCheck className="h-3.5 w-3.5" /> Register by {formatFullDate(event.registrationDeadline)}
          </span>
        )}
        <span className="flex items-center gap-1">
          <User className="h-3.5 w-3.5" /> {registrationCount ?? 0} registered
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
        {!isPast &&
          (registered ? (
            <Button size="sm" variant="secondary" onClick={() => onUnregister?.(event)}>
              Cancel registration
            </Button>
          ) : (
            <Button size="sm" onClick={() => onRegister?.(event)} disabled={deadlinePassed}>
              {deadlinePassed ? 'Registration closed' : 'Register'}
            </Button>
          ))}
        {canManage && onDelete && (
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDelete(event)}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        )}
      </div>
    </Card>
  );
}