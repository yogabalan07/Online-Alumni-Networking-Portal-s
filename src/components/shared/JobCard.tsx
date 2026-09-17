import { Briefcase, Building2, CalendarClock, ExternalLink, GraduationCap, MapPin, Pencil, Trash2, Users } from 'lucide-react';
import type { Job, UserProfile } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatFullDate, tsNum } from '@/lib/utils';

interface JobCardProps {
  job: Job;
  me: UserProfile;
  applied?: boolean;
  applicantCount?: number;
  onApply?: (job: Job) => void;
  onEdit?: (job: Job) => void;
  onDelete?: (job: Job) => void;
  onToggleStatus?: (job: Job) => void;
}

export function JobCard({ job, me, applied, applicantCount, onApply, onEdit, onDelete, onToggleStatus }: JobCardProps) {
  const isOwner = job.postedBy === me.uid;
  const canManage = isOwner || me.role === 'admin';
  const deadlinePassed = job.deadline ? tsNum(job.deadline) < Date.now() : false;

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={job.type === 'job' ? 'default' : 'accent'} className="capitalize">
              {job.type === 'job' ? 'Job' : 'Internship'}
            </Badge>
            {job.status === 'closed' && <Badge variant="secondary">Closed</Badge>}
            {deadlinePassed && job.status === 'open' && <Badge variant="destructive">Deadline passed</Badge>}
          </div>
          <h3 className="mt-2 truncate text-base font-semibold">{job.title}</h3>
          <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
            <Building2 className="h-3.5 w-3.5 shrink-0" /> {job.company}
          </p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {job.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {job.location}
          </span>
        )}
        {job.employmentType && (
          <span className="flex items-center gap-1">
            <Briefcase className="h-3.5 w-3.5" /> {job.employmentType}
          </span>
        )}
        {job.deadline && (
          <span className="flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5" /> Apply by {formatFullDate(job.deadline)}
          </span>
        )}
        {typeof applicantCount === 'number' && (
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {applicantCount} applicant{applicantCount === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
        {job.description}
      </p>

      {job.skills && job.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {job.skills.map((s) => (
            <Badge key={s} variant="secondary" className="text-[10px]">
              {s}
            </Badge>
          ))}
        </div>
      )}

      {job.eligibility && (
        <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
          <GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            <span className="font-medium text-foreground">Eligibility:</span> {job.eligibility}
          </span>
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
        {onApply && (
          applied ? (
            <Button size="sm" variant="secondary" disabled>
              Applied
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => onApply(job)}
              disabled={job.status === 'closed'}
            >
              {job.applicationUrl ? (
                <>
                  <ExternalLink className="h-3.5 w-3.5" /> Apply now
                </>
              ) : (
                'Apply'
              )}
            </Button>
          )
        )}
        {canManage && (
          <>
            {onToggleStatus && (
              <Button size="sm" variant="outline" onClick={() => onToggleStatus(job)}>
                {job.status === 'open' ? 'Close' : 'Reopen'}
              </Button>
            )}
            {onEdit && (
              <Button size="sm" variant="outline" onClick={() => onEdit(job)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            )}
            {onDelete && (
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDelete(job)}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            )}
          </>
        )}
      </div>
    </Card>
  );
}