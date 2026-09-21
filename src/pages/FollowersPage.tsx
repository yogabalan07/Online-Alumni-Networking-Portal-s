import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { UserCheck, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { listenFollowers, listenFollowing } from '@/services/follows';
import { getUsersByIds } from '@/services/users';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { FollowButton } from '@/components/social/FollowButton';
import { EmptyState } from '@/components/ui/empty-state';
import type { Follow, UserProfile } from '@/types';

export default function FollowersPage() {
  const { user } = useAuth();
  const [followers, setFollowers] = useState<Follow[]>([]);
  const [users, setUsers] = useState<Record<string, UserProfile>>({});

  useEffect(() => {
    if (!user) return;
    return listenFollowers(user.uid, setFollowers);
  }, [user, user?.uid]);

  useEffect(() => {
    const ids = followers.map((f) => f.followerId);
    if (ids.length === 0) { setUsers({}); return; }
    getUsersByIds(ids).then(setUsers).catch(() => {});
  }, [followers]);

  if (!user) return null;

  return (
    <div>
      <PageHeader title="Followers" description={`${followers.length} people follow you`} />

      {followers.length === 0 ? (
        <EmptyState icon={UserCheck} title="No followers yet" description="Share posts to attract followers." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl">
          {followers.map((f) => {
            const u = users[f.followerId];
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
