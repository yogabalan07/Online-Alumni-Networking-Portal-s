import { useRef, useState } from 'react';
import {
  Image as ImageIcon,
  Rocket,
  Link2,
  Trophy,
  HelpCircle,
  X,
  Loader2,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { createPost, type PostInput } from '@/services/posts';
import { uploadPostImage } from '@/services/storage';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { PostType } from '@/types';

const POST_TYPES: { type: PostType; label: string; icon?: typeof Rocket }[] = [
  { type: 'general', label: 'General', icon: HelpCircle },
  { type: 'project', label: 'Project', icon: Rocket },
  { type: 'achievement', label: 'Achievement', icon: Trophy },
  { type: 'photo', label: 'Photo', icon: ImageIcon },
  { type: 'question', label: 'Question', icon: HelpCircle },
];

const ALUMNI_POST_TYPES: { type: PostType; label: string; icon?: typeof Rocket }[] = [
  { type: 'general', label: 'General', icon: HelpCircle },
  { type: 'career', label: 'Career', icon: Rocket },
  { type: 'achievement', label: 'Achievement', icon: Trophy },
  { type: 'job', label: 'Job', icon: Briefcase },
  { type: 'internship', label: 'Internship', icon: Rocket },
  { type: 'project', label: 'Project', icon: Rocket },
  { type: 'advice', label: 'Advice', icon: HelpCircle },
];

export function PostComposer({ onPost }: { onPost?: () => void }) {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<PostType>('general');
  const [images, setImages] = useState<string[]>([]);
  const [links, setLinks] = useState<{ url: string; label: string }[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectSkills, setProjectSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const types = user.role === 'alumni' ? ALUMNI_POST_TYPES : POST_TYPES;

  const reset = () => {
    setContent('');
    setPostType('general');
    setImages([]);
    setLinks([]);
    setProjectTitle('');
    setProjectDescription('');
    setProjectSkills([]);
    setLinkInput('');
    setLinkLabel('');
    setSkillInput('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const url = await uploadPostImage(user.uid, file);
        setImages((prev) => [...prev, url]);
      }
    } catch { error('Image upload failed.'); }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeImage = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx));

  const addLink = () => {
    if (!linkInput.trim()) return;
    try { new URL(linkInput); } catch { error('Enter a valid URL.'); return; }
    setLinks((prev) => [...prev, { url: linkInput.trim(), label: linkLabel.trim() || '' }]);
    setLinkInput('');
    setLinkLabel('');
  };

  const removeLink = (idx: number) => setLinks((prev) => prev.filter((_, i) => i !== idx));

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s || projectSkills.includes(s)) return;
    setProjectSkills((prev) => [...prev, s]);
    setSkillInput('');
  };

  const handleSubmit = async () => {
    if (!content.trim() && !projectTitle.trim()) return;
    setSubmitting(true);
    try {
      const input: PostInput = {
        content: content.trim(),
        postType,
        images,
        links,
      };
      if (postType === 'project') {
        input.projectTitle = projectTitle.trim() || undefined;
        input.projectDescription = projectDescription.trim() || undefined;
        input.projectSkills = projectSkills.length ? projectSkills : undefined;
      }
      await createPost(input, user.uid, user.role, user.name, user.profileImageUrl);
      success('Post published!');
      reset();
      setOpen(false);
      onPost?.();
    } catch { error('Could not publish post.'); }
    setSubmitting(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border bg-card p-4 text-left text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
      >
        What's on your mind, {user.name.split(' ')[0]}?
      </button>

      <Modal open={open} onClose={() => { setOpen(false); reset(); }} title="Create Post" size="lg">
        <div className="space-y-4">
          {/* Author */}
          <div className="flex items-center gap-3">
            <Avatar src={user.profileImageUrl} name={user.name} size="md" />
            <div>
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>

          {/* Post type selector */}
          <div className="flex flex-wrap gap-1.5">
            {types.map((t) => (
              <button
                key={t.type}
                onClick={() => setPostType(t.type)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  postType === t.type
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Project fields */}
          {postType === 'project' && (
            <div className="space-y-3 rounded-lg border p-3">
              <Input
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="Project title"
              />
              <Textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Project description"
                className="min-h-[80px]"
              />
              <div>
                <div className="flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    placeholder="Add a skill"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addSkill}>Add</Button>
                </div>
                {projectSkills.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {projectSkills.map((s) => (
                      <Badge key={s} variant="secondary" className="gap-1">
                        {s}
                        <button onClick={() => setProjectSkills((p) => p.filter((x) => x !== s))}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={postType === 'project' ? 'Share more details about your project…' : "What's on your mind?"}
            className="min-h-[120px]"
          />

          {/* Images preview */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative group">
                  <img src={img} alt="" className="h-20 w-20 rounded-lg object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Links */}
          {links.length > 0 && (
            <div className="space-y-1.5">
              {links.map((l, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate">{l.label || l.url}</span>
                  <button onClick={() => removeLink(i)} className="ml-auto text-muted-foreground hover:text-destructive">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add link */}
          <div className="flex gap-2">
            <Input
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              placeholder="Add a link (GitHub, demo, etc.)"
              className="flex-1"
            />
            <Input
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
              placeholder="Label (optional)"
              className="w-32"
            />
            <Button type="button" variant="outline" size="sm" onClick={addLink}>
              <Link2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between border-t pt-3">
            <div className="flex gap-1">
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
              <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                Photo
              </Button>
            </div>
            <Button onClick={handleSubmit} disabled={submitting || (!content.trim() && !projectTitle.trim())}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Publish
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
