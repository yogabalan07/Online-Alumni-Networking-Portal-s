import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Filter, GraduationCap, RotateCcw, Search, X } from 'lucide-react';
import type { UserProfile } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useAlumniDirectory } from '@/hooks/useAlumniDirectory';
import { useConnections } from '@/hooks/useConnections';
import { sendConnectionRequest, respondToConnectionRequest } from '@/services/connections';
import { getConversationId } from '@/services/chat';
import { DEPARTMENTS, YEARS } from '@/lib/constants';
import { AlumniCard } from '@/components/shared/AlumniCard';
import { UserProfileModal } from '@/components/shared/UserProfileModal';
import { MentorshipRequestModal } from '@/components/shared/MentorshipRequestModal';
import { ReportDialog } from '@/components/shared/ReportDialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ListSkeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/utils';

export default function AlumniDirectoryPage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { byOther } = useConnections(user?.uid);

  const [nameInput, setNameInput] = useState(searchParams.get('q') ?? '');
  const [filters, setFilters] = useState({
    name: searchParams.get('q') ?? '',
    department: '',
    graduationYear: '',
    company: '',
    jobRole: '',
    skill: '',
    location: '',
    verifiedOnly: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<UserProfile | null>(null);
  const [mentorTarget, setMentorTarget] = useState<UserProfile | null>(null);
  const [reportTarget, setReportTarget] = useState<UserProfile | null>(null);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setNameInput(q);
      setFilters((prev) => ({ ...prev, name: q }));
    }
  }, [searchParams]);

  const { items, loading, loadingMore, hasMore, loadMore, error: loadError } =
    useAlumniDirectory(filters);

  const applyName = (value: string) => {
    setNameInput(value);
    setFilters((prev) => ({ ...prev, name: value }));
    const next = new URLSearchParams(searchParams);
    if (value) next.set('q', value);
    else next.delete('q');
    setSearchParams(next, { replace: true });
  };

  const update = (key: keyof typeof filters, value: string | boolean) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const reset = () => {
    setFilters({
      name: '',
      department: '',
      graduationYear: '',
      company: '',
      jobRole: '',
      skill: '',
      location: '',
      verifiedOnly: false,
    });
    setNameInput('');
    setSearchParams({}, { replace: true });
  };

  const activeFilterCount = useMemo(
    () =>
      [
        filters.department,
        filters.graduationYear,
        filters.company,
        filters.jobRole,
        filters.skill,
        filters.location,
        filters.verifiedOnly ? 'x' : '',
      ].filter(Boolean).length,
    [filters],
  );

  if (!user) return null;

  const connect = async (alumni: UserProfile) => {
    try {
      await sendConnectionRequest(user.uid, alumni.uid, user.name);
      success(`Connection request sent to ${alumni.name}.`);
      setSelected(null);
    } catch (e) {
      error(getErrorMessage(e, 'Could not send connection request.'));
    }
  };

  const accept = async (alumni: UserProfile) => {
    const connection = byOther.get(alumni.uid);
    if (!connection) return;
    try {
      await respondToConnectionRequest(connection, true, user.name);
      success(`You are now connected with ${alumni.name}.`);
      setSelected(null);
    } catch (e) {
      error(getErrorMessage(e, 'Could not accept the request.'));
    }
  };

  const message = (alumni: UserProfile) => {
    const convId = getConversationId(user.uid, alumni.uid);
    navigate(`/messages/${convId}?to=${alumni.uid}`);
  };

  return (
    <div>
      <PageHeader
        title="Alumni directory"
        description="Discover and connect with alumni across departments, companies and locations."
      />

      <Card className="mb-5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={nameInput}
              onChange={(e) => applyName(e.target.value)}
              placeholder="Search alumni by name…"
              className="pl-9"
              aria-label="Search alumni by name"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
          {(activeFilterCount > 0 || nameInput) && (
            <Button variant="ghost" onClick={reset}>
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label htmlFor="f-dept">Department</Label>
              <Select id="f-dept" value={filters.department} onChange={(e) => update('department', e.target.value)}>
                <option value="">All departments</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="f-year">Graduation year</Label>
              <Select id="f-year" value={filters.graduationYear} onChange={(e) => update('graduationYear', e.target.value)}>
                <option value="">Any year</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="f-company">Company</Label>
              <Input id="f-company" value={filters.company} onChange={(e) => update('company', e.target.value)} placeholder="e.g. Google" />
            </div>
            <div>
              <Label htmlFor="f-role">Job role</Label>
              <Input id="f-role" value={filters.jobRole} onChange={(e) => update('jobRole', e.target.value)} placeholder="e.g. Data Scientist" />
            </div>
            <div>
              <Label htmlFor="f-skill">Skill</Label>
              <Input id="f-skill" value={filters.skill} onChange={(e) => update('skill', e.target.value)} placeholder="e.g. React" />
            </div>
            <div>
              <Label htmlFor="f-location">Location</Label>
              <Input id="f-location" value={filters.location} onChange={(e) => update('location', e.target.value)} placeholder="e.g. Bengaluru" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.verifiedOnly}
                onChange={(e) => update('verifiedOnly', e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              Verified alumni only
            </label>
          </div>
        )}
      </Card>

      {loading ? (
        <ListSkeleton count={6} />
      ) : loadError ? (
        <EmptyState icon={X} title="Something went wrong" description={loadError} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No alumni found"
          description="Try adjusting your search or filters."
          action={
            <Button variant="outline" onClick={reset}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((alumni) => (
              <AlumniCard
                key={alumni.uid}
                alumni={alumni}
                me={user}
                connection={byOther.get(alumni.uid) ?? null}
                onView={setSelected}
                onConnect={connect}
                onMessage={message}
                onAccept={accept}
              />
            ))}
          </div>

          {hasMore && (
            <div className="mt-6 flex justify-center">
              <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Loading…' : 'Load more alumni'}
              </Button>
            </div>
          )}
        </>
      )}

      <UserProfileModal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        profile={selected}
        me={user}
        connection={selected ? byOther.get(selected.uid) ?? null : null}
        onConnect={connect}
        onAccept={accept}
        onMessage={message}
        onRequestMentorship={user.role === 'student' ? (p) => { setSelected(null); setMentorTarget(p); } : undefined}
        onReport={(p) => { setSelected(null); setReportTarget(p); }}
      />

      <MentorshipRequestModal
        open={Boolean(mentorTarget)}
        onClose={() => setMentorTarget(null)}
        alumni={mentorTarget}
      />

      <ReportDialog
        open={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        targetType="user"
        targetId={reportTarget?.uid ?? ''}
      />
    </div>
  );
}