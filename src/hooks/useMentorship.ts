import { useEffect, useMemo, useState } from 'react';
import type { MentorshipRequest } from '@/types';
import { listenMentorshipRequests } from '@/services/mentorship';

export function useMentorship(uid: string | undefined) {
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = listenMentorshipRequests(uid, (list) => {
      setRequests(list);
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  const pending = useMemo(() => requests.filter((r) => r.status === 'pending'), [requests]);
  const active = useMemo(() => requests.filter((r) => r.status === 'accepted'), [requests]);

  return { requests, pending, active, loading };
}