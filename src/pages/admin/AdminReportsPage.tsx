import { useEffect, useState } from 'react';
import { AlertCircle, FileText } from 'lucide-react';
import type { Report, ReportStatus } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { listenReports, updateReportStatus } from '@/services/reports';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { ListSkeleton } from '@/components/ui/skeleton';
import { getErrorMessage, timeAgo, tsNum } from '@/lib/utils';

const STATUS_LABELS: Record<ReportStatus, string> = {
  open: 'Open',
  reviewing: 'Reviewing',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

const STATUS_VARIANTS: Record<ReportStatus, 'default' | 'secondary' | 'success' | 'accent'> = {
  open: 'default',
  reviewing: 'accent',
  resolved: 'success',
  dismissed: 'secondary',
};

export default function AdminReportsPage() {
  const { success, error } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('open');

  useEffect(() => {
    const unsub = listenReports((list) => {
      setReports(list);
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = reports.filter((r) => r.status === tab);

  const tabs = [
    { value: 'open', label: 'Open', badge: reports.filter((r) => r.status === 'open').length },
    { value: 'reviewing', label: 'Reviewing', badge: reports.filter((r) => r.status === 'reviewing').length },
    { value: 'resolved', label: 'Resolved', badge: reports.filter((r) => r.status === 'resolved').length },
    { value: 'dismissed', label: 'Dismissed', badge: reports.filter((r) => r.status === 'dismissed').length },
  ];

  const updateStatus = async (report: Report, status: ReportStatus) => {
    try {
      await updateReportStatus(report.id, status);
      setReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, status } : r)),
      );
      success(`Report marked as ${STATUS_LABELS[status].toLowerCase()}.`);
    } catch (e) {
      error(getErrorMessage(e, 'Could not update report status.'));
    }
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Review and manage user reports."
      />

      <Tabs value={tab} onValueChange={setTab} items={tabs} className="mb-4 flex-wrap" />

      {loading ? (
        <ListSkeleton count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports"
          description={`No ${tab} reports at the moment.`}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={STATUS_VARIANTS[r.status]}>
                        {STATUS_LABELS[r.status]}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {r.targetType}
                      </Badge>
                    </div>
                    <h3 className="mt-2 text-sm font-medium">{r.reason}</h3>
                    {r.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                      <span>Reporter: {r.reporterId}</span>
                      <span>Target: {r.targetId}</span>
                      <span>{timeAgo(tsNum(r.createdAt))}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {r.status === 'open' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(r, 'reviewing')}>
                          Review
                        </Button>
                        <Button size="sm" variant="success" onClick={() => updateStatus(r, 'resolved')}>
                          Resolve
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => updateStatus(r, 'dismissed')}>
                          Dismiss
                        </Button>
                      </>
                    )}
                    {r.status === 'reviewing' && (
                      <>
                        <Button size="sm" variant="success" onClick={() => updateStatus(r, 'resolved')}>
                          Resolve
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => updateStatus(r, 'dismissed')}>
                          Dismiss
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
