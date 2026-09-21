import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  GraduationCap,
  ExternalLink,
  Users,
  UserCheck,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUser } from '@/services/users';
import { listenFollowers, listenFollowing } from '@/services/follows';
import { getConnectedIds } from '@/services/connections';
import { getConversationId } from '@/services/chat';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { FollowButton } from '@/components/social/FollowButton';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { FullPageLoader } from '@/components/ui/select';
import type { UserProfile } from '@/types';
import { useNavigate } from 'react-router-dom';

export default function UserViewPage() {
  const { uid } = useParams<{ uid: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    getUser(uid).then((p) => { setProfile(p); setLoading(false); }).catch(() => setLoading(false));
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    const unsub1 = listenFollowers(uid, (f) => setFollowerCount(f.length));
    const unsub2 = listenFollowing(uid, (f) => setFollowingCount(f.length));
    return () => { unsub1(); unsub2(); };
  }, [uid]);

  useEffect(() => {
    if (!currentUser || !uid) return;
    getConnectedIds(currentUser.uid).then((ids) => setIsConnected(ids.includes(uid))).catch(() => {});
  }, [currentUser, currentUser?.uid, uid]);

  if (loading) return <FullPageLoader />;
  if (!profile) return <div className="p-8 text-center text-muted-foreground">User not found.</div>;

  const handleMessage = () => {
    if (!currentUser) return;
    navigate(`/messages/${getConversationId(currentUser.uid, profile.uid)}`);
  };

  return (
    <div>
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className={`h-32 ${profile.role === 'alumni' ? 'bg-gradient-to-r from-teal-600 to-cyan-600' : 'bg-gradient-to-r from-blue-600 to-purple-600'}`} />
        <CardContent className="relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 -mt-12">
            <Avatar src={profile.profileImageUrl} name={profile.name} size="xl" className="ring-4 ring-card" />
            <div className="flex-1 pt-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold">{profile.name}</h1>
                <VerifiedBadge verified={profile.verified} />
                <Badge variant="outline" className="capitalize text-xs">{profile.role}</Badge>
              </div>
              {profile.jobRole && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Briefcase className="h-3.5 w-3.5" /> {profile.jobRole}{profile.company ? ` at ${profile.company}` : ''}
                </p>
              )}
              {profile.location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3.5 w-3.5" /> {profile.location}
                </p>
              )}
              {profile.department && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <GraduationCap className="h-3.5 w-3.5" /> {profile.department}
                </p>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <FollowButton targetUserId={profile.uid} targetName={profile.name} />
              {isConnected && (
                <Button size="sm" variant="outline" onClick={handleMessage} className="gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" /> Message
                </Button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-4">
            <Link to={`/followers/${profile.uid}`} className="text-center">
              <p className="text-lg font-bold">{followerCount}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </Link>
            <Link to={`/following/${profile.uid}`} className="text-center">
              <p className="text-lg font-bold">{followingCount}</p>
              <p className="text-xs text-muted-foreground">Following</p>
            </Link>
          </div>

          {profile.bio && (
            <p className="mt-4 text-sm text-muted-foreground">{profile.bio}</p>
          )}

          {profile.skills && profile.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profile.skills.map((s) => (
                <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
              ))}
            </div>
          )}

          {profile.linkedIn && (
            <a href={profile.linkedIn} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline">
              <ExternalLink className="h-3.5 w-3.5" /> LinkedIn Profile
            </a>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
