import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Users, GraduationCap, Rocket, Trophy, Briefcase, HelpCircle, Camera } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { listenPosts, deletePost } from '@/services/posts';
import { PostCard } from '@/components/social/PostCard';
import { PostComposer } from '@/components/social/PostComposer';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Post, UserRole } from '@/types';

type FeedFilter = 'all' | 'student' | 'alumni' | 'project' | 'achievement' | 'job' | 'internship' | 'question' | 'photo';

const FILTERS: { key: FeedFilter; label: string; icon: typeof Users }[] = [
  { key: 'all', label: 'All', icon: Users },
  { key: 'student', label: 'Students', icon: GraduationCap },
  { key: 'alumni', label: 'Alumni', icon: GraduationCap },
  { key: 'project', label: 'Projects', icon: Rocket },
  { key: 'achievement', label: 'Achievements', icon: Trophy },
  { key: 'job', label: 'Jobs', icon: Briefcase },
  { key: 'question', label: 'Questions', icon: HelpCircle },
  { key: 'photo', label: 'Photos', icon: Camera },
];

export default function CommunityFeedPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<FeedFilter>('all');

  useEffect(() => {
    const unsub = listenPosts((list) => {
      setPosts(list);
    });
    return unsub;
  }, []);

  const filteredPosts = posts.filter((p) => {
    if (filter === 'student') return p.authorRole === 'student';
    if (filter === 'alumni') return p.authorRole === 'alumni';
    if (filter === 'all') return true;
    return p.postType === filter;
  });

  const highlightPostId = searchParams.get('post');

  return (
    <div>
      <PageHeader
        title="Community Feed"
        description="See what students and alumni are sharing."
      />

      <div className="mb-5">
        <PostComposer />
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              filter === f.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
          >
            <f.icon className="h-3 w-3" />
            {f.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-4 max-w-2xl mx-auto">
        {filteredPosts.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No posts yet"
            description="Be the first to share something with the community."
          />
        ) : (
          filteredPosts.map((post) => (
            <div
              key={post.id}
              id={`post-${post.id}`}
              className={cn(
                highlightPostId === post.id && 'ring-2 ring-primary rounded-xl',
              )}
            >
              <PostCard post={post} onDelete={async (id) => {
                try { await deletePost(id); } catch { /* handled in PostCard */ }
              }} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
