import { getDownloadURL, ref, uploadBytesResumable, type UploadTask } from 'firebase/storage';
import { storage } from '@/firebase/firebase';
import { fileExtension } from '@/lib/utils';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_DOC_SIZE = 15 * 1024 * 1024; // 15 MB

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp'];
const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'application/rtf',
];
const ALLOWED_DOC_EXT = ['pdf', 'doc', 'docx', 'txt', 'md', 'rtf'];

function isDangerous(name: string, type: string): boolean {
  const ext = fileExtension(name);
  const dangerousExt = [
    'exe', 'bat', 'cmd', 'com', 'msi', 'sh', 'js', 'jse', 'vbs', 'ps1', 'apk',
    'jar', 'dll', 'scr', 'pif', 'lnk', 'html', 'htm', 'svg',
  ];
  const dangerousTypes = [
    'application/x-msdownload',
    'application/x-msdos-program',
    'application/javascript',
    'text/html',
    'application/x-httpd-php',
    'application/x-sh',
  ];
  return (
    dangerousExt.includes(ext) ||
    dangerousTypes.includes(type) ||
    type.includes('executable') ||
    type.includes('shell')
  );
}

export function validateFile(file: File, kind: 'image' | 'document'): void {
  if (isDangerous(file.name, file.type)) {
    throw new Error('This file type is not allowed for security reasons.');
  }

  if (kind === 'image') {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type) && !ALLOWED_IMAGE_EXT.includes(fileExtension(file.name))) {
      throw new Error('Only JPG, PNG or WebP images are allowed.');
    }
    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error('Image is too large. Maximum size is 10 MB.');
    }
    return;
  }

  if (!ALLOWED_DOC_TYPES.includes(file.type) && !ALLOWED_DOC_EXT.includes(fileExtension(file.name))) {
    throw new Error('Only PDF, DOC, DOCX, TXT or RTF documents are allowed.');
  }
  if (file.size > MAX_DOC_SIZE) {
    throw new Error('Document is too large. Maximum size is 15 MB.');
  }
}

export type UploadProgress = (percent: number) => void;

function uploadFile(
  path: string,
  file: File,
  onProgress?: UploadProgress,
): Promise<string> {
  const storageRef = ref(storage, path);
  const task: UploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snap) => {
        const percent = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        onProgress?.(percent);
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      },
    );
  });
}

export async function uploadProfilePhoto(
  uid: string,
  file: File,
  onProgress?: UploadProgress,
): Promise<string> {
  validateFile(file, 'image');
  const ext = fileExtension(file.name) || 'png';
  const path = `users/${uid}/profile/photo_${Date.now()}.${ext}`;
  return uploadFile(path, file, onProgress);
}

export async function uploadChatAttachment(
  conversationId: string,
  uid: string,
  kind: 'image' | 'document',
  file: File,
  onProgress?: UploadProgress,
): Promise<{ url: string; name: string; size: number; mimeType: string }> {
  validateFile(file, kind);
  const ext = fileExtension(file.name) || (kind === 'image' ? 'png' : 'pdf');
  const path = `chat/${conversationId}/${uid}/${Date.now()}_${file.name.replace(/[^\w.\- ]/g, '_')}`;
  const url = await uploadFile(path, file, onProgress);
  return { url, name: file.name, size: file.size, mimeType: file.type || `application/${ext}` };
}

export async function uploadPostImage(
  uid: string,
  file: File,
  onProgress?: UploadProgress,
): Promise<string> {
  validateFile(file, 'image');
  const ext = fileExtension(file.name) || 'png';
  const path = `posts/${uid}/${Date.now()}.${ext}`;
  return uploadFile(path, file, onProgress);
}