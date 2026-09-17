import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  CalendarDays,
  FileText,
  GraduationCap,
  MessageSquare,
  Settings,
  Shield,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import type { PlatformStats } from '@/services/admin';
import { getPlatformStats } from '@/services/admin';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListSkeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/utils';

export default function AdminDashboardPage() {
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
        title="Admin Dashboard"
        description="Platform overview and quick actions."
      />

      {loading || !stats ? (
        <ListSkeleton count={3} />
      ) : (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Total Students"
              value={stats.students}
              icon={GraduationCap}
              hint="Registered students"
            />
            <StatCard
              label="Total Alumni"
              value={stats.alumni}
              icon={Users}
              hint={`${stats.verifiedAlumni} verified`}
            />
            <StatCard
              label="Verified Alumni"
              value={stats.verifiedAlumni}
              icon={UserCheck}
              accent="text-success"
              hint="Identity verified"
            />
            <StatCard
              label="Active Users"
              value={stats.activeUsers}
              icon={UserPlus}
              hint="Currently active"
            />
            <StatCard
              label="Connections"
              value={stats.connections}
              icon={MessageSquare}
              hint="Platform connections"
            />
            <StatCard
              label="Messages"
              value={stats.messages}
              icon={MessageSquare}
              hint="Messages sent"
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
              hint="Created events"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Link to="/admin/users">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4" /> Manage Users
                </Button>
              </Link>
              <Link to="/admin/verification">
                <Button variant="outline" className="w-full justify-start">
                  <UserCheck className="h-4 w-4" /> Verification
                </Button>
              </Link>
              <Link to="/admin/jobs">
                <Button variant="outline" className="w-full justify-start">
                  <Briefcase className="h-4 w-4" /> Manage Jobs
                </Button>
              </Link>
              <Link to="/admin/events">
                <Button variant="outline" className="w-full justify-start">
                  <CalendarDays className="h-4 w-4" /> Manage Events
                </Button>
              </Link>
              <Link to="/admin/reports">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4" /> Reports
                </Button>
              </Link>
              <Link to="/admin/settings">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4" /> Settings
                </Button>
              </Link>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
