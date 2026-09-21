import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Heart,
  MessageCircle,
  Lightbulb,
  MoreHorizontal,
  ExternalLink,
  Trash2,
  Edit,
  Send,
  Bookmark,
  Share2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
  toggleLike,
  listenLikeStatus,
  addComment,
  deleteComment,
  listenComments,
  addSuggestion,
  deleteSuggestion,
  listenSuggestions,
} from '@/services/posts';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { timeAgo, cn } from '@/lib/utils';
import type { Post, PostComment, PostSuggestion, UserRole } from '@/types';

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[10px] font-semibold capitalize',
        role === 'student' && 'border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-950 dark:text-blue-300',
        role === 'alumni' && 'border-teal-400 bg-teal-50 text-teal-700 dark:border-teal-600 dark:bg-teal-950 dark:text-teal-300',
        role === 'admin' && 'border-purple-400 bg-purple-50 text-purple-700 dark:border-purple-600 dark:bg-purple-950 dark:text-purple-300',
      )}
    >
      {role}
    </Badge>
  );
}

function LinkPreview({ url, label }: { url: string; label?: string }) {
  const domain = (() => {
    try { return new URL(url).hostname.replace('www.', ''); } catch { return url; }
  })();
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm hover:bg-muted transition-colors"
    >
      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate text-foreground">{label || domain}</span>
      <span className="ml-auto truncate text-xs text-muted-foreground">{domain}</span>
    </a>
  );
}

export function PostCard({ post, onDelete }: { post: Post; onDelete?: (id: string) => void }) {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showComments, setShowComments] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [suggestions, setSuggestions] = useState<PostSuggestion[]>([]);
  const [commentText, setCommentText] = useState('');
  const [suggestionText, setSuggestionText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showImages, setShowImages] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    return listenLikeStatus(post.id, user.uid, setLiked);
  }, [post.id, user, user?.uid]);

  useEffect(() => {
    return listenComments(post.id, setComments);
  }, [post.id]);

  useEffect(() => {
    return listenSuggestions(post.id, setSuggestions);
  }, [post.id]);

  useEffect(() => {
    setLikeCount(post.likeCount);
  }, [post.likeCount]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLike = async () => {
    if (!user) return;
    try {
      const nowLiked = await toggleLike(post.id, user.uid);
      setLiked(nowLiked);
      setLikeCount((c) => nowLiked ? c + 1 : c - 1);
    } catch { /* ignore */ }
  };

  const handleComment = async () => {
    if (!user || !commentText.trim()) return;
    try {
      await addComment(post.id, user.uid, user.name, user.profileImageUrl, user.role, commentText.trim());
      setCommentText('');
    } catch { error('Could not post comment.'); }
  };

  const handleSuggestion = async () => {
    if (!user || !suggestionText.trim()) return;
    try {
      await addSuggestion(post.id, user.uid, user.name, user.profileImageUrl, user.role, suggestionText.trim());
      setSuggestionText('');
      success('Suggestion submitted.');
    } catch { error('Could not post suggestion.'); }
  };

  const handleDeleteComment = async (commentId: string) => {
    try { await deleteComment(post.id, commentId); } catch { error('Could not delete comment.'); }
  };

  const handleDeleteSuggestion = async (suggestionId: string) => {
    try { await deleteSuggestion(post.id, suggestionId); } catch { error('Could not delete suggestion.'); }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.origin + '/feed?post=' + post.id);
    success('Link copied to clipboard.');
  };

  const postTypeLabels: Record<string, string> = {
    general: 'General',
    project: 'Project',
    achievement: 'Achievement',
    photo: 'Photo',
    question: 'Question',
    career: 'Career',
    job: 'Job',
    internship: 'Internship',
    advice: 'Advice',
  };

  return (
    <>
      <Card className="animate-fade-in">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start gap-3">
            <Avatar src={post.authorPhoto} name={post.authorName} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold">{post.authorName}</span>
                <RoleBadge role={post.authorRole} />
                <Badge variant="secondary" className="text-[10px]">{postTypeLabels[post.postType] || post.postType}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</p>
            </div>
            <div className="relative" ref={menuRef}>
              <Button variant="ghost" size="iconSm" onClick={() => setShowMenu(!showMenu)}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              {showMenu && (
                <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border bg-card shadow-lg">
                  <button onClick={handleShare} className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted">
                    <Share2 className="h-3.5 w-3.5" /> Share
                  </button>
                  {user?.uid === post.authorId && (
                    <>
                      <button onClick={() => { onDelete?.(post.id); setShowMenu(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="mt-3">
            {post.projectTitle && (
              <p className="text-base font-semibold mb-1">{post.projectTitle}</p>
            )}
            <p className="text-sm whitespace-pre-wrap">{post.content}</p>
            {post.projectDescription && (
              <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{post.projectDescription}</p>
            )}
            {post.projectSkills && post.projectSkills.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {post.projectSkills.map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                ))}
              </div>
            )}
          </div>

          {/* Images */}
          {post.images.length > 0 && (
            <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: post.images.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))' }}>
              {post.images.map((img, i) => (
                <button key={i} onClick={() => setShowImages(img)} className="overflow-hidden rounded-lg">
                  <img src={img} alt="" className="h-48 w-full object-cover transition-transform hover:scale-105" loading="lazy" />
                </button>
              ))}
            </div>
          )}

          {/* Links */}
          {post.links.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {post.links.map((link, i) => (
                <LinkPreview key={i} url={link.url} label={link.label} />
              ))}
            </div>
          )}

          {/* Action bar */}
          <div className="mt-4 flex items-center gap-1 border-t pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={cn('gap-1.5 text-muted-foreground', liked && 'text-red-500 hover:text-red-600')}
            >
              <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
              {likeCount > 0 && <span className="text-xs">{likeCount}</span>}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="gap-1.5 text-muted-foreground"
            >
              <MessageCircle className="h-4 w-4" />
              {post.commentCount > 0 && <span className="text-xs">{post.commentCount}</span>}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="gap-1.5 text-muted-foreground"
            >
              <Lightbulb className="h-4 w-4" />
              {post.suggestionCount > 0 && <span className="text-xs">{post.suggestionCount}</span>}
            </Button>
          </div>

          {/* Comments */}
          {showComments && (
            <div className="mt-3 border-t pt-3 space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2">
                  <Avatar src={c.userPhoto} name={c.userName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium">{c.userName}</span>
                      <RoleBadge role={c.userRole} />
                      <span className="text-[10px] text-muted-foreground">{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="text-sm mt-0.5">{c.text}</p>
                  </div>
                  {(user?.uid === c.userId || user?.role === 'admin') && (
                    <Button variant="ghost" size="iconSm" onClick={() => handleDeleteComment(c.id)} className="shrink-0">
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ))}
              {user && (
                <div className="flex gap-2">
                  <Input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                    placeholder="Write a comment…"
                    className="flex-1"
                  />
                  <Button size="iconSm" onClick={handleComment} disabled={!commentText.trim()}>
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Suggestions */}
          {showSuggestions && (
            <div className="mt-3 border-t pt-3 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase">Suggestions</p>
              {suggestions.map((s) => (
                <div key={s.id} className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 p-2">
                  <Lightbulb className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium">{s.userName}</span>
                      <RoleBadge role={s.userRole} />
                      <span className="text-[10px] text-muted-foreground">{timeAgo(s.createdAt)}</span>
                    </div>
                    <p className="text-sm mt-0.5">{s.text}</p>
                  </div>
                  {(user?.uid === s.userId || user?.role === 'admin') && (
                    <Button variant="ghost" size="iconSm" onClick={() => handleDeleteSuggestion(s.id)} className="shrink-0">
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ))}
              {user && (
                <div className="flex gap-2">
                  <Input
                    value={suggestionText}
                    onChange={(e) => setSuggestionText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSuggestion()}
                    placeholder="Add a constructive suggestion…"
                    className="flex-1"
                  />
                  <Button size="iconSm" variant="outline" onClick={handleSuggestion} disabled={!suggestionText.trim()}>
                    <Lightbulb className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image modal */}
      {showImages && (
        <Modal open onClose={() => setShowImages(null)} title="Image" size="lg">
          <img src={showImages} alt="" className="w-full rounded-lg" />
        </Modal>
      )}
    </>
  );
}
