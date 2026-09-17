import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useConversations } from '@/hooks/useConversations';
import { navForRole } from '@/lib/navigation';
import { FullPageLoader } from '@/components/ui/select';

export function AppLayout() {
  const { user, logout, authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { notifications, unread } = useNotifications(user?.uid);
  const { totalUnread } = useConversations(user?.uid);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen">
        <FullPageLoader label="Loading your workspace…" />
      </div>
    );
  }

  const items = navForRole(user.role);
  const badges = {
    notifications: unread,
    messages: totalUnread,
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        items={items}
        badges={badges}
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={user}
          unreadNotifications={unread}
          notifications={notifications}
          onOpenSidebar={() => setSidebarOpen(true)}
          onLogout={handleLogout}
        />
        <main className="flex-1 px-4 pb-24 pt-5 sm:px-6 lg:pb-8">
          <Outlet />
        </main>
      </div>
      <MobileNav items={items.slice(0, 5)} badges={badges} onMore={() => setSidebarOpen(true)} />
    </div>
  );
}