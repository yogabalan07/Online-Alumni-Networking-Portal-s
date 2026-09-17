import { useEffect, useState } from 'react';
import {
  Briefcase,
  CalendarDays,
  GraduationCap,
  MessageSquare,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import type { PlatformStats } from '@/services/admin';
import { getPlatformStats } from '@/services/admin';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListSkeleton } from '@/components/ui/skeleton';

export default function AdminPlatformPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getPlatformStats()
      .then((s) => active && setStats(s))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <PageHeader
        title="Platform Overview"
        description="Platform-wide statistics and metrics."
      />

      {loading || !stats ? (
        <ListSkeleton count={3} />
      ) : (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Total Users"
              value={stats.totalUsers}
              icon={Users}
              hint="All registered accounts"
            />
            <StatCard
              label="Students"
              value={stats.students}
              icon={GraduationCap}
              hint="Student accounts"
            />
            <StatCard
              label="Alumni"
              value={stats.alumni}
              icon={UserCheck}
              hint={`${stats.verifiedAlumni} verified`}
            />
            <StatCard
              label="Connections"
              value={stats.connections}
              icon={UserPlus}
              hint="Accepted connections"
            />
            <StatCard
              label="Messages"
              value={stats.messages}
              icon={MessageSquare}
              hint="Total messages"
            />
            <StatCard
              label="Jobs"
              value={stats.jobs}
              icon={Briefcase}
              hint="Job postings"
            />
            <StatCard
              label="Internships"
              value={stats.internships}
              icon={Briefcase}
              accent="text-accent-foreground"
              hint="Internship postings"
            />
            <StatCard
              label="Events"
              value={stats.events}
              icon={CalendarDays}
              hint="Events created"
            />
            <StatCard
              label="Active Users"
              value={stats.activeUsers}
              icon={TrendingUp}
              accent="text-success"
              hint="Currently active"
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Students</span>
                    <span className="text-sm font-medium">{stats.students}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${stats.totalUsers ? (stats.students / stats.totalUsers) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Alumni</span>
                    <span className="text-sm font-medium">{stats.alumni}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${stats.totalUsers ? (stats.alumni / stats.totalUsers) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Admins</span>
                    <span className="text-sm font-medium">{stats.totalUsers - stats.students - stats.alumni}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-destructive"
                      style={{ width: `${stats.totalUsers ? ((stats.totalUsers - stats.students - stats.alumni) / stats.totalUsers) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Job Postings</span>
                    <span className="text-sm font-medium">{stats.jobs}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Internship Postings</span>
                    <span className="text-sm font-medium">{stats.internships}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Events</span>
                    <span className="text-sm font-medium">{stats.events}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Connections</span>
                    <span className="text-sm font-medium">{stats.connections}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Messages</span>
                    <span className="text-sm font-medium">{stats.messages}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
