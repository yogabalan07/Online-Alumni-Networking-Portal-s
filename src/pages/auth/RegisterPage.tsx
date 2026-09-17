import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ImagePlus, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea, FieldError } from '@/components/ui/input';
import { Select, Spinner } from '@/components/ui/select';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { DEPARTMENTS, SKILL_SUGGESTIONS, YEARS } from '@/lib/constants';
import { getErrorMessage, isValidEmail, cn } from '@/lib/utils';
import type { UserRole } from '@/types';

interface FormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  department: string;
  batch: string;
  rollNumber: string;
  graduationYear: string;
  company: string;
  jobRole: string;
  location: string;
  bio: string;
  linkedIn: string;
}

const EMPTY: FormState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  department: '',
  batch: '',
  rollNumber: '',
  graduationYear: '',
  company: '',
  jobRole: '',
  location: '',
  bio: '',
  linkedIn: '',
};

export default function RegisterPage() {
  const { register } = useAuth();
  const { success, error } = useToast();

  const [role, setRole] = useState<UserRole>('student');
  const [form, setForm] = useState<FormState>(EMPTY);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'photo' | 'skills', string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const addSkill = (value: string) => {
    const v = value.trim();
    if (!v) return;
    if (skills.length >= 15) return;
    if (!skills.some((s) => s.toLowerCase() === v.toLowerCase())) {
      setSkills((prev) => [...prev, v]);
    }
    setSkillInput('');
  };

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, photo: 'Please select an image file (JPG, PNG or WebP).' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photo: 'Image must be smaller than 5 MB.' }));
      return;
    }
    setErrors((prev) => ({ ...prev, photo: undefined }));
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const next: Partial<Record<keyof FormState | 'photo' | 'skills', string>> = {};
    if (!form.name.trim()) next.name = 'Full name is required.';
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!isValidEmail(form.email)) next.email = 'Enter a valid email address.';
    if (!form.password) next.password = 'Password is required.';
    else if (form.password.length < 6) next.password = 'Password must be at least 6 characters.';
    if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match.';
    if (!form.department) next.department = 'Department is required.';
    if (role === 'student') {
      if (!form.batch.trim()) next.batch = 'Batch is required.';
      if (!form.rollNumber.trim()) next.rollNumber = 'Roll number is required.';
    } else {
      if (!form.graduationYear) next.graduationYear = 'Graduation year is required.';
      if (!form.company.trim()) next.company = 'Current company is required.';
      if (!form.jobRole.trim()) next.jobRole = 'Job role is required.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role,
        department: form.department,
        batch: form.batch,
        rollNumber: form.rollNumber,
        graduationYear: form.graduationYear,
        company: form.company,
        jobRole: form.jobRole,
        skills,
        location: form.location,
        bio: form.bio,
        linkedIn: form.linkedIn,
        photoFile: photo,
      });
      success('Account created successfully. Welcome!');
    } catch (err) {
      setFormError(getErrorMessage(err, 'Registration failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const roleCopy = useMemo(
    () =>
      role === 'student'
        ? 'Create a student account to connect with alumni, find mentors and apply for opportunities.'
        : 'Create an alumni account to give back, mentor students and share opportunities.',
    [role],
  );

  return (
    <div className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <Link to="/login" className="mb-6 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-6 w-6" />
          </div>
          <span className="font-bold">Alumni Networking Portal</span>
        </Link>

        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">{roleCopy}</p>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
          {(['student', 'alumni'] as UserRole[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-colors',
                role === r ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
              aria-pressed={role === r}
            >
              {r}
            </button>
          ))}
        </div>

        {formError && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {formError}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate>
          <section className="rounded-xl border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold">Basic information</h2>

            <div className="mb-4 flex items-center gap-4">
              <Avatar src={photoPreview} name={form.name || 'New User'} size="xl" />
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={onPhotoChange}
                  id="profile-photo"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                >
                  <ImagePlus className="h-4 w-4" /> Upload photo
                </Button>
                <p className="mt-1 text-xs text-muted-foreground">JPG, PNG or WebP · max 5 MB</p>
                <FieldError message={errors.photo} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={form.name} onChange={set('name')} placeholder="Jane Doe" aria-invalid={Boolean(errors.name)} />
                <FieldError message={errors.name} />
              </div>
              <div>
                <Label htmlFor="reg-email">Email</Label>
                <Input id="reg-email" type="email" value={form.email} onChange={set('email')} placeholder="you@college.edu" aria-invalid={Boolean(errors.email)} />
                <FieldError message={errors.email} />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Select id="department" value={form.department} onChange={set('department')} aria-invalid={Boolean(errors.department)}>
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
                <FieldError message={errors.department} />
              </div>
              <div>
                <Label htmlFor="reg-password">Password</Label>
                <Input
                  id="reg-password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={set('password')}
                  placeholder="At least 6 characters"
                  aria-invalid={Boolean(errors.password)}
                />
                <FieldError message={errors.password} />
              </div>
              <div>
                <Label htmlFor="reg-confirm">Confirm password</Label>
                <Input
                  id="reg-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  placeholder="Re-enter password"
                  aria-invalid={Boolean(errors.confirmPassword)}
                />
                <FieldError message={errors.confirmPassword} />
              </div>
            </div>
          </section>

          {role === 'student' ? (
            <section className="rounded-xl border bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold">Student details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="batch">Batch</Label>
                  <Input id="batch" value={form.batch} onChange={set('batch')} placeholder="e.g. 2022-2026" aria-invalid={Boolean(errors.batch)} />
                  <FieldError message={errors.batch} />
                </div>
                <div>
                  <Label htmlFor="roll">Roll number</Label>
                  <Input id="roll" value={form.rollNumber} onChange={set('rollNumber')} placeholder="e.g. 21CS123" aria-invalid={Boolean(errors.rollNumber)} />
                  <FieldError message={errors.rollNumber} />
                </div>
              </div>
            </section>
          ) : (
            <section className="rounded-xl border bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold">Alumni details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="gradYear">Graduation year</Label>
                  <Select id="gradYear" value={form.graduationYear} onChange={set('graduationYear')} aria-invalid={Boolean(errors.graduationYear)}>
                    <option value="">Select year</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </Select>
                  <FieldError message={errors.graduationYear} />
                </div>
                <div>
                  <Label htmlFor="company">Current company</Label>
                  <Input id="company" value={form.company} onChange={set('company')} placeholder="e.g. Acme Corp" aria-invalid={Boolean(errors.company)} />
                  <FieldError message={errors.company} />
                </div>
                <div>
                  <Label htmlFor="jobRole">Job role</Label>
                  <Input id="jobRole" value={form.jobRole} onChange={set('jobRole')} placeholder="e.g. Software Engineer" aria-invalid={Boolean(errors.jobRole)} />
                  <FieldError message={errors.jobRole} />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" value={form.location} onChange={set('location')} placeholder="e.g. Bengaluru, India" />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="linkedIn">LinkedIn (optional)</Label>
                  <Input id="linkedIn" value={form.linkedIn} onChange={set('linkedIn')} placeholder="https://linkedin.com/in/username" />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="skill-input">Skills</Label>
                  <div className="flex gap-2">
                    <Input
                      id="skill-input"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          addSkill(skillInput);
                        }
                      }}
                      placeholder="Type a skill and press Enter"
                      list="skill-suggestions"
                    />
                    <Button type="button" variant="outline" onClick={() => addSkill(skillInput)}>
                      <Plus className="h-4 w-4" /> Add
                    </Button>
                  </div>
                  <datalist id="skill-suggestions">
                    {SKILL_SUGGESTIONS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                  {skills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {skills.map((s) => (
                        <Badge key={s} variant="secondary" className="gap-1">
                          {s}
                          <button
                            type="button"
                            onClick={() => setSkills((prev) => prev.filter((x) => x !== s))}
                            aria-label={`Remove ${s}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="bio">Bio (optional)</Label>
                  <Textarea id="bio" value={form.bio} onChange={set('bio')} placeholder="A short introduction about yourself" maxLength={500} />
                </div>
              </div>
            </section>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? <Spinner /> : null}
              {submitting ? 'Creating account…' : `Create ${role} account`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}