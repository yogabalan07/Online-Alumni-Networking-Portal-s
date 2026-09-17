import { NavLink } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import type { NavItem } from '@/lib/navigation';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  items: NavItem[];
  badges: Partial<Record<NonNullable<NavItem['badgeKey']>, number>>;
  onMore: () => void;
}

export function MobileNav({ items, badges, onMore }: MobileNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t bg-card/95 backdrop-blur lg:hidden">
      {items.map((item) => {
        const badge = item.badgeKey ? badges[item.badgeKey] : 0;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )
            }
          >
            <span className="relative">
              <item.icon className="h-5 w-5" />
              {badge ? (
                <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                  {badge > 9 ? '9+' : badge}
                </span>
              ) : null}
            </span>
            <span className="max-w-full truncate px-1">{item.label.split(' ')[0]}</span>
          </NavLink>
        );
      })}
      <button
        onClick={onMore}
        className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground"
        aria-label="More navigation"
      >
        <MoreHorizontal className="h-5 w-5" />
        <span>More</span>
      </button>
    </nav>
  );
}