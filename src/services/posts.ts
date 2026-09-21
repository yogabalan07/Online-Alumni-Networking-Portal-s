import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import type { Post, PostComment, PostSuggestion, PostType, PostLink, UserRole } from '@/types';
import { createNotification } from './notifications';

const POST_PAGE_SIZE = 20;

export interface PostInput {
  content: string;
  postType: PostType;
  images?: string[];
  links?: PostLink[];
  projectTitle?: string;
  projectDescription?: string;
  projectSkills?: string[];
}

export async function createPost(
  input: PostInput,
  authorId: string,
  authorRole: UserRole,
  authorName: string,
  authorPhoto?: string,
): Promise<string> {
  const ref = await addDoc(collection(db, 'posts'), {
    authorId,
    authorRole,
    authorName,
    authorPhoto: authorPhoto ?? null,
    content: input.content,
    postType: input.postType,
    images: input.images ?? [],
    links: input.links ?? [],
    projectTitle: input.projectTitle ?? null,
    projectDescription: input.projectDescription ?? null,
    projectSkills: input.projectSkills ?? [],
    likeCount: 0,
    commentCount: 0,
    suggestionCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePost(postId: string, patch: Partial<Pick<Post, 'content' | 'images' | 'links' | 'postType'>>): Promise<void> {
  await updateDoc(doc(db, 'posts', postId), { ...patch, updatedAt: serverTimestamp() });
}

export async function deletePost(postId: string): Promise<void> {
  await deleteDoc(doc(db, 'posts', postId));
}

export function listenPosts(
  cb: (posts: Post[]) => void,
  pageSize = POST_PAGE_SIZE,
  filterRole?: UserRole,
): () => void {
  const constraints: Parameters<typeof query>[1][] = [orderBy('createdAt', 'desc'), limit(pageSize)];
  if (filterRole) constraints.unshift(where('authorRole', '==', filterRole));
  const q = query(collection(db, 'posts'), ...constraints);
  return onSnapshot(q, (snap) => {
    const list: Post[] = [];
    snap.forEach((s) => list.push({ id: s.id, ...s.data() } as Post));
    cb(list);
  });
}

export async function loadMorePosts(
  lastDoc: QueryDocumentSnapshot,
  pageSize = POST_PAGE_SIZE,
  filterRole?: UserRole,
): Promise<{ items: Post[]; nextCursor: QueryDocumentSnapshot | null }> {
  const constraints: Parameters<typeof query>[1][] = [
    orderBy('createdAt', 'desc'),
    startAfter(lastDoc),
    limit(pageSize),
  ];
  if (filterRole) constraints.unshift(where('authorRole', '==', filterRole));
  const q = query(collection(db, 'posts'), ...constraints);
  const snap = await getDocs(q);
  const items: Post[] = [];
  snap.forEach((s) => items.push({ id: s.id, ...s.data() } as Post));
  return { items, nextCursor: snap.docs.length === pageSize ? snap.docs[snap.docs.length - 1] : null };
}

export async function getPost(postId: string): Promise<Post | null> {
  const snap = await getDoc(doc(db, 'posts', postId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Post) : null;
}

// ==================== LIKES ====================

export async function toggleLike(postId: string, userId: string): Promise<boolean> {
  const likeRef = doc(db, 'posts', postId, 'likes', userId);
  const likeSnap = await getDoc(likeRef);
  const liked = likeSnap.exists();

  await runTransaction(db, async (tx) => {
    const postRef = doc(db, 'posts', postId);
    if (liked) {
      tx.delete(likeRef);
      tx.update(postRef, { likeCount: increment(-1) });
    } else {
      tx.set(likeRef, { userId, createdAt: serverTimestamp() });
      tx.update(postRef, { likeCount: increment(1) });
    }
  });

  return !liked;
}

export async function hasUserLiked(postId: string, userId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'posts', postId, 'likes', userId));
  return snap.exists();
}

export function listenLikeStatus(
  postId: string,
  userId: string,
  cb: (liked: boolean) => void,
): () => void {
  const ref = doc(db, 'posts', postId, 'likes', userId);
  return onSnapshot(ref, (snap) => cb(snap.exists()));
}

// ==================== COMMENTS ====================

export async function addComment(
  postId: string,
  userId: string,
  userName: string,
  userPhoto: string | undefined,
  userRole: UserRole,
  text: string,
): Promise<string> {
  const ref = await addDoc(collection(db, 'posts', postId, 'comments'), {
    postId,
    userId,
    userName,
    userPhoto: userPhoto ?? null,
    userRole,
    text,
    createdAt: serverTimestamp(),
    updatedAt: null,
  });

  await updateDoc(doc(db, 'posts', postId), { commentCount: increment(1) });

  // Notify post author
  const post = await getPost(postId);
  if (post && post.authorId !== userId) {
    await createNotification({
      recipientId: post.authorId,
      type: 'post_comment',
      title: 'New comment on your post',
      message: `${userName} commented on your post.`,
      relatedId: postId,
      relatedUserId: userId,
    });
  }

  return ref.id;
}

export async function updateComment(postId: string, commentId: string, text: string): Promise<void> {
  await updateDoc(doc(db, 'posts', postId, 'comments', commentId), {
    text,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteComment(postId: string, commentId: string): Promise<void> {
  await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
  await updateDoc(doc(db, 'posts', postId), { commentCount: increment(-1) });
}

export function listenComments(
  postId: string,
  cb: (comments: PostComment[]) => void,
): () => void {
  const q = query(
    collection(db, 'posts', postId, 'comments'),
    orderBy('createdAt', 'asc'),
  );
  return onSnapshot(q, (snap) => {
    const list: PostComment[] = [];
    snap.forEach((s) => list.push({ id: s.id, ...s.data() } as PostComment));
    cb(list);
  });
}

// ==================== SUGGESTIONS ====================

export async function addSuggestion(
  postId: string,
  userId: string,
  userName: string,
  userPhoto: string | undefined,
  userRole: UserRole,
  text: string,
): Promise<string> {
  const ref = await addDoc(collection(db, 'posts', postId, 'suggestions'), {
    postId,
    userId,
    userName,
    userPhoto: userPhoto ?? null,
    userRole,
    text,
    createdAt: serverTimestamp(),
    updatedAt: null,
  });

  await updateDoc(doc(db, 'posts', postId), { suggestionCount: increment(1) });

  const post = await getPost(postId);
  if (post && post.authorId !== userId) {
    await createNotification({
      recipientId: post.authorId,
      type: 'post_suggestion',
      title: 'New suggestion on your post',
      message: `${userName} suggested: "${text.slice(0, 60)}${text.length > 60 ? '…' : ''}"`,
      relatedId: postId,
      relatedUserId: userId,
    });
  }

  return ref.id;
}

export async function deleteSuggestion(postId: string, suggestionId: string): Promise<void> {
  await deleteDoc(doc(db, 'posts', postId, 'suggestions', suggestionId));
  await updateDoc(doc(db, 'posts', postId), { suggestionCount: increment(-1) });
}

export function listenSuggestions(
  postId: string,
  cb: (suggestions: PostSuggestion[]) => void,
): () => void {
  const q = query(
    collection(db, 'posts', postId, 'suggestions'),
    orderBy('createdAt', 'asc'),
  );
  return onSnapshot(q, (snap) => {
    const list: PostSuggestion[] = [];
    snap.forEach((s) => list.push({ id: s.id, ...s.data() } as PostSuggestion));
    cb(list);
  });
}
