import { useRef, useState } from 'react';
import { FileText, ImageIcon, Paperclip, Send, Smile, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/select';
import { EMOJIS } from '@/lib/constants';
import { cn, formatBytes, getErrorMessage } from '@/lib/utils';
import { validateFile } from '@/services/storage';
import { useToast } from '@/contexts/ToastContext';

interface ChatComposerProps {
  onSendText: (text: string) => Promise<void>;
  onSendFile: (file: File, kind: 'image' | 'document', caption: string, onProgress: (p: number) => void) => Promise<void>;
  disabled?: boolean;
  onTyping?: () => void;
}

export function ChatComposer({ onSendText, onSendFile, disabled, onTyping }: ChatComposerProps) {
  const { error } = useToast();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [pending, setPending] = useState<{ file: File; kind: 'image' | 'document'; previewUrl?: string } | null>(null);
  const [progress, setProgress] = useState(0);

  const imageRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const pickFile = (file: File | undefined, kind: 'image' | 'document') => {
    setAttachOpen(false);
    if (!file) return;
    try {
      validateFile(file, kind);
    } catch (e) {
      error(getErrorMessage(e, 'This file cannot be sent.'));
      return;
    }
    setPending({
      file,
      kind,
      previewUrl: kind === 'image' ? URL.createObjectURL(file) : undefined,
    });
  };

  const sendText = async () => {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    setText('');
    try {
      await onSendText(value);
    } catch (e) {
      setText(value);
      error(getErrorMessage(e, 'Message could not be sent.'));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const sendPending = async () => {
    if (!pending || sending) return;
    setSending(true);
    setProgress(0);
    const caption = pending.kind === 'image' ? text.trim() : '';
    try {
      await onSendFile(pending.file, pending.kind, caption, setProgress);
      setText('');
      setPending(null);
    } catch (e) {
      error(getErrorMessage(e, 'Upload failed. Please try again.'));
    } finally {
      setSending(false);
      setProgress(0);
    }
  };

  return (
    <div className="border-t bg-card">
      {pending && (
        <div className="border-b p-3">
          <div className="flex items-start gap-3 rounded-lg bg-muted/60 p-3">
            {pending.kind === 'image' && pending.previewUrl ? (
              <img src={pending.previewUrl} alt="Preview" className="h-16 w-16 rounded-md object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{pending.file.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {formatBytes(pending.file.size)} · {pending.kind}
              </p>
              {pending.kind === 'image' && (
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Add a caption…"
                  className="mt-1 w-full rounded border border-input bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              )}
              {sending && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
            <button
              onClick={() => {
                if (pending.previewUrl) URL.revokeObjectURL(pending.previewUrl);
                setPending(null);
              }}
              className="rounded p-1 text-muted-foreground hover:text-foreground"
              aria-label="Cancel attachment"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setPending(null)} disabled={sending}>
              Cancel
            </Button>
            <Button size="sm" onClick={sendPending} disabled={sending}>
              {sending ? <Spinner /> : <Send className="h-3.5 w-3.5" />}
              {sending ? 'Sending…' : 'Send'}
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-end gap-2 p-3">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setAttachOpen((v) => !v)}
            disabled={disabled || Boolean(pending)}
            aria-label="Attach file"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          {attachOpen && (
            <div className="absolute bottom-full left-0 z-20 mb-2 w-44 rounded-lg border bg-popover p-1 shadow-lg">
              <button
                onClick={() => imageRef.current?.click()}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
              >
                <ImageIcon className="h-4 w-4" /> Image
              </button>
              <button
                onClick={() => docRef.current?.click()}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
              >
                <FileText className="h-4 w-4" /> Document
              </button>
            </div>
          )}
        </div>

        <input
          ref={imageRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            pickFile(e.target.files?.[0], 'image');
            e.target.value = '';
          }}
        />
        <input
          ref={docRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.md,.rtf"
          className="hidden"
          onChange={(e) => {
            pickFile(e.target.files?.[0], 'document');
            e.target.value = '';
          }}
        />

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEmojiOpen((v) => !v)}
            disabled={disabled || Boolean(pending)}
            aria-label="Insert emoji"
          >
            <Smile className="h-5 w-5" />
          </Button>
          {emojiOpen && (
            <div className="absolute bottom-full left-0 z-20 mb-2 grid w-64 grid-cols-8 gap-1 rounded-lg border bg-popover p-2 shadow-lg">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    setText((prev) => prev + emoji);
                    inputRef.current?.focus();
                  }}
                  className="rounded p-1 text-lg hover:bg-muted"
                  aria-label={`Insert ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onTyping?.();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (!pending) void sendText();
            }
          }}
          rows={1}
          disabled={disabled}
          placeholder={disabled ? 'Select a conversation' : 'Type a message…'}
          aria-label="Message"
          className={cn(
            'max-h-32 min-h-9 flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        />

        <Button
          size="icon"
          onClick={() => (pending ? sendPending() : sendText())}
          disabled={disabled || sending || (!pending && !text.trim())}
          aria-label="Send message"
        >
          {sending ? <Spinner /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}