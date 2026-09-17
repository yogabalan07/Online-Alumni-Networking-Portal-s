import { useState } from 'react';
import {
  Check,
  CheckCheck,
  Clock,
  Download,
  FileText,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import type { ChatMessage } from '@/types';
import { cn, formatBytes, formatTimeShort } from '@/lib/utils';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  onDelete?: (message: ChatMessage) => void;
  onImageClick?: (url: string) => void;
}

function StatusIndicator({ message }: { message: ChatMessage }) {
  if (message.pending) return <Clock className="h-3.5 w-3.5 opacity-70" />;
  if (message.error) return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
  if (message.readAt) return <CheckCheck className="h-3.5 w-3.5 text-sky-500" />;
  if (message.deliveredAt) return <CheckCheck className="h-3.5 w-3.5 opacity-70" />;
  return <Check className="h-3.5 w-3.5 opacity-70" />;
}

export function MessageBubble({ message, isOwn, onDelete, onImageClick }: MessageBubbleProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  if (message.deleted) {
    return (
      <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
        <div className="max-w-[75%] rounded-2xl border border-dashed px-3 py-2 text-xs italic text-muted-foreground">
          This message was deleted
        </div>
      </div>
    );
  }

  return (
    <div className={cn('group flex items-end gap-1.5', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'relative max-w-[80%] rounded-2xl px-3 py-2 shadow-sm sm:max-w-[70%]',
          isOwn
            ? 'rounded-br-sm bg-chat-sent text-foreground'
            : 'rounded-bl-sm bg-chat-received text-foreground',
          message.error && 'ring-1 ring-destructive',
        )}
      >
        {message.type === 'image' && message.attachmentUrl && (
          <button
            onClick={() => onImageClick?.(message.attachmentUrl!)}
            className="mb-1 block overflow-hidden rounded-lg"
            aria-label="Open image"
          >
            <img
              src={message.attachmentUrl}
              alt={message.attachmentName || 'Shared image'}
              className="max-h-72 w-full cursor-zoom-in object-cover"
              loading="lazy"
            />
          </button>
        )}

        {message.type === 'document' && message.attachmentUrl && (
          <a
            href={message.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-1 flex items-center gap-2 rounded-lg bg-background/60 p-2 hover:bg-background/90"
          >
            <div className="rounded-md bg-primary/10 p-2 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{message.attachmentName || 'Document'}</p>
              <p className="text-[10px] text-muted-foreground">
                {formatBytes(message.attachmentSize ?? 0)}
              </p>
            </div>
            <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
          </a>
        )}

        {message.content && (
          <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
        )}

        <div
          className={cn(
            'mt-0.5 flex items-center justify-end gap-1 text-[10px] text-muted-foreground',
            isOwn ? '' : 'text-muted-foreground',
          )}
        >
          <span>{formatTimeShort(message.createdAt)}</span>
          {isOwn && <StatusIndicator message={message} />}
        </div>
      </div>

      {isOwn && onDelete && (
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-full p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100 focus:opacity-100"
            aria-label="Message options"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {menuOpen && (
            <div className="absolute bottom-full right-0 z-10 mb-1 w-32 rounded-lg border bg-popover p-1 shadow-lg">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(message);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-destructive hover:bg-muted"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}