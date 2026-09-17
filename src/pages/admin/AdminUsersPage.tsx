import { useEffect, useState } from 'react';
import { Search, UserCheck, UserX, Users } from 'lucide-react';
import type { UserProfile } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { listUsersForAdmin, setUserActive } from '@/services/users';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { ListSkeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/utils';

export default function AdminUsersPage() {
  const { success, error } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [cursor, setCursor] = useState<unknown>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchUsers = async (reset = true) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);
    try {
      const result = await listUsersForAdmin(
        { query: search || undefined, role: roleFilter || undefined },
        reset ? null : cursor,
      );
      if (reset) setUsers(result.items);
      else setUsers((prev) => [...prev, ...result.items]);
      setCursor(result.next);
    } catch (e) {
      error(getErrorMessage(e, 'Could not load users.'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchUsers(true);
  }, [roleFilter]);

  const handleSearch = () => {
    fetchUsers(true);
  };

  const toggleActive = async (u: UserProfile) => {
    try {
      await setUserActive(u.uid, !u.isActive);
      setUsers((prev) =>
        prev.map((p) => (p.uid === u.uid ? { ...p, isActive: !p.isActive } : p)),
      );
      success(u.isActive ? `${u.name} has been deactivated.` : `${u.name} has been activated.`);
    } catch (e) {
      error(getErrorMessage(e, 'Could not update user status.'));
    }
  };

  return (
    <div>
      <PageHeader
        title="User Management"
        description="View and manage all platform users."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search by name…"
            className="pl-9"
            aria-label="Search users"
          />
        </div>
        <Select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          aria-label="Filter by role"
          className="sm:w-48"
        >
          <option value="">All roles</option>
          <option value="student">Students</option>
          <option value="alumni">Alumni</option>
          <option value="admin">Admins</option>
        </Select>
        <Button onClick={handleSearch}>Search</Button>
      </div>

      {loading ? (
        <ListSkeleton count={5} />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="Try a different search or filter."
        />
      ) : (
        <>
          <Card className="divide-y px-0 py-0">
            {users.map((u) => (
              <li key={u.uid} className="flex items-center gap-3 p-4">
                <Avatar src={u.profileImageUrl} name={u.name} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{u.name}</p>
                    <Badge
                      variant={
                        u.role === 'admin'
                          ? 'destructive'
                          : u.role === 'alumni'
                            ? 'accent'
                            : 'default'
                      }
                      className="capitalize"
                    >
                      {u.role}
                    </Badge>
                    {!u.isActive && <Badge variant="secondary">Inactive</Badge>}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
                <Button
                  size="sm"
                  variant={u.isActive ? 'outline' : 'success'}
                  onClick={() => toggleActive(u)}
                >
                  {u.isActive ? (
                    <>
                      <UserX className="h-3.5 w-3.5" /> Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-3.5 w-3.5" /> Activate
                    </>
                  )}
                </Button>
              </li>
            ))}
          </Card>

          {cursor && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={() => fetchUsers(false)}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
