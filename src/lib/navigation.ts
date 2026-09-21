import {
  LayoutDashboard,
  Users,
  MessageSquare,
  UserCheck,
  GraduationCap,
  Briefcase,
  CalendarDays,
  Bell,
  User,
  Settings,
  ShieldCheck,
  Flag,
  FileBarChart,
  Rss,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/types';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  badgeKey?: 'notifications' | 'messages' | 'connections' | 'mentorship';
  roles?: UserRole[];
  end?: boolean;
}

export const PRIMARY_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, end: true },
  { label: 'Feed', to: '/feed', icon: Rss, roles: ['student', 'alumni'] },
  { label: 'Alumni', to: '/alumni', icon: GraduationCap, roles: ['student', 'alumni'] },
  { label: 'Messages', to: '/messages', icon: MessageSquare, badgeKey: 'messages', roles: ['student', 'alumni'] },
  { label: 'Connections', to: '/connections', icon: UserCheck, badgeKey: 'connections', roles: ['student', 'alumni'] },
  { label: 'Mentorship', to: '/mentorship', icon: Users, badgeKey: 'mentorship', roles: ['student', 'alumni'] },
  { label: 'Jobs & Internships', to: '/jobs', icon: Briefcase, roles: ['student', 'alumni'] },
  { label: 'Events', to: '/events', icon: CalendarDays, roles: ['student', 'alumni'] },
  { label: 'Notifications', to: '/notifications', icon: Bell, badgeKey: 'notifications', roles: ['student', 'alumni'] },
  { label: 'Profile', to: '/profile', icon: User, roles: ['student', 'alumni'] },
  { label: 'Settings', to: '/settings', icon: Settings, roles: ['student', 'alumni'] },
];

export const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Users', to: '/admin/users', icon: Users },
  { label: 'Alumni Verification', to: '/admin/verification', icon: ShieldCheck },
  { label: 'Jobs', to: '/admin/jobs', icon: Briefcase },
  { label: 'Events', to: '/admin/events', icon: CalendarDays },
  { label: 'Reports', to: '/admin/reports', icon: Flag },
  { label: 'Platform', to: '/admin/platform', icon: FileBarChart },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
];

export function navForRole(role: UserRole): NavItem[] {
  if (role === 'admin') return ADMIN_NAV;
  return PRIMARY_NAV;
}