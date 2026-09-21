import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { listenFollowing } from '@/services/follows';
import { getUsersByIds } from '@/services/users';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { FollowButton } from '@/components/social/FollowButton';
import { EmptyState } from '@/components/ui/empty-state';
import type { Follow, UserProfile } from '@/types';

export default function FollowingPage() {
  const { user } = useAuth();
  const [following, setFollowing] = useState<Follow[]>([]);
  const [users, setUsers] = useState<Record<string, UserProfile>>({});

  useEffect(() => {
    if (!user) return;
    return listenFollowing(user.uid, setFollowing);
  }, [user, user?.uid]);

  useEffect(() => {
    const ids = following.map((f) => f.followingId);
    if (ids.length === 0) { setUsers({}); return; }
    getUsersByIds(ids).then(setUsers).catch(() => {});
  }, [following]);

  if (!user) return null;

  return (
    <div>
      <PageHeader title="Following" description={`You follow ${following.length} people`} />

      {following.length === 0 ? (
        <EmptyState icon={UserPlus} title="Not following anyone yet" description="Follow people to see their posts in your feed." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl">
          {following.map((f) => {
            const u = users[f.followingId];
            if (!u) return null;
            return (
              <Card key={f.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Link to={user.uid === u.uid ? '/profile' : `/user/${u.uid}`}>
                    <Avatar src={u.profileImageUrl} name={u.name} size="lg" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link to={user.uid === u.uid ? '/profile' : `/user/${u.uid}`} className="text-sm font-medium hover:underline truncate block">
                      {u.name}
                    </Link>
                    <p className="text-xs text-muted-foreground capitalize">{u.role}</p>
                  </div>
                  <FollowButton targetUserId={u.uid} targetName={u.name} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
