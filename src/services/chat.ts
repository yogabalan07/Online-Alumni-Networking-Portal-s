import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
  writeBatch,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db, getRTDB } from '@/firebase/firebase';
import type { ChatMessage, Conversation, MessageType } from '@/types';
import { ref, set, remove, onValue } from 'firebase/database';
import { incrementStat } from './stats';
import { tsNum } from '@/lib/utils';

export function getConversationId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('_');
}

export interface SendMessageAttachment {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

export async function sendMessage(
  convId: string,
  senderId: string,
  receiverId: string,
  content: string,
  type: MessageType,
  attachment?: SendMessageAttachment,
): Promise<string> {
  const messageRef = doc(collection(db, 'conversations', convId, 'messages'));
  await runTransaction(db, async (tx) => {
    const convRef = doc(db, 'conversations', convId);
    const convSnap = await tx.get(convRef);

    if (convSnap.exists()) {
      const data = convSnap.data();
      const unreadCounts = { ...(data.unreadCounts ?? {}) };
      unreadCounts[receiverId] = (unreadCounts[receiverId] ?? 0) + 1;
      tx.update(convRef, {
        lastMessage: type === 'text' ? content : attachment?.name || content,
        lastMessageType: type,
        lastMessageAt: serverTimestamp(),
        lastMessageSenderId: senderId,
        unreadCounts,
        updatedAt: serverTimestamp(),
      });
    } else {
      const [idA, idB] = [senderId, receiverId].sort();
      tx.set(convRef, {
        id: convId,
        participantIds: [idA, idB],
        lastMessage: type === 'text' ? content : attachment?.name || content,
        lastMessageType: type,
        lastMessageAt: serverTimestamp(),
        lastMessageSenderId: senderId,
        unreadCounts: { [senderId]: 0, [receiverId]: 1 },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    tx.set(messageRef, {
      id: messageRef.id,
      conversationId: convId,
      senderId,
      receiverId,
      content,
      type,
      attachmentUrl: attachment?.url ?? null,
      attachmentName: attachment?.name ?? null,
      attachmentSize: attachment?.size ?? null,
      attachmentMimeType: attachment?.mimeType ?? null,
      createdAt: serverTimestamp(),
      deliveredAt: null,
      readAt: null,
      deleted: false,
    });

    // Track message count for platform statistics.
    const statsRef = doc(db, 'stats', 'platform');
    const statsSnap = await tx.get(statsRef);
    const stats = statsSnap.exists() ? (statsSnap.data() as Record<string, number>) : {};
    tx.set(statsRef, { ...stats, messages: (stats.messages ?? 0) + 1 }, { merge: true });
  });

  return messageRef.id;
}

const MESSAGE_PAGE_SIZE = 50;

export function listenMessages(
  convId: string,
  cb: (messages: ChatMessage[]) => void,
  pageSize = MESSAGE_PAGE_SIZE,
): () => void {
  let lastCursor: QueryDocumentSnapshot | null = null;
  const q = query(
    collection(db, 'conversations', convId, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(pageSize),
  );
  return onSnapshot(q, (snap) => {
    const list: ChatMessage[] = [];
    snap.forEach((s) => list.push({ id: s.id, ...s.data() } as ChatMessage));
    list.sort((a, b) => tsNum(a.createdAt) - tsNum(b.createdAt));
    lastCursor = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;
    cb(list);
  });
}

export async function loadOlderMessages(
  convId: string,
  before: number,
  pageSize = MESSAGE_PAGE_SIZE,
): Promise<ChatMessage[]> {
  const q = query(
    collection(db, 'conversations', convId, 'messages'),
    orderBy('createdAt', 'desc'),
    startAfter(before),
    limit(pageSize),
  );
  const snap = await getDocs(q);
  const list: ChatMessage[] = [];
  snap.forEach((s) => list.push({ id: s.id, ...s.data() } as ChatMessage));
  return list;
}

export function listenConversations(
  uid: string,
  cb: (conversations: Conversation[]) => void,
): () => void {
  const q = query(
    collection(db, 'conversations'),
    where('participantIds', 'array-contains', uid),
    orderBy('updatedAt', 'desc'),
  );
  return onSnapshot(q, (snap) => {
    const list: Conversation[] = [];
    snap.forEach((s) => list.push({ id: s.id, ...s.data() } as Conversation));
    cb(list);
  });
}

export async function getConversation(convId: string): Promise<Conversation | null> {
  const snap = await getDoc(doc(db, 'conversations', convId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Conversation) : null;
}

export function getOtherParticipant(conv: Conversation, meUid: string): string | null {
  return conv.participantIds.find((id) => id !== meUid) ?? null;
}

export async function markConversationRead(
  convId: string,
  uid: string,
): Promise<void> {
  const convRef = doc(db, 'conversations', convId);
  const batch = writeBatch(db);

  try {
    const convSnap = await getDoc(convRef);
    if (convSnap.exists()) {
      const unreadCounts = { ...(convSnap.data().unreadCounts ?? {}) };
      unreadCounts[uid] = 0;
      batch.update(convRef, { unreadCounts });
    }
  } catch {
    // ignore read failures
  }

  const q = query(
    collection(db, 'conversations', convId, 'messages'),
    where('receiverId', '==', uid),
    where('readAt', '==', null),
    orderBy('createdAt', 'desc'),
    limit(50),
  );
  const snap = await getDocs(q);
  snap.forEach((s) => {
    const data = s.data();
    batch.update(s.ref, {
      ...(data.deliveredAt == null ? { deliveredAt: serverTimestamp() } : {}),
      readAt: serverTimestamp(),
    });
  });
  await batch.commit();
}

export async function markMessagesDelivered(
  convId: string,
  uid: string,
): Promise<void> {
  const q = query(
    collection(db, 'conversations', convId, 'messages'),
    where('receiverId', '==', uid),
    where('deliveredAt', '==', null),
    orderBy('createdAt', 'desc'),
    limit(20),
  );
  const snap = await getDocs(q);
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.forEach((s) => {
    batch.update(s.ref, { deliveredAt: serverTimestamp() });
  });
  await batch.commit();
}

export async function deleteMessage(
  convId: string,
  messageId: string,
  uid: string,
): Promise<void> {
  await updateDoc(doc(db, 'conversations', convId, 'messages', messageId), {
    deleted: true,
  });
}

export function conversationRef(convId: string) {
  return doc(db, 'conversations', convId);
}

// ---------- Typing indicator (RTDB, transient only) ----------

export function setTyping(convId: string, uid: string, isTyping: boolean): void {
  const rtdb = getRTDB();
  if (!rtdb) return;
  const refLike = ref(rtdb, `typing/${convId}/${uid}`);
  if (isTyping) {
    set(refLike, Date.now());
  } else {
    remove(refLike);
  }
}

export function listenTyping(
  convId: string,
  meUid: string,
  cb: (typingUids: string[]) => void,
): () => void {
  const rtdb = getRTDB();
  if (!rtdb) {
    cb([]);
    return () => undefined;
  }
  const refLike = ref(rtdb, `typing/${convId}`);
  return onValue(refLike, (snap) => {
    const obj = snap.val() as Record<string, number> | null;
    if (!obj) {
      cb([]);
      return;
    }
    const now = Date.now();
    const active = Object.keys(obj).filter(
      (uid) => uid !== meUid && now - (obj[uid] ?? 0) < 4000,
    );
    cb(active);
  });
}

export function clearTyping(convId: string, uid: string): void {
  const rtdb = getRTDB();
  if (!rtdb) return;
  remove(ref(rtdb, `typing/${convId}/${uid}`));
}