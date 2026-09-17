import { useRef, useState } from 'react';
import { Camera, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea, FieldError } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { updateProfile } from '@/services/users';
import { uploadProfilePhoto } from '@/services/storage';
import { DEPARTMENTS, SKILL_SUGGESTIONS, YEARS } from '@/lib/constants';
import { getErrorMessage } from '@/lib/utils';

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const { success, error: toastError } = useToast();

  const [name, setName] = useState(user?.name ?? '');
  const [department, setDepartment] = useState(user?.department ?? '');
  const [batch, setBatch] = useState(user?.batch ?? '');
  const [rollNumber, setRollNumber] = useState(user?.rollNumber ?? '');
  const [graduationYear, setGraduationYear] = useState(user?.graduationYear ?? '');
  const [company, setCompany] = useState(user?.company ?? '');
  const [jobRole, setJobRole] = useState(user?.jobRole ?? '');
  const [location, setLocation] = useState(user?.location ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [linkedIn, setLinkedIn] = useState(user?.linkedIn ?? '');
  const [skills, setSkills] = useState<string[]>(user?.skills ?? []);
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const addSkill = (value: string) => {
    const v = value.trim();
    if (!v) return;
    if (skills.length >= 15) return;
    if (!skills.some((s) => s.toLowerCase() === v.toLowerCase())) {
      setSkills((prev) => [...prev, v]);
    }
    setSkillInput('');
  };

  const onPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const url = await uploadProfilePhoto(user.uid, file);
      await updateProfile(user.uid, { profileImageUrl: url });
      await refreshProfile();
      success('Profile photo updated.');
    } catch (err) {
      toastError(getErrorMessage(err, 'Failed to upload photo.'));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user.uid, {
        name,
        department,
        batch,
        rollNumber,
        graduationYear,
        company,
        jobRole,
        location,
        bio,
        linkedIn,
        skills,
      });
      await refreshProfile();
      success('Profile updated successfully.');
    } catch (err) {
      toastError(getErrorMessage(err, 'Failed to save profile.'));
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div>
      <PageHeader title="Profile" description="Manage your personal information." />

      <form onSubmit={onSave} className="space-y-5 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Profile Photo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-5">
              <Avatar src={user.profileImageUrl} name={user.name} size="xl" />
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={onPhotoChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                  {uploading ? 'Uploading…' : 'Change photo'}
                </Button>
                <p className="mt-1 text-xs text-muted-foreground">JPG, PNG or WebP · max 10 MB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Basic Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={user.email} disabled />
              </div>
              <div>
                <Label>Role</Label>
                <Input value={user.role.charAt(0).toUpperCase() + user.role.slice(1)} disabled />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Select id="department" value={department} onChange={(e) => setDepartment(e.target.value)}>
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Bengaluru, India" />
              </div>
              <div>
                <Label htmlFor="linkedIn">LinkedIn</Label>
                <Input id="linkedIn" value={linkedIn} onChange={(e) => setLinkedIn(e.target.value)} placeholder="https://linkedin.com/in/username" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Professional Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {user.role === 'student' ? (
                <>
                  <div>
                    <Label htmlFor="batch">Batch</Label>
                    <Input id="batch" value={batch} onChange={(e) => setBatch(e.target.value)} placeholder="e.g. 2022-2026" />
                  </div>
                  <div>
                    <Label htmlFor="rollNumber">Roll number</Label>
                    <Input id="rollNumber" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} placeholder="e.g. 21CS123" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="graduationYear">Graduation year</Label>
                    <Select id="graduationYear" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)}>
                      <option value="">Select year</option>
                      {YEARS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Acme Corp" />
                  </div>
                  <div>
                    <Label htmlFor="jobRole">Job role</Label>
                    <Input id="jobRole" value={jobRole} onChange={(e) => setJobRole(e.target.value)} placeholder="e.g. Software Engineer" />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
          </CardHeader>
          <CardContent>
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
                list="profile-skill-suggestions"
              />
              <Button type="button" variant="outline" onClick={() => addSkill(skillInput)}>
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
            <datalist id="profile-skill-suggestions">
              {SKILL_SUGGESTIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            {skills.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short introduction about yourself"
              maxLength={500}
            />
            <p className="mt-1 text-xs text-muted-foreground">{bio.length}/500</p>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
