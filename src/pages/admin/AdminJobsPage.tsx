import { useEffect, useState } from 'react';
import { Briefcase, Search } from 'lucide-react';
import type { Job } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { deleteJob, listenJobs, setJobStatus } from '@/services/jobs';
import { JobCard } from '@/components/shared/JobCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { ListSkeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/utils';

export default function AdminJobsPage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const unsub = listenJobs((list) => {
      setJobs(list);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (!user) return null;

  const filtered = jobs.filter((j) => {
    if (typeFilter && j.type !== typeFilter) return false;
    if (statusFilter && j.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const haystack = `${j.title} ${j.company} ${j.location} ${j.description}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const remove = async (job: Job) => {
    if (!window.confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
    try {
      await deleteJob(job.id);
      success('Job deleted.');
    } catch (e) {
      error(getErrorMessage(e, 'Could not delete the job.'));
    }
  };

  const toggleStatus = async (job: Job) => {
    try {
      await setJobStatus(job.id, job.status === 'open' ? 'closed' : 'open');
      success(job.status === 'open' ? 'Job closed.' : 'Job reopened.');
    } catch (e) {
      error(getErrorMessage(e, 'Could not update job status.'));
    }
  };

  return (
    <div>
      <PageHeader
        title="Job Management"
        description="Manage all job and internship postings."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, company…"
            className="pl-9"
            aria-label="Search jobs"
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
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className="sm:w-48"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </Select>
      </div>

      {loading ? (
        <ListSkeleton count={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs found"
          description="Try a different search or filter."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              me={user}
              onDelete={remove}
              onToggleStatus={toggleStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}
