import { useEffect, useMemo, useState } from 'react';
import { Briefcase, Plus, Search } from 'lucide-react';
import type { Job } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { applyToJob, deleteJob, getJobApplicationsForStudent, listenJobs, setJobStatus } from '@/services/jobs';
import { JobCard } from '@/components/shared/JobCard';
import { JobFormModal } from '@/components/shared/JobFormModal';
import { useApplicationCounts } from '@/components/shared/ApplicationCount';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { ListSkeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/utils';

export default function JobsPage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsub = listenJobs((list) => {
      setJobs(list);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (user?.role !== 'student') return;
    void getJobApplicationsForStudent(user.uid).then(setAppliedIds).catch(() => undefined);
  }, [user?.uid, user?.role]);

  const myJobs = useMemo(
    () => (user ? jobs.filter((j) => j.postedBy === user.uid) : []),
    [jobs, user],
  );
  const counts = useApplicationCounts(myJobs.map((j) => j.id));

  if (!user) return null;

  const filtered = jobs.filter((j) => {
    if (typeFilter && j.type !== typeFilter) return false;
    if (tab === 'mine' && j.postedBy !== user.uid) return false;
    if (tab === 'applied' && !appliedIds.includes(j.id)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const haystack = `${j.title} ${j.company} ${j.location} ${j.skills.join(' ')} ${j.description}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const apply = async (job: Job) => {
    try {
      await applyToJob(job.id, user.uid);
      setAppliedIds((prev) => [...prev, job.id]);
      success('Application submitted.');
      if (job.applicationUrl) {
        window.open(job.applicationUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (e) {
      error(getErrorMessage(e, 'Could not submit your application.'));
    }
  };

  const remove = async (job: Job) => {
    if (!window.confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
    try {
      await deleteJob(job.id);
      success('Opportunity deleted.');
    } catch (e) {
      error(getErrorMessage(e, 'Could not delete the opportunity.'));
    }
  };

  const toggleStatus = async (job: Job) => {
    try {
      await setJobStatus(job.id, job.status === 'open' ? 'closed' : 'open');
      success(job.status === 'open' ? 'Opportunity closed.' : 'Opportunity reopened.');
    } catch (e) {
      error(getErrorMessage(e, 'Could not update the opportunity.'));
    }
  };

  const canPost = user.role === 'alumni' || user.role === 'admin';
  const tabs = [
    { value: 'all', label: 'All' },
    { value: 'job', label: 'Jobs' },
    { value: 'internship', label: 'Internships' },
    ...(user.role === 'student'
      ? [{ value: 'applied', label: 'Applied', badge: appliedIds.length }]
      : [{ value: 'mine', label: 'My posts', badge: myJobs.length }]),
  ];

  return (
    <div>
      <PageHeader
        title="Jobs & Internships"
        description={
          canPost
            ? 'Post opportunities and help students and alumni grow.'
            : 'Discover jobs and internships shared by alumni.'
        }
        actions={
          canPost ? (
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> Post opportunity
            </Button>
          ) : undefined
        }
      />

      <Tabs value={tab} onValueChange={setTab} items={tabs} className="mb-4 flex-wrap" />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, company, skill…"
            className="pl-9"
            aria-label="Search opportunities"
          />
        </div>
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Filter by type"
          className="sm:w-48"
        >
          <option value="">All types</option>
          <option value="job">Jobs</option>
          <option value="internship">Internships</option>
        </Select>
      </div>

      {loading ? (
        <ListSkeleton count={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={
            tab === 'applied'
              ? 'No applications yet'
              : tab === 'mine'
                ? 'No posts yet'
                : 'No opportunities found'
          }
          description={
            tab === 'mine'
              ? 'Post a job or internship to get started.'
              : 'Try a different search or filter.'
          }
          action={
            canPost && tab === 'mine' ? (
              <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
                <Plus className="h-4 w-4" /> Post opportunity
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              me={user}
              applied={appliedIds.includes(job.id)}
              applicantCount={job.postedBy === user.uid ? counts[job.id] ?? 0 : undefined}
              onApply={user.role === 'student' ? apply : undefined}
              onEdit={(j) => {
                setEditing(j);
                setFormOpen(true);
              }}
              onDelete={remove}
              onToggleStatus={toggleStatus}
            />
          ))}
        </div>
      )}

      <JobFormModal open={formOpen} onClose={() => setFormOpen(false)} job={editing} />
    </div>
  );
}