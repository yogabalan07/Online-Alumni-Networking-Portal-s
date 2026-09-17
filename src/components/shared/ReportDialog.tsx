import { useState } from 'react';
import { Flag } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Label, Textarea } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { REPORT_REASONS } from '@/lib/constants';
import { createReport, type ReportTargetType } from '@/services/reports';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/lib/utils';

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
}

export function ReportDialog({ open, onClose, targetType, targetId }: ReportDialogProps) {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      await createReport(user.uid, targetType, targetId, reason, description);
      success('Report submitted. Our moderators will review it.');
      setDescription('');
      onClose();
    } catch (e) {
      error(getErrorMessage(e, 'Could not submit your report. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Report content"
      description="Help keep the community safe. Reports are reviewed by administrators."
      size="md"
    >
      <div className="space-y-4 p-5">
        <div>
          <Label htmlFor="report-reason">Reason</Label>
          <Select
            id="report-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            {REPORT_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="report-desc">Additional details (optional)</Label>
          <Textarea
            id="report-desc"
            value={description}
            maxLength={500}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide any context that will help our moderators."
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={submit} disabled={submitting}>
            <Flag className="h-4 w-4" />
            {submitting ? 'Submitting…' : 'Submit report'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}