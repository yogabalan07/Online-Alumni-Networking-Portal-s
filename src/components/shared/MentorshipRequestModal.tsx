import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { requestMentorship } from '@/services/mentorship';
import { getErrorMessage } from '@/lib/utils';
import type { UserProfile } from '@/types';

interface MentorshipRequestModalProps {
  open: boolean;
  onClose: () => void;
  alumni: UserProfile | null;
}

export function MentorshipRequestModal({ open, onClose, alumni }: MentorshipRequestModalProps) {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | undefined>();

  const submit = async () => {
    if (!user || !alumni) return;
    if (!topic.trim()) {
      setFieldError('Please enter a topic for your mentorship request.');
      return;
    }
    setSubmitting(true);
    try {
      await requestMentorship(user.uid, alumni.uid, topic.trim(), message.trim(), user.name);
      success(`Mentorship request sent to ${alumni.name}.`);
      setTopic('');
      setMessage('');
      setFieldError(undefined);
      onClose();
    } catch (e) {
      error(getErrorMessage(e, 'Could not send mentorship request.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Request mentorship"
      description="Tell them what you'd like guidance on."
    >
      {alumni && (
        <div className="space-y-4 p-5">
          <div className="flex items-center gap-3 rounded-lg bg-muted/60 p-3">
            <Avatar src={alumni.profileImageUrl} name={alumni.name} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{alumni.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {alumni.jobRole || 'Alumni'}
                {alumni.company ? ` · ${alumni.company}` : ''}
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="mentor-topic">Topic</Label>
            <Input
              id="mentor-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Career guidance for SDE roles"
              maxLength={120}
            />
            {fieldError && <p className="mt-1 text-xs font-medium text-destructive">{fieldError}</p>}
          </div>

          <div>
            <Label htmlFor="mentor-message">Message (optional)</Label>
            <Textarea
              id="mentor-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Introduce yourself and explain how they can help."
              maxLength={600}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={submitting}>
              {submitting ? <Spinner /> : null}
              {submitting ? 'Sending…' : 'Send request'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}