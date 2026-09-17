import { BadgeCheck } from 'lucide-react';
import { cn, timeAgo, tsNum } from '@/lib/utils';

export function VerifiedBadge({ verified, className }: { verified?: boolean; className?: string }) {
  if (!verified) return null;
  return (
    <span
      title="Verified alumni"
      aria-label="Verified alumni"
      className={cn('inline-flex items-center text-primary', className)}
    >
      <BadgeCheck className="h-4 w-4" />
    </span>
  );
}

export function OnlineStatus({
  isOnline,
  lastSeen,
  className,
}: {
  isOnline?: boolean;
  lastSeen?: number | unknown;
  className?: string;
}) {
  const seenLabel =
    lastSeen && tsNum(lastSeen) > 0 ? `Last seen ${timeAgo(lastSeen as number)}` : 'Offline';
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs', className)}>
      <span
        className={cn('h-2 w-2 rounded-full', isOnline ? 'bg-success' : 'bg-muted-foreground/40')}
      />
      <span className={isOnline ? 'text-success' : 'text-muted-foreground'}>
        {isOnline ? 'Online' : seenLabel}
      </span>
    </span>
  );
}