# Alumni Networking Portal

A production-ready college alumni networking platform built with React, TypeScript, Vite, Tailwind CSS, and Firebase.

## Features

- **Authentication** — Email/password registration, login, logout, forgot password, auth state persistence
- **Role-Based Access** — Student, Alumni, Admin roles with Firestore Security Rules enforcement
- **Alumni Directory** — Search and filter alumni by name, department, graduation year, company, job role, skills, location
- **Connection System** — Send, accept, reject, remove, block connections with duplicate prevention
- **Real-Time Chat** — WhatsApp-like messaging with text, image, and document sharing via Firestore `onSnapshot()`
- **Read Receipts** — Sent, delivered, and read status with timestamps
- **Typing Indicator** — Lightweight presence via Firebase Realtime Database
- **Online/Offline Status** — Real-time presence with last seen tracking
- **File Sharing** — Image and document uploads to Firebase Storage with validation
- **Mentorship** — Students request mentorship from alumni; accept/reject/complete workflow
- **Jobs & Internships** — Alumni post opportunities; students search, filter, and apply
- **Events** — Create, register, unregister for alumni events with duplicate prevention
- **Notifications** — Real-time notifications for connections, messages, mentorship, jobs, events
- **Admin Dashboard** — Platform stats, user management, alumni verification, job/event management, reports
- **Report System** — Users can report content; admins review and update status
- **Responsive Design** — Desktop sidebar + mobile bottom navigation
- **Profile System** — Editable profiles with image upload

## Tech Stack

- React 18 + TypeScript
- Vite 5
- Tailwind CSS 3
- Custom UI components (shadcn-style)
- Lucide React icons
- Firebase Web SDK 10

## Firebase Services

- Firebase Authentication (email/password)
- Cloud Firestore (real-time database)
- Firebase Storage (file uploads)
- Firebase Hosting (deployment)
- Firebase Realtime Database (optional, for typing indicators & presence)

## Architecture

```
React SPA
├── Firebase Authentication
├── Cloud Firestore
│   ├── users/
│   ├── connections/
│   ├── conversations/
│   │   └── messages/
│   ├── jobs/
│   ├── jobApplications/
│   ├── events/
│   ├── eventRegistrations/
│   ├── mentorshipRequests/
│   ├── notifications/
│   ├── reports/
│   └── stats/
├── Firebase Storage
│   ├── users/{uid}/profile/
│   └── chat/{conversationId}/{uid}/
└── Firebase Hosting
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your Firebase project configuration:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_DATABASE_URL=  (optional, for typing indicators)
```

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Preview

```bash
npm run preview
```

## Lint

```bash
npm run lint
```

## Type Check

```bash
npm run typecheck
```

## Firebase CLI Setup

```bash
npm install -g firebase-tools
firebase login
firebase use <project-id>
```

## Deployment

```bash
# Build
npm run build

# Deploy everything
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy Firestore rules and indexes
firebase deploy --only firestore:rules,firestore:indexes

# Deploy Storage rules
firebase deploy --only storage
```

## Firebase Console Setup (Required Manual Steps)

1. **Enable Authentication**: Firebase Console → Authentication → Get Started → Enable Email/Password provider
2. **Initialize Storage**: Firebase Console → Storage → Get Started → Select default bucket
3. **Initialize Firestore**: Firebase Console → Firestore Database → Create Database (done automatically by CLI)

## Admin Setup

Admin accounts cannot be created publicly. To create the first admin:

1. Register a normal account through the app
2. Go to Firebase Console → Firestore Database → Find the user document
3. Manually change the `role` field from `"student"` or `"alumni"` to `"admin"`
4. The user must log out and log back in for the role change to take effect

**Security Rules prevent ordinary users from changing their own role to admin.**

## Firestore Collections

| Collection | Purpose |
|---|---|
| `users` | User profiles with role, department, skills, etc. |
| `connections` | Connection requests and accepted connections |
| `conversations` | Chat conversation metadata |
| `conversations/{id}/messages` | Individual chat messages |
| `jobs` | Job and internship postings |
| `jobApplications` | Student job applications |
| `events` | Alumni events |
| `eventRegistrations` | Event registrations |
| `mentorshipRequests` | Mentorship requests between students and alumni |
| `notifications` | User notifications |
| `reports` | Content reports |
| `stats` | Platform statistics |

## Storage Structure

```
users/{uid}/profile/photo_{timestamp}.{ext}
chat/{conversationId}/{uid}/{timestamp}_{filename}
```

## Security Rules Summary

- All access requires authentication
- Users can only modify their own profiles
- Users cannot escalate their own role to admin
- Conversations and messages are restricted to participants
- Job/event creation is restricted to alumni and admins
- Alumni verification requires admin privileges
- Reports are visible only to the reporter and admins
- File uploads validate type and size

## Troubleshooting

- **Build errors**: Run `npm run typecheck` to identify TypeScript issues
- **Firebase errors**: Ensure `.env` has correct values from your Firebase project
- **Permission denied**: Check Firestore Security Rules and ensure the user is authenticated
- **Storage errors**: Ensure Firebase Storage is initialized in the Firebase Console
- **Missing indexes**: Deploy indexes with `firebase deploy --only firestore:indexes`
