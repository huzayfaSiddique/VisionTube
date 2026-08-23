# VisionTube

A full-stack YouTube clone built with the MERN stack — upload and stream videos, subscribe to channels, build playlists, like and comment, and manage your own channel from a Studio dashboard.

<p>
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white">
  <img alt="Express" src="https://img.shields.io/badge/Express-000000?logo=express&logoColor=white">
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white">
  <img alt="TailwindCSS" src="https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss&logoColor=white">
  <img alt="Redis" src="https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white">
  <img alt="BullMQ" src="https://img.shields.io/badge/BullMQ-queue-orange">
  <img alt="Docker" src="https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white">
</p>

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Redis (Docker)](#redis-docker)
  - [Backend setup](#backend-setup)
  - [Frontend setup](#frontend-setup)
- [Environment variables](#environment-variables)
- [API reference](#api-reference)
- [Data models](#data-models)
- [Known issues / roadmap](#known-issues--roadmap)
- [License](#license)

---

## Overview

VisionTube is a video-sharing platform inspired by YouTube. It's split into two independent apps:

- **`backend/`** — a REST API (Express + MongoDB) handling auth, video/thumbnail storage (via Cloudinary), playlists, subscriptions, likes, comments, and a background email queue.
- **`frontend/`** — a React (Vite) single-page app that consumes that API, styled with Tailwind CSS and using React Query for server-state management.

Authentication uses JWT access/refresh tokens delivered as httpOnly cookies, with automatic silent token refresh baked into the frontend's Axios client. New accounts go through an **email verification** step powered by a **BullMQ job queue backed by Redis**, with a Nodemailer fallback for development environments where Redis is unavailable.

## Features

**Auth & account**
- Register / login / logout with hashed passwords (bcrypt) and JWT access + refresh tokens (httpOnly cookies)
- Silent access-token refresh on 401s, with request queuing so concurrent calls don't each trigger their own refresh
- **Email verification on registration** — a confirmation link is emailed immediately after sign-up (24-hour expiry)
- **Resend verification email** with a 30-second rate-limit cooldown to prevent spam
- Update account details (name, email) and password
- Update avatar and cover image, with automatic cleanup of the old Cloudinary asset

**Video**
- Upload videos with a thumbnail (Cloudinary storage), with upload progress
- Browse, search (title/description/owner), sort, and paginate videos
- Publish / unpublish (draft) videos
- Edit title, description, and thumbnail; delete a video (cascades to its comments, likes, playlist references, and watch-history entries)
- Watch history, automatically recorded on view, with per-entry delete and clear-all
- Per-video view counter

**Social**
- Subscribe / unsubscribe to channels, with subscriber and subscription counts
- Like/unlike videos, comments, and tweets
- Comment on videos (create, edit, delete)
- Post, edit, and delete short text tweets from your own channel; like/unlike others' tweets
- Public channel pages with Videos, Playlists, and Tweets tabs (private playlists are hidden from non-owners)
- **Feed of latest tweets from subscribed channels** (past 24 hours)

**Playlists**
- Create, rename, describe, and delete playlists
- Add/remove videos to/from a playlist
- Toggle a playlist between public and private

**Studio**
- Dashboard of your own videos (published and draft), with inline editing, publish toggling, and deletion

**Tweets**
- Post short (280-char) text-only tweets from your own channel page
- Edit or delete your own tweets
- Like/unlike any tweet, with a live like count

**Background email queue**
- BullMQ job queue (Redis-backed) for reliable, async email delivery with exponential-backoff retries (up to 3 attempts: 5 s → 10 s → 20 s)
- Graceful degradation: if Redis is unavailable, emails are dispatched directly via `setImmediate` so registration is never blocked
- Nodemailer integration: uses your SMTP server in production, auto-creates an Ethereal test account in development
- Branded HTML confirmation emails with a one-click verification button

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router, Tailwind CSS 4, React Query (TanStack), React Hook Form, Axios, lucide-react |
| Backend | Node.js, Express 5, MongoDB, Mongoose (+ `mongoose-aggregate-paginate-v2`) |
| Auth | JWT (access + refresh tokens), bcrypt, httpOnly cookies |
| Media storage | Cloudinary (via Multer for temporary local upload handling) |
| Email | Nodemailer (SMTP / Ethereal fallback) |
| Job queue | BullMQ + Redis 7 (`ioredis`) |
| Infrastructure | Docker Compose (Redis service) |

## Project structure

```
VisionTube/
├── docker-compose.yml        # Redis service for the BullMQ email queue
├── backend/
│   ├── src/
│   │   ├── config/           # Redis connection config (redis.js)
│   │   ├── controllers/      # Route handlers (business logic)
│   │   ├── routes/           # Express routers, one per resource
│   │   ├── models/           # Mongoose schemas
│   │   ├── middlewares/      # auth (JWT verify), multer (uploads)
│   │   ├── queues/           # BullMQ email queue (email.queue.js)
│   │   ├── workers/          # BullMQ email worker (email.worker.js)
│   │   ├── utils/            # ApiError, ApiResponse, asyncHandler, cloudinary helpers, sendEmail
│   │   ├── db/               # MongoDB connection
│   │   ├── app.js            # Express app + route mounting + global error handler
│   │   └── index.js          # Entry point — connects DB, starts worker, starts server
│   └── public/temp/          # Scratch space Multer writes to before Cloudinary upload
└── frontend/
    └── src/
        ├── api/              # Axios calls, one module per resource
        ├── components/       # UI, grouped by feature (video, playlist, channel, studio, comment, layout)
        ├── context/          # AuthContext (current user, login/register/logout)
        ├── pages/            # Route-level views
        ├── lib/              # Formatters and other small helpers
        └── App.jsx           # Route tree
```

## Getting started

### Prerequisites

- Node.js 18+
- A MongoDB database (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- A [Cloudinary](https://cloudinary.com/) account (for video/image storage)
- Docker & Docker Compose (for the Redis email queue — optional, see below)

### Redis (Docker)

The email queue requires a running Redis instance. Start one with Docker Compose:

```bash
docker compose up -d
```

This starts `visiontube-redis` on `localhost:6379` with persistence enabled. If Redis is not running, the backend automatically falls back to direct async email dispatch — so the app still works during development without Docker.

### Backend setup

```bash
cd backend
npm install
cp .env.example .env   # then fill in your own values
npm run dev
```

The API runs on `http://localhost:8000` by default, mounted under `/api/v1`.

### Frontend setup

```bash
cd frontend
npm install
cp .env.example .env   # defaults already point at the local backend
npm run dev
```

The app runs on `http://localhost:5173` by default (Vite's default port).

> Run both servers (and Redis via Docker) concurrently during development.

## Environment variables

**`backend/.env`**

| Variable | Description |
|---|---|
| `PORT` | Port the API server listens on (default `8000`) |
| `SERVER_URL` | Public URL of the backend, used to build email verification links (e.g. `http://localhost:8000`) |
| `MONGODB_URI` | MongoDB connection string (without the database name) |
| `CORS_ORIGIN` | Origin allowed to make credentialed requests (your frontend URL) |
| `ACCESS_TOKEN_SECRET` | Secret used to sign JWT access tokens |
| `ACCESS_TOKEN_EXPIRY` | Access token lifetime, e.g. `2h` |
| `REFRESH_TOKEN_SECRET` | Secret used to sign JWT refresh tokens |
| `REFRESH_TOKEN_EXPIRY` | Refresh token lifetime, e.g. `8d` |
| `CLOUDNARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDNARY_API_KEY` | Cloudinary API key |
| `CLOUDNARY_API_SECRET` | Cloudinary API secret |
| `REDIS_HOST` | Redis host (default `127.0.0.1`) |
| `REDIS_PORT` | Redis port (default `6379`) |
| `REDIS_PASSWORD` | Redis password, if any (optional) |
| `SMTP_HOST` | SMTP server hostname (e.g. `smtp.gmail.com`) |
| `SMTP_PORT` | SMTP port (default `587`) |
| `SMTP_SECURE` | Set to `true` for port 465 TLS (optional) |
| `SMTP_USER` | SMTP username / email address |
| `SMTP_PASS` | SMTP password or app password |
| `SMTP_FROM` | Sender address, e.g. `"VisionTube" <no-reply@visiontube.com>` |

> If `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` are **not** set, the backend automatically uses an [Ethereal](https://ethereal.email/) test account and logs a preview URL to the console — no email setup needed for development.

**`frontend/.env`**

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API, e.g. `http://localhost:8000/api/v1` |

## API reference

All routes are prefixed with `/api/v1`. Routes marked 🔒 require a valid access token.

### Users (`/users`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Create an account (multipart: `avatar` required, `coverImage` optional); triggers verification email |
| GET | `/confirm-email?token=` | Verify email address via token from the confirmation email |
| POST | `/resend-confirmation` | Resend a verification email (30-second cooldown) |
| POST | `/login` | Log in, sets access/refresh token cookies |
| POST | `/logout` 🔒 | Log out, clears cookies |
| POST | `/refresh-token` | Exchange a valid refresh token for a new access token |
| GET | `/current-user` 🔒 | Get the logged-in user |
| PATCH | `/account-details` 🔒 | Update `fullName` / `email` |
| POST | `/change-password` 🔒 | Change password |
| PATCH | `/update-avatar` 🔒 | Update avatar (multipart: `avatar`) |
| PATCH | `/update-coverimage` 🔒 | Update cover image (multipart: `coverImage`) |
| DELETE | `/delete-coverimage` 🔒 | Remove cover image |
| GET | `/c/:username` 🔒 | Get a channel's public profile |
| GET | `/watched-history` 🔒 | Get the current user's watch history |
| DELETE | `/watched-history` 🔒 | Clear the current user's entire watch history |
| DELETE | `/watched-history/:videoId` 🔒 | Remove a single video from watch history |
| GET | `/subscribed-tweets` 🔒 | Latest tweets (past 24 h) from channels the current user is subscribed to |

### Videos (`/videos`) — all routes 🔒

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List videos (supports `page`, `limit`, `query`, `sortBy`, `sortType`, `userId`, `includeUnpublished`) |
| GET | `/:videoId` | Get a video by ID (increments views, records watch history) |
| POST | `/publish-video` | Upload a video (multipart: `videoFile`, `thumbnail`) |
| PATCH | `/update/:videoId` | Update title/description/thumbnail |
| DELETE | `/delete/:videoId` | Delete a video and its dependent data |
| PATCH | `/publish/:videoId` | Toggle published/draft status |

### Playlists (`/playlists`) — all routes 🔒

| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create a playlist |
| GET | `/:playlistId` | Get a playlist (with populated videos) |
| PATCH | `/update-playlist/:playlistId` | Update name/description |
| DELETE | `/delete-playlist/:playlistId` | Delete a playlist |
| GET | `/user/:userId` | List a user's playlists (private ones only visible to their owner) |
| POST | `/:videoId/:playlistId` | Add a video to a playlist |
| DELETE | `/:videoId/:playlistId` | Remove a video from a playlist |
| PATCH | `/toggle/:playlistId` | Toggle public/private |

### Subscriptions (`/subscriptions`) — all routes 🔒

| Method | Endpoint | Description |
|---|---|---|
| POST | `/:channelId` | Subscribe/unsubscribe (toggle) |
| GET | `/subscribed-channels/:userId` | Channels a user is subscribed to |
| GET | `/subscribers/:userId` | A channel's subscribers |
| GET | `/subscription-status/:userId` | Whether the current user is subscribed to `userId` |
| GET | `/subscribers-count/:channelId` | Subscriber count for a channel |

### Likes (`/likes`) — all routes 🔒

| Method | Endpoint | Description |
|---|---|---|
| POST | `/video/:videoId` | Like/unlike a video (toggle) |
| POST | `/comment/:commentId` | Like/unlike a comment (toggle) |
| POST | `/tweet/:tweetId` | Like/unlike a tweet (toggle) |
| GET | `/liked-videos/:userId` | A user's liked videos |
| GET | `/liked-tweets/:userId` | A user's liked tweets |

### Comments (`/comments`) — all routes 🔒

| Method | Endpoint | Description |
|---|---|---|
| GET | `/:videoId` | List comments on a video |
| POST | `/:videoId` | Add a comment to a video |
| PATCH | `/:commentId` | Edit a comment |
| DELETE | `/:commentId` | Delete a comment |

### Tweets (`/tweets`) — all routes 🔒

| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create a tweet |
| GET | `/user/:userId` | List a user's tweets (includes `likesCount`/`isLiked` for the requester) |
| PATCH | `/:tweetId` | Edit a tweet |
| DELETE | `/:tweetId` | Delete a tweet |

## Data models

- **User** — `username`, `email`, `fullName`, `avatar`, `coverImage`, `watchHistory[]`, `password` (hashed), `refreshToken`, `isEmailVerified`, `emailVerificationToken`, `emailVerificationTokenExpiry`, `lastEmailSentAt`
- **Video** — `title`, `description`, `videoFile`, `thumbnail`, `duration`, `views`, `isPublished`, `owner`
- **Playlist** — `name`, `description`, `videos[]`, `isPublic`, `owner`
- **Subscription** — `subscriber`, `channel`
- **Like** — polymorphic reference to a `video`, `comment`, or `tweet`, plus `owner`
- **Comment** — `content`, `video`, `owner`
- **Tweet** — `content`, `owner`

## Known issues / roadmap

- No mobile-specific navigation drawer for the sidebar yet (desktop sidebar is hidden below `md`).

## License

ISC — see `backend/package.json`. Feel free to fork and adapt for your own learning projects.
