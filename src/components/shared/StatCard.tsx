import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'text-primary',
  hint,
  loading,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent?: string;
  hint?: string;
  loading?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold">
            {loading ? <span className="inline-block h-7 w-12 animate-pulse rounded bg-muted" /> : value}
          </p>
          {hint && <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn('rounded-lg bg-muted p-2', accent)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}