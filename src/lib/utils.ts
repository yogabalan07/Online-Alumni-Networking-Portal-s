import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(ts: number | string | Date | undefined | null): string {
  if (!ts) return '';
  const d = toDate(ts);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  if (isYesterday) return 'Yesterday';
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatTimeShort(ts: number | string | Date | undefined | null): string {
  if (!ts) return '';
  return new Date(toDate(ts)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function toDate(ts: number | string | Date | undefined | null): Date {
  if (!ts) return new Date();
  if (ts instanceof Date) return ts;
  if (typeof ts === 'number') return new Date(ts);
  if (typeof ts === 'string') {
    const n = Number(ts);
    if (!Number.isNaN(n)) return new Date(n);
    return new Date(ts);
  }
  if (typeof ts === 'object' && 'seconds' in (ts as Record<string, unknown>)) {
    return new Date(((ts as { seconds: number }).seconds) * 1000);
  }
  return new Date();
}

export function tsNum(ts: unknown): number {
  if (!ts) return 0;
  if (typeof ts === 'number') return ts;
  if (typeof ts === 'string') {
    const n = Number(ts);
    return Number.isNaN(n) ? new Date(ts).getTime() : n;
  }
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === 'object' && 'seconds' in (ts as Record<string, unknown>)) {
    const s = (ts as { seconds: number }).seconds;
    return s ? s * 1000 : tsNum((ts as { nanoseconds?: number }).nanoseconds ?? 0);
  }
  return 0;
}

export function timeAgo(ts: number | string | Date | undefined | null): string {
  if (!ts) return '';
  const d = toDate(ts).getTime();
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return toDate(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function formatBytes(bytes: number): string {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function truncate(str: string, len = 60): string {
  if (!str) return '';
  return str.length > len ? str.slice(0, len - 1) + '…' : str;
}

export function initials(name: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function fileExtension(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

export function formatFullDate(ts: number | string | Date | undefined | null): string {
  if (!ts) return '';
  return toDate(ts).toLocaleString([], {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!err) return fallback;
  const code = (err as { code?: string }).code as string | undefined;
  if (code) {
    const msg = friendlyAuthError(code);
    if (msg) return msg;
  }
  return fallback;
}

const AUTH_ERROR_MAP: Record<string, string> = {
  'auth/email-already-in-use': 'This email is already registered. Try logging in instead.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled for the app.',
  'auth/user-disabled': 'This account has been disabled. Contact an administrator.',
  'auth/requires-recent-login': 'Please sign in again to continue.',
  'storage/unauthorized': 'You do not have permission to access this file.',
  'storage/canceled': 'The upload was cancelled.',
  'storage/retry-limit-exceeded': 'Upload failed. Please try again.',
  'storage/object-not-found': 'The file could not be found.',
  'permission-denied': 'You do not have permission to perform this action.',
  'not-found': 'The requested data could not be found.',
  'unavailable': 'The service is temporarily unavailable. Please try again.',
  'resource-exhausted': 'Too many requests. Please try again shortly.',
};

export function friendlyAuthError(code: string): string | undefined {
  return AUTH_ERROR_MAP[code];
}