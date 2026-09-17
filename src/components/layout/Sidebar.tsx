import { NavLink } from 'react-router-dom';
import { GraduationCap, X } from 'lucide-react';
import type { NavItem } from '@/lib/navigation';
import { cn } from '@/lib/utils';

interface SidebarProps {
  items: NavItem[];
  badges: Partial<Record<NonNullable<NavItem['badgeKey']>, number>>;
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ items, badges, mobileOpen, onClose }: SidebarProps) {
  const content = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold">Alumni Portal</p>
          <p className="text-[11px] text-muted-foreground">Network · Mentor · Grow</p>
        </div>
        <button
          className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-muted lg:hidden"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const badge = item.badgeKey ? badges[item.badgeKey] : 0;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {badge ? (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  {badge > 99 ? '99+' : badge}
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t p-4 text-[11px] text-muted-foreground">
        © {new Date().getFullYear()} Alumni Networking Portal
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r bg-card lg:block">{content}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
          <aside className="absolute left-0 top-0 h-full w-72 border-r bg-card shadow-xl animate-slide-in-right">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}