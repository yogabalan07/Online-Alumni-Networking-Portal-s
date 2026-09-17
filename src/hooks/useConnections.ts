import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Connection } from '@/types';
import { listenConnections } from '@/services/connections';

export function useConnections(uid: string | undefined) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setConnections([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = listenConnections(uid, (list) => {
      setConnections(list);
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  const byOther = useMemo(() => {
    const map = new Map<string, Connection>();
    if (!uid) return map;
    connections.forEach((c) => {
      const other = c.participantIds?.find((id) => id !== uid) ??
        (c.requesterId === uid ? c.recipientId : c.requesterId);
      if (other) map.set(other, c);
    });
    return map;
  }, [connections, uid]);

  const incomingPending = useMemo(
    () => (uid ? connections.filter((c) => c.recipientId === uid && c.status === 'pending') : []),
    [connections, uid],
  );
  const outgoingPending = useMemo(
    () => (uid ? connections.filter((c) => c.requesterId === uid && c.status === 'pending') : []),
    [connections, uid],
  );
  const accepted = useMemo(
    () => (uid ? connections.filter((c) => c.status === 'accepted') : []),
    [connections, uid],
  );

  const connectedIds = useMemo(
    () => new Set(accepted.map((c) => c.participantIds?.find((id) => id !== uid) ?? '')),
    [accepted, uid],
  );

  const isConnected = useCallback((otherUid: string) => connectedIds.has(otherUid), [connectedIds]);

  return {
    connections,
    byOther,
    incomingPending,
    outgoingPending,
    accepted,
    connectedIds,
    isConnected,
    loading,
  };
}