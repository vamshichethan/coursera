# Coursera Clone

A responsive Coursera-style learning platform built with Next.js. The project includes course browsing, course detail pages, progress features, offline course access, reminders, streak tracking, and video resume support.

## Live Demo

https://coursera-clone-main-three.vercel.app

## Features

- Search and filter courses by title, description, and category tags.
- Course completion celebration with animated confetti.
- Offline mode for downloaded course text content and images using IndexedDB.
- Daily learning streak tracking with milestone badges.
- Course reminder notifications for unfinished courses.
- Auto-resume video playback using saved video timestamps.
- Responsive layout for desktop, tablet, and mobile screens.

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- LocalStorage
- IndexedDB
- Browser Notification API
- Service Worker

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open the app in the browser:

```text
http://localhost:3000
```

Build for production:

```bash
npm run build
```

## Internship Tasks Implemented

1. Search and Filter Courses with Tags
2. Animated Course Completion Confetti
3. Offline Mode for Course Content
4. Streak Tracking for Daily Learning
5. Course Reminder Notification System
6. Auto-Resume Video Playback

## Notes

- This is a frontend-only project.
- Course reminders work while the browser/app is open or when the app is reopened after the reminder time.
- Videos are not stored for offline mode; only text-based content and images are saved.
