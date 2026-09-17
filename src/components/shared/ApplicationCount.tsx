import { useEffect, useMemo, useRef, useState } from 'react';
import { listenJobApplications } from '@/services/jobs';

/**
 * Live applicant counts for a set of job ids (typically the current user's own posts).
 */
export function useApplicationCounts(jobIds: string[]) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const unsubsRef = useRef<Record<string, () => void>>({});
  const key = useMemo(() => Array.from(new Set(jobIds.filter(Boolean))).sort().join(','), [jobIds]);

  useEffect(() => {
    const ids = key ? key.split(',') : [];
    ids.forEach((id) => {
      if (unsubsRef.current[id]) return;
      unsubsRef.current[id] = listenJobApplications(id, (count) => {
        setCounts((prev) => ({ ...prev, [id]: count }));
      });
    });
    return () => {
      // keep listeners across re-renders; cleanup only on unmount
    };
  }, [key]);

  useEffect(() => {
    return () => {
      Object.values(unsubsRef.current).forEach((u) => u());
      unsubsRef.current = {};
    };
  }, []);

  return counts;
}