import { useEffect, useState } from 'react';
import type { EventItem } from '@/types';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Select, Spinner } from '@/components/ui/select';
import { EVENT_TYPES } from '@/lib/constants';
import { createEvent, updateEvent, type EventInput } from '@/services/events';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getErrorMessage } from '@/lib/utils';

interface EventFormModalProps {
  open: boolean;
  onClose: () => void;
  event?: EventItem | null;
}

const EMPTY = {
  title: '',
  description: '',
  date: '',
  time: '',
  venue: '',
  eventType: EVENT_TYPES[0] as string,
  registrationDeadline: '',
};

export function EventFormModal({ open, onClose, event }: EventFormModalProps) {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [form, setForm] = useState({ ...EMPTY });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (event) {
      setForm({
        title: event.title,
        description: event.description,
        date: new Date(event.date).toISOString().slice(0, 10),
        time: event.time ?? '',
        venue: event.venue ?? '',
        eventType: event.eventType ?? EVENT_TYPES[0],
        registrationDeadline: event.registrationDeadline
          ? new Date(event.registrationDeadline).toISOString().slice(0, 10)
          : '',
      });
    } else {
      setForm({ ...EMPTY });
    }
    setErrors({});
  }, [event, open]);

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    if (!user) return;
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = 'Title is required.';
    if (!form.description.trim()) next.description = 'Description is required.';
    if (!form.date) next.date = 'Date is required.';
    if (!form.venue.trim()) next.venue = 'Venue is required.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const payload: EventInput = {
      title: form.title.trim(),
      description: form.description.trim(),
      date: new Date(`${form.date}T00:00:00`).getTime(),
      time: form.time.trim(),
      venue: form.venue.trim(),
      eventType: form.eventType,
      registrationDeadline: form.registrationDeadline
        ? new Date(`${form.registrationDeadline}T23:59:59`).getTime()
        : undefined,
    };

    setSubmitting(true);
    try {
      if (event) {
        await updateEvent(event.id, payload);
        success('Event updated.');
      } else {
        await createEvent(payload, user.uid);
        success('Event created.');
      }
      onClose();
    } catch (e) {
      error(getErrorMessage(e, 'Could not save the event.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={event ? 'Edit event' : 'Create an event'}
      description="Organise alumni meets, workshops, webinars and more."
    >
      <div className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="event-title">Title</Label>
            <Input id="event-title" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Annual Alumni Meet 2026" />
            {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title}</p>}
          </div>
          <div>
            <Label htmlFor="event-type">Event type</Label>
            <Select id="event-type" value={form.eventType} onChange={(e) => set('eventType', e.target.value)}>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="event-venue">Venue</Label>
            <Input id="event-venue" value={form.venue} onChange={(e) => set('venue', e.target.value)} placeholder="e.g. Main Auditorium / Online" />
            {errors.venue && <p className="mt-1 text-xs text-destructive">{errors.venue}</p>}
          </div>
          <div>
            <Label htmlFor="event-date">Date</Label>
            <Input id="event-date" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
            {errors.date && <p className="mt-1 text-xs text-destructive">{errors.date}</p>}
          </div>
          <div>
            <Label htmlFor="event-time">Time</Label>
            <Input id="event-time" type="time" value={form.time} onChange={(e) => set('time', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="event-deadline">Registration deadline</Label>
            <Input
              id="event-deadline"
              type="date"
              value={form.registrationDeadline}
              onChange={(e) => set('registrationDeadline', e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="event-desc">Description</Label>
          <Textarea
            id="event-desc"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Agenda, speakers and what attendees can expect…"
            className="min-h-28"
            maxLength={3000}
          />
          {errors.description && <p className="mt-1 text-xs text-destructive">{errors.description}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? <Spinner /> : null}
            {submitting ? 'Saving…' : event ? 'Save changes' : 'Create event'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}