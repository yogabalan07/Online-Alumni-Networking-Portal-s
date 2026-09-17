import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Job, JobType } from '@/types';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Select, Spinner } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EMPLOYMENT_TYPES, SKILL_SUGGESTIONS } from '@/lib/constants';
import { createJob, updateJob, type JobInput } from '@/services/jobs';
import { useToast } from '@/contexts/ToastContext';
import { getErrorMessage } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface JobFormModalProps {
  open: boolean;
  onClose: () => void;
  job?: Job | null;
}

const EMPTY = {
  type: 'job' as JobType,
  title: '',
  company: '',
  description: '',
  location: '',
  employmentType: EMPLOYMENT_TYPES[0] as string,
  eligibility: '',
  applicationUrl: '',
  deadline: '',
};

export function JobFormModal({ open, onClose, job }: JobFormModalProps) {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [form, setForm] = useState({ ...EMPTY });
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (job) {
      setForm({
        type: job.type,
        title: job.title,
        company: job.company,
        description: job.description,
        location: job.location,
        employmentType: job.employmentType ?? EMPLOYMENT_TYPES[0],
        eligibility: job.eligibility ?? '',
        applicationUrl: job.applicationUrl ?? '',
        deadline: job.deadline ? new Date(job.deadline).toISOString().slice(0, 10) : '',
      });
      setSkills(job.skills ?? []);
    } else {
      setForm({ ...EMPTY });
      setSkills([]);
    }
    setErrors({});
  }, [job, open]);

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addSkill = (v: string) => {
    const val = v.trim();
    if (!val || skills.some((s) => s.toLowerCase() === val.toLowerCase())) {
      setSkillInput('');
      return;
    }
    setSkills((prev) => [...prev, val]);
    setSkillInput('');
  };

  const submit = async () => {
    if (!user) return;
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = 'Title is required.';
    if (!form.company.trim()) next.company = 'Company is required.';
    if (!form.description.trim()) next.description = 'Description is required.';
    if (!form.location.trim()) next.location = 'Location is required.';
    if (form.applicationUrl && !/^https?:\/\//i.test(form.applicationUrl)) {
      next.applicationUrl = 'Enter a valid URL starting with http:// or https://';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const payload: JobInput = {
      type: form.type,
      title: form.title.trim(),
      company: form.company.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      employmentType: form.employmentType,
      skills,
      eligibility: form.eligibility.trim(),
      applicationUrl: form.applicationUrl.trim() || undefined,
      deadline: form.deadline ? new Date(form.deadline).getTime() : undefined,
    };

    setSubmitting(true);
    try {
      if (job) {
        await updateJob(job.id, payload);
        success('Opportunity updated.');
      } else {
        await createJob(payload, user.uid);
        success('Opportunity posted.');
      }
      onClose();
    } catch (e) {
      error(getErrorMessage(e, 'Could not save the opportunity.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={job ? 'Edit opportunity' : 'Post an opportunity'}
      description="Share a job or internship with students and alumni."
    >
      <div className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="job-type">Type</Label>
            <Select id="job-type" value={form.type} onChange={(e) => set('type', e.target.value)}>
              <option value="job">Job</option>
              <option value="internship">Internship</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="job-employment">Employment type</Label>
            <Select
              id="job-employment"
              value={form.employmentType}
              onChange={(e) => set('employmentType', e.target.value)}
            >
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="job-title">Title</Label>
            <Input id="job-title" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Frontend Developer" />
            {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title}</p>}
          </div>
          <div>
            <Label htmlFor="job-company">Company</Label>
            <Input id="job-company" value={form.company} onChange={(e) => set('company', e.target.value)} placeholder="e.g. Acme Corp" />
            {errors.company && <p className="mt-1 text-xs text-destructive">{errors.company}</p>}
          </div>
          <div>
            <Label htmlFor="job-location">Location</Label>
            <Input id="job-location" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Remote / Bengaluru" />
            {errors.location && <p className="mt-1 text-xs text-destructive">{errors.location}</p>}
          </div>
          <div>
            <Label htmlFor="job-deadline">Application deadline</Label>
            <Input id="job-deadline" type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} />
          </div>
        </div>

        <div>
          <Label htmlFor="job-description">Description</Label>
          <Textarea
            id="job-description"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Responsibilities, requirements and perks…"
            className="min-h-28"
            maxLength={3000}
          />
          {errors.description && <p className="mt-1 text-xs text-destructive">{errors.description}</p>}
        </div>

        <div>
          <Label htmlFor="job-skill">Required skills</Label>
          <div className="flex gap-2">
            <Input
              id="job-skill"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addSkill(skillInput);
                }
              }}
              placeholder="Type a skill and press Enter"
              list="job-skill-suggestions"
            />
            <Button type="button" variant="outline" onClick={() => addSkill(skillInput)}>
              Add
            </Button>
          </div>
          <datalist id="job-skill-suggestions">
            {SKILL_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          {skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <Badge key={s} variant="secondary" className="gap-1">
                  {s}
                  <button type="button" onClick={() => setSkills((p) => p.filter((x) => x !== s))} aria-label={`Remove ${s}`}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="job-eligibility">Eligibility</Label>
            <Input
              id="job-eligibility"
              value={form.eligibility}
              onChange={(e) => set('eligibility', e.target.value)}
              placeholder="e.g. Final year CSE students"
            />
          </div>
          <div>
            <Label htmlFor="job-url">Application link</Label>
            <Input
              id="job-url"
              value={form.applicationUrl}
              onChange={(e) => set('applicationUrl', e.target.value)}
              placeholder="https://careers.example.com/apply"
            />
            {errors.applicationUrl && (
              <p className="mt-1 text-xs text-destructive">{errors.applicationUrl}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? <Spinner /> : null}
            {submitting ? 'Saving…' : job ? 'Save changes' : 'Post opportunity'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}