import { forwardRef, type HTMLAttributes } from 'react';
import { cn, initials } from '@/lib/utils';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline';
  showStatus?: boolean;
}

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-24 w-24 text-2xl',
};

const DOT = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
  xl: 'h-4 w-4',
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, name, size = 'md', status, showStatus = false, ...props }, ref) => (
    <div ref={ref} className={cn('relative inline-block shrink-0', className)} {...props}>
      {src ? (
        <img
          src={src}
          alt={name ? `${name}'s avatar` : 'Avatar'}
          className={cn(
            'rounded-full object-cover ring-1 ring-border',
            SIZES[size],
          )}
        />
      ) : (
        <div
          aria-hidden
          className={cn(
            'flex items-center justify-center rounded-full bg-primary/15 font-semibold text-primary ring-1 ring-border',
            SIZES[size],
          )}
        >
          {initials(name ?? '?')}
        </div>
      )}
      {showStatus && status ? (
        <span
          aria-label={status === 'online' ? 'Online' : 'Offline'}
          className={cn(
            'absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-card',
            DOT[size],
            status === 'online' ? 'bg-success' : 'bg-muted-foreground/40',
          )}
        />
      ) : null}
    </div>
  ),
);
Avatar.displayName = 'Avatar';