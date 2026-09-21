import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { listenFollowStatus, toggleFollow } from '@/services/follows';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FollowButton({
  targetUserId,
  targetName,
  className,
}: {
  targetUserId: string;
  targetName: string;
  className?: string;
}) {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.uid === targetUserId) return;
    const unsub = listenFollowStatus(user.uid, targetUserId, setFollowing);
    return unsub;
  }, [user, user?.uid, targetUserId]);

  if (!user || user.uid === targetUserId) return null;

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const nowFollowing = await toggleFollow(user.uid, targetUserId, user.name);
      setFollowing(nowFollowing);
      success(nowFollowing ? `Following ${targetName}` : `Unfollowed ${targetName}`);
    } catch (e) {
      error('Could not update follow status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={following ? 'outline' : 'default'}
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className={cn('gap-1.5', className)}
    >
      {following ? (
        <>
          <UserMinus className="h-3.5 w-3.5" /> Following
        </>
      ) : (
        <>
          <UserPlus className="h-3.5 w-3.5" /> Follow
        </>
      )}
    </Button>
  );
}
