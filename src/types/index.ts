import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'student' | 'alumni' | 'admin';

export type ConnectionStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';

export type MessageType = 'text' | 'image' | 'document';

export type JobApplicationStatus = 'open' | 'closed';

export type JobType = 'job' | 'internship';

export type MentorshipStatus = 'pending' | 'accepted' | 'rejected' | 'completed';

export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

export type PostType =
  | 'general'
  | 'project'
  | 'achievement'
  | 'photo'
  | 'question'
  | 'career'
  | 'job'
  | 'internship'
  | 'advice';

export type NotificationType =
  | 'connection_request'
  | 'connection_accepted'
  | 'new_message'
  | 'mentorship_request'
  | 'mentorship_accepted'
  | 'new_job'
  | 'new_internship'
  | 'event'
  | 'admin'
  | 'post_like'
  | 'post_comment'
  | 'post_suggestion'
  | 'new_follower';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  profileImageUrl?: string;
  department?: string;
  batch?: string;
  rollNumber?: string;
  graduationYear?: string;
  company?: string;
  jobRole?: string;
  skills?: string[];
  location?: string;
  bio?: string;
  linkedIn?: string;
  isOnline?: boolean;
  lastSeen?: number;
  verified?: boolean;
  isActive: boolean;
  createdAt?: number;
  updatedAt?: number;
  description?: string;
}

export interface Connection {
  id: string;
  requesterId: string;
  recipientId: string;
  participantIds: string[];
  status: ConnectionStatus;
  createdAt: number;
  updatedAt: number;
  requester?: UserProfile;
  recipient?: UserProfile;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  lastMessage?: string;
  lastMessageType?: MessageType;
  lastMessageAt?: number;
  lastMessageSenderId?: string;
  lastMessageSenderName?: string;
  unreadCounts: Record<string, number>;
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: MessageType;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  attachmentMimeType?: string;
  createdAt: number;
  deliveredAt?: number | null;
  readAt?: number | null;
  deleted?: boolean;
  pending?: boolean;
  error?: boolean;
}

export interface Job {
  id: string;
  type: JobType;
  title: string;
  company: string;
  description: string;
  location: string;
  employmentType?: string;
  skills: string[];
  eligibility?: string;
  applicationUrl?: string;
  deadline?: number;
  postedBy: string;
  postedByProfile?: UserProfile;
  createdAt: number;
  updatedAt: number;
  status: JobApplicationStatus;
  applicationsCount?: number;
}

export interface JobApplication {
  id: string;
  jobId: string;
  studentId: string;
  student?: UserProfile;
  createdAt: number;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  date: number;
  time: string;
  venue: string;
  organizerId: string;
  organizer?: UserProfile;
  registrationDeadline?: number;
  createdAt: number;
  registrationCount?: number;
  eventType?: string;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  user?: UserProfile;
  createdAt: number;
}

export interface MentorshipRequest {
  id: string;
  studentId: string;
  alumniId: string;
  topic: string;
  message?: string;
  status: MentorshipStatus;
  createdAt: number;
  updatedAt: number;
  student?: UserProfile;
  alumni?: UserProfile;
}

export interface NotificationItem {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  relatedUserId?: string;
  read: boolean;
  createdAt: number;
}

export interface Report {
  id: string;
  reporterId: string;
  targetType: 'user' | 'message' | 'job' | 'event';
  targetId: string;
  reason: string;
  description?: string;
  status: ReportStatus;
  createdAt: number;
  updatedAt: number;
  reporter?: UserProfile;
}

export interface PresenceState {
  state: string;
  lastChanged?: number;
}

export interface Post {
  id: string;
  authorId: string;
  authorRole: UserRole;
  authorName: string;
  authorPhoto?: string;
  content: string;
  postType: PostType;
  images: string[];
  links: PostLink[];
  projectTitle?: string;
  projectDescription?: string;
  projectSkills?: string[];
  createdAt: number;
  updatedAt: number;
  likeCount: number;
  commentCount: number;
  suggestionCount: number;
}

export interface PostLink {
  url: string;
  label?: string;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  userRole: UserRole;
  text: string;
  createdAt: number;
  updatedAt?: number;
}

export interface PostSuggestion {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  userRole: UserRole;
  text: string;
  createdAt: number;
  updatedAt?: number;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: number;
}