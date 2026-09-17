import { onDisconnect, onValue, ref, serverTimestamp as rtdbTimestamp, set } from 'firebase/database';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, getRTDB } from '@/firebase/firebase';
import type { PresenceState } from '@/types';
import { watchUser } from './users';

let initialized = false;

/**
 * Initializes presence for the current user.
 *
 * Strategy:
 *  - Prefer Firebase Realtime Database for transient presence (`.info/connected`
 *    + onDisconnect) — no Firestore writes on every UI event.
 *  - Mirror the final online/offline state to the Firestore `users/{uid}` doc so
 *    profile cards can show online status / last seen cheaply. Writes happen only
 *    on connection transitions, never on keystrokes or scroll events.
 */
export function initPresence(uid: string): void {
  if (!uid || initialized) return;

  const rtdb = getRTDB();
  const firestoreMirror = (online: boolean) => {
    updateDoc(doc(db, 'users', uid), {
      isOnline: online,
      lastSeen: serverTimestamp(),
    }).catch(() => undefined);
  };

  if (rtdb) {
    const connectedRef = ref(rtdb, '.info/connected');
    onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        // We're online — announce it and make sure it flips off on disconnect.
        const presenceRef = ref(rtdb, `presence/${uid}`);
        const offlinePayload = { state: 'offline', presenceConnection: false };
        onDisconnect(presenceRef)
          .set(offlinePayload)
          .then(() => {
            set(presenceRef, { state: 'online', lastChanged: rtdbTimestamp() });
          })
          .catch(() => undefined);
        firestoreMirror(true);
      } else {
        // Connection lost (or the page went offline). Mark offline.
        set(ref(rtdb, `presence/${uid}`), {
          state: 'offline',
          lastSeen: rtdbTimestamp(),
        }).catch(() => undefined);
        firestoreMirror(false);
      }
    });
  } else {
    // Fallback: no RTDB configured — use Firestore-only presence via connection
    // tracking with a heartbeat so "last seen" stays fresh.
    firestoreMirror(true);
    const heartbeat = window.setInterval(() => {
      updateDoc(doc(db, 'users', uid), { lastSeen: serverTimestamp() }).catch(() => undefined);
    }, 60_000);
    window.addEventListener('beforeunload', () => {
      updateDoc(doc(db, 'users', uid), { isOnline: false, lastSeen: serverTimestamp() }).catch(
        () => undefined,
      );
      window.clearInterval(heartbeat);
    });
  }

  initialized = true;
}

export async function setOfflineNow(uid: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      isOnline: false,
      lastSeen: serverTimestamp(),
    });
  } catch {
    // best effort
  }
  const rtdb = getRTDB();
  if (rtdb) {
    try {
      await set(ref(rtdb, `presence/${uid}`), { state: 'offline', lastSeen: rtdbTimestamp() });
    } catch {
      // best effort
    }
  }
}

/**
 * Subscribes to another user's presence. Uses RTDB when available, otherwise
 * falls back to the Firestore user document fields.
 */
export function listenPresence(
  uid: string,
  cb: (state: PresenceState | null) => void,
): () => void {
  const rtdb = getRTDB();
  if (rtdb) {
    try {
      const presenceRef = ref(rtdb, `presence/${uid}`);
      const unsub = onValue(
        presenceRef,
        (snap) => {
          const val = snap.val();
          if (!val) {
            cb(null);
            return;
          }
          cb({
            state: val.state ?? 'offline',
            lastChanged:
              typeof val.lastChanged === 'number'
                ? val.lastChanged
                : val.lastChanged?.seconds
                  ? val.lastChanged.seconds * 1000
                  : undefined,
          });
        },
        () => cb(null),
      );
      return unsub;
    } catch {
      // fall through to Firestore
    }
  }

  let unsubUser: (() => void) | null = null;
  watchUser(uid, (u) => {
    if (!u) {
      cb(null);
      return;
    }
    if (!unsubUser) {
      // keep the firestore fallback listener alive
    }
    cb({
      state: u.isOnline ? 'online' : 'offline',
      lastChanged:
        typeof u.lastSeen === 'number'
          ? u.lastSeen
          : (u.lastSeen as unknown as { seconds?: number })?.seconds
            ? (u.lastSeen as unknown as { seconds: number }).seconds * 1000
            : undefined,
    });
  }).then((unsub) => {
    unsubUser = unsub;
  });

  return () => {
    unsubUser?.();
  };
}