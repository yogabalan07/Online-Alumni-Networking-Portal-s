import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, Search, Settings, User as UserIcon, CheckCheck } from 'lucide-react';
import type { NotificationItem, UserProfile } from '@/types';
import { Avatar } from '@/components/ui/avatar';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { Badge } from '@/components/ui/badge';
import { cn, timeAgo } from '@/lib/utils';
import { markAllNotificationsRead, markNotificationRead } from '@/services/notifications';

interface TopbarProps {
  user: UserProfile;
  unreadNotifications: number;
  notifications: NotificationItem[];
  onOpenSidebar: () => void;
  onLogout: () => void;
}

export function Topbar({
  user,
  unreadNotifications,
  notifications,
  onOpenSidebar,
  onLogout,
}: TopbarProps) {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    navigate(`/alumni?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur">
      <button
        className="rounded-md p-2 text-muted-foreground hover:bg-muted lg:hidden"
        onClick={onOpenSidebar}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <form onSubmit={submitSearch} className="relative hidden max-w-md flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search alumni by name…"
          aria-label="Search alumni"
          className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </form>

      <div className="ml-auto flex items-center gap-1.5">
        {user.role !== 'admin' && (
          <Dropdown
            align="right"
            className="w-80 max-w-[85vw]"
            trigger={
              <button
                className="relative rounded-md p-2 text-muted-foreground hover:bg-muted"
                aria-label={`Notifications${unreadNotifications ? `, ${unreadNotifications} unread` : ''}`}
              >
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>
            }
          >
            {(close) => (
              <div className="max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between px-3 py-2">
                  <p className="text-sm font-semibold">Notifications</p>
                  {unreadNotifications > 0 && (
                    <button
                      className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      onClick={() => {
                        void markAllNotificationsRead(user.uid);
                      }}
                    >
                      <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <p className="px-3 pb-4 pt-1 text-sm text-muted-foreground">
                    You're all caught up.
                  </p>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <DropdownItem
                      key={n.id}
                      onSelect={() => {
                        void markNotificationRead(n.id);
                        close();
                        navigate('/notifications');
                      }}
                      className="items-start"
                    >
                      <span
                        className={cn(
                          'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                          n.read ? 'bg-muted-foreground/30' : 'bg-primary',
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{n.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {n.message}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {timeAgo(n.createdAt)}
                        </span>
                      </span>
                    </DropdownItem>
                  ))
                )}
                <Link
                  to="/notifications"
                  onClick={close}
                  className="block border-t px-3 py-2 text-center text-xs font-medium text-primary hover:underline"
                >
                  View all notifications
                </Link>
              </div>
            )}
          </Dropdown>
        )}

        <Dropdown
          align="right"
          trigger={
            <button className="flex items-center gap-2 rounded-full p-0.5 pr-2 hover:bg-muted" aria-label="Account menu">
              <Avatar src={user.profileImageUrl} name={user.name} size="sm" showStatus status="online" />
              <span className="hidden max-w-[8rem] truncate text-sm font-medium md:block">{user.name}</span>
            </button>
          }
        >
          {(close) => (
            <div>
              <div className="border-b px-3 py-2">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                <Badge variant="accent" className="mt-1 capitalize">
                  {user.role}
                  {user.role === 'alumni' && user.verified ? ' · Verified' : ''}
                </Badge>
              </div>
              {user.role !== 'admin' && (
                <DropdownItem
                  onSelect={() => {
                    close();
                    navigate('/profile');
                  }}
                >
                  <UserIcon className="h-4 w-4" /> My Profile
                </DropdownItem>
              )}
              <DropdownItem
                onSelect={() => {
                  close();
                  navigate(user.role === 'admin' ? '/admin/settings' : '/settings');
                }}
              >
                <Settings className="h-4 w-4" /> Settings
              </DropdownItem>
              <DropdownItem destructive onSelect={onLogout}>
                <LogOut className="h-4 w-4" /> Log out
              </DropdownItem>
            </div>
          )}
        </Dropdown>
      </div>
    </header>
  );
}