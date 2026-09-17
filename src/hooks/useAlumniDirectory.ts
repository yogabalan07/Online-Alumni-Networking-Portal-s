import { useCallback, useEffect, useRef, useState } from 'react';
import type { UserProfile } from '@/types';
import { searchAlumni, type AlumniFilters } from '@/services/users';

export function useAlumniDirectory(filters: AlumniFilters) {
  const [items, setItems] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<unknown>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const filterKey = JSON.stringify(filters);

  const run = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const page = await searchAlumni(filters);
      if (id !== requestId.current) return;
      setItems(page.items);
      setCursor(page.nextCursor);
      setHasMore(Boolean(page.nextCursor));
    } catch (e) {
      if (id !== requestId.current) return;
      setError('Unable to load alumni right now. Please try again.');
      setItems([]);
      setHasMore(false);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  useEffect(() => {
    void run();
  }, [run]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await searchAlumni(filters, cursor);
      setItems((prev) => {
        const ids = new Set(prev.map((u) => u.uid));
        return [...prev, ...page.items.filter((u) => !ids.has(u.uid))];
      });
      setCursor(page.nextCursor);
      setHasMore(Boolean(page.nextCursor));
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, filters, loadingMore]);

  return { items, loading, loadingMore, hasMore, loadMore, reload: run, error };
}