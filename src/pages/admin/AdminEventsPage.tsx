import { useEffect, useState } from 'react';
import { CalendarDays, Search } from 'lucide-react';
import type { EventItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { deleteEvent, listenEvents } from '@/services/events';
import { EventCard } from '@/components/shared/EventCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { ListSkeleton } from '@/components/ui/skeleton';
import { getErrorMessage, tsNum } from '@/lib/utils';
import { EVENT_TYPES } from '@/lib/constants';

export default function AdminEventsPage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    const unsub = listenEvents((list) => {
      setEvents(list);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (!user) return null;

  const now = Date.now();
  const filtered = events.filter((e) => {
    const isUpcoming = tsNum(e.date) >= now;
    if (tab === 'upcoming' && !isUpcoming) return false;
    if (tab === 'past' && isUpcoming) return false;
    if (typeFilter && e.eventType !== typeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const haystack = `${e.title} ${e.venue} ${e.description} ${e.eventType ?? ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

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
        title="Event Management"
        description="Manage all platform events."
      />

      <Tabs
        value={tab}
        onValueChange={setTab}
        className="mb-4 flex-wrap"
        items={[
          { value: 'all', label: 'All' },
          { value: 'upcoming', label: 'Upcoming' },
          { value: 'past', label: 'Past' },
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
          title="No events found"
          description="Try a different search or filter."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              me={user}
              onDelete={remove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
