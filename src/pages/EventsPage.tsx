import { useMemo, useState } from 'react';
import { CalendarDays, Plus, Search } from 'lucide-react';
import type { EventItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { deleteEvent, listenEvents, registerForEvent, unregisterFromEvent } from '@/services/events';
import { useEventRegistrationCounts, useMyEventRegistrations } from '@/hooks/useEventData';
import { EventCard } from '@/components/shared/EventCard';
import { EventFormModal } from '@/components/shared/EventFormModal';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { ListSkeleton } from '@/components/ui/skeleton';
import { getErrorMessage, tsNum } from '@/lib/utils';
import { EVENT_TYPES } from '@/lib/constants';

export default function EventsPage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EventItem | null>(null);

  useMemo(() => {
    setLoading(true);
    return undefined;
  }, []);

  // subscribe to events
  useMemo(() => undefined, []);

  // Use an effect-like pattern via useState initialization
  const [_mounted] = useState(() => true);

  useMemo(() => {
    const unsub = listenEvents((list) => {
      setEvents(list);
      setLoading(false);
    });
    return unsub;
  }, []);

  const registered = useMyEventRegistrations(user?.uid);
  const counts = useEventRegistrationCounts(events.map((e) => e.id));

  if (!user) return null;

  const now = Date.now();
  const filtered = events.filter((e) => {
    const isUpcoming = tsNum(e.date) >= now;
    if (tab === 'upcoming' && !isUpcoming) return false;
    if (tab === 'past' && isUpcoming) return false;
    if (tab === 'registered' && !registered.includes(e.id)) return false;
    if (typeFilter && e.eventType !== typeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const haystack = `${e.title} ${e.venue} ${e.description} ${e.eventType ?? ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const canCreate = user.role === 'alumni' || user.role === 'admin';

  const register = async (event: EventItem) => {
    try {
      await registerForEvent(event.id, user.uid);
      success(`Registered for ${event.title}.`);
    } catch (e) {
      error(getErrorMessage(e, 'Could not register for this event.'));
    }
  };

  const unregister = async (event: EventItem) => {
    try {
      await unregisterFromEvent(event.id, user.uid);
      success('Registration cancelled.');
    } catch (e) {
      error(getErrorMessage(e, 'Could not cancel registration.'));
    }
  };

  const remove = async (event: EventItem) => {
    if (!window.confirm(`Delete "${event.title}"? This cannot be undone.`)) return;
    try {
      await deleteEvent(event.id);
      success('Event deleted.');
    } catch (e) {
      error(getErrorMessage(e, 'Could not delete the event.'));
    }
  };

  return (
    <div>
      <PageHeader
        title="Events"
        description="Alumni meets, workshops, webinars and career sessions."
        actions={
          canCreate ? (
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4" /> Create event
            </Button>
          ) : undefined
        }
      />

      <Tabs
        value={tab}
        onValueChange={setTab}
        className="mb-4 flex-wrap"
        items={[
          { value: 'upcoming', label: 'Upcoming' },
          { value: 'past', label: 'Past' },
          { value: 'registered', label: 'Registered', badge: registered.length },
        ]}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events…"
            className="pl-9"
            aria-label="Search events"
          />
        </div>
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Filter by event type"
          className="sm:w-56"
        >
          <option value="">All event types</option>
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <ListSkeleton count={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={tab === 'registered' ? 'No registrations yet' : 'No events found'}
          description={
            tab === 'registered'
              ? 'Events you register for will appear here.'
              : 'Try a different search or filter.'
          }
          action={
            canCreate && tab === 'upcoming' ? (
              <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
                <Plus className="h-4 w-4" /> Create event
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              me={user}
              registered={registered.includes(e.id)}
              registrationCount={counts[e.id] ?? 0}
              onRegister={register}
              onUnregister={unregister}
              onDelete={remove}
            />
          ))}
        </div>
      )}

      <EventFormModal open={formOpen} onClose={() => setFormOpen(false)} event={editing} />
    </div>
  );
}