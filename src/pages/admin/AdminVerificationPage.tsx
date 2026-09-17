import { useEffect, useState } from 'react';
import { Check, UserCheck, X } from 'lucide-react';
import type { UserProfile } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { listUsersForAdmin, setAlumniVerified } from '@/services/users';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { ListSkeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/utils';

export default function AdminVerificationPage() {
  const { success, error } = useToast();
  const [tab, setTab] = useState('unverified');
  const [unverified, setUnverified] = useState<UserProfile[]>([]);
  const [verified, setVerified] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      listUsersForAdmin({ role: 'alumni', verified: false }),
      listUsersForAdmin({ role: 'alumni', verified: true }),
    ])
      .then(([u, v]) => {
        if (!active) return;
        setUnverified(u.items);
        setVerified(v.items);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const verify = async (u: UserProfile) => {
    try {
      await setAlumniVerified(u.uid, true);
      setUnverified((prev) => prev.filter((p) => p.uid !== u.uid));
      setVerified((prev) => [u, ...prev]);
      success(`${u.name} has been verified.`);
    } catch (e) {
      error(getErrorMessage(e, 'Could not verify alumni.'));
    }
  };

  const unverify = async (u: UserProfile) => {
    try {
      await setAlumniVerified(u.uid, false);
      setVerified((prev) => prev.filter((p) => p.uid !== u.uid));
      setUnverified((prev) => [u, ...prev]);
      success(`${u.name} verification removed.`);
    } catch (e) {
      error(getErrorMessage(e, 'Could not update verification.'));
    }
  };

  const tabs = [
    { value: 'unverified', label: 'Unverified', badge: unverified.length },
    { value: 'verified', label: 'Verified', badge: verified.length },
  ];

  return (
    <div>
      <PageHeader
        title="Alumni Verification"
        description="Review and verify alumni accounts."
      />

      <Tabs value={tab} onValueChange={setTab} items={tabs} className="mb-4 flex-wrap" />

      {loading ? (
        <ListSkeleton count={4} />
      ) : (
        <Card className="px-0 py-0 divide-y">
          {tab === 'unverified' &&
            (unverified.length === 0 ? (
              <EmptyState
                icon={UserCheck}
                title="No unverified alumni"
                description="All alumni have been verified."
                className="border-none"
              />
            ) : (
              unverified.map((u) => (
                <li key={u.uid} className="flex items-center gap-3 p-4">
                  <Avatar src={u.profileImageUrl} name={u.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{u.name}</p>
                      <Badge variant="secondary">Unverified</Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    {u.company && (
                      <p className="truncate text-xs text-muted-foreground">
                        {u.jobRole} at {u.company}
                      </p>
                    )}
                    {u.graduationYear && (
                      <p className="truncate text-xs text-muted-foreground">
                        Batch of {u.graduationYear}
                      </p>
                    )}
                  </div>
                  <Button size="sm" variant="success" onClick={() => verify(u)}>
                    <Check className="h-3.5 w-3.5" /> Verify
                  </Button>
                </li>
              ))
            ))}

          {tab === 'verified' &&
            (verified.length === 0 ? (
              <EmptyState
                icon={UserCheck}
                title="No verified alumni"
                className="border-none"
              />
            ) : (
              verified.map((u) => (
                <li key={u.uid} className="flex items-center gap-3 p-4">
                  <Avatar src={u.profileImageUrl} name={u.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{u.name}</p>
                      <Badge variant="success">Verified</Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    {u.company && (
                      <p className="truncate text-xs text-muted-foreground">
                        {u.jobRole} at {u.company}
                      </p>
                    )}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => unverify(u)}>
                    <X className="h-3.5 w-3.5" /> Unverify
                  </Button>
                </li>
              ))
            ))}
        </Card>
      )}
    </div>
  );
}
