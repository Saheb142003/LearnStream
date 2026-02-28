# LearnStream — Server

> Express + Node.js backend for the LearnStream AI learning platform.
> Handles transcript fetching, AI summarisation, quizzes, auth, and user data.

---

## 📁 Project Structure

```
server/
├── server.js                  # Entry point — Express app, middleware, routes
├── .env                       # Environment variables (never commit this)
├── package.json
│
├── scripts/
│   └── fetch_transcript.py    # Python transcript fetcher (youtube_transcript_api)
│
└── src/
    ├── config/
    │   └── passport.js        # Google OAuth 2.0 strategy (Passport.js)
    │
    ├── middleware/
    │   ├── authMiddleware.js   # isAuthenticated — protects private routes
    │   └── rateLimit.js       # Sliding-window per-IP & per-user rate limiter
    │
    ├── models/
    │   ├── User.js             # Mongoose user schema (profile, progress, history)
    │   └── PlaylistModel.js    # Mongoose playlist schema
    │
    ├── routes/
    │   ├── auth.js             # Google OAuth login / logout / session
    │   ├── userRoutes.js       # Dashboard, profile, quiz results, tracking
    │   ├── playlist.js         # Playlist CRUD
    │   ├── feed.js             # Video feed & recommendations
    │   ├── aiRoutes.js         # POST /summarize, POST /quiz (Gemini AI)
    │   └── playerControl/
    │       └── transcript.js   # GET /:videoId/transcript, GET /:videoId/details
    │
    ├── services/
    │   └── transcriptService.js  # Transcript engine (LRU cache, semaphore, dedup)
    │
    └── utils/
        ├── connectDB.js        # MongoDB connection
        ├── runPython.js        # Spawn Python scripts with timeout & UTF-8
        └── youtubeService.js   # YouTube Data API helpers (durations, playlists)
```

---

## 🔌 API Reference

### Auth

| Method | Endpoint                | Description                  |
| ------ | ----------------------- | ---------------------------- |
| `GET`  | `/auth/google`          | Redirect to Google OAuth     |
| `GET`  | `/auth/google/callback` | OAuth callback, sets session |
| `GET`  | `/auth/logout`          | Destroy session              |
| `GET`  | `/auth/current-user`    | Return current session user  |

### Videos & Transcripts

| Method | Endpoint                     | Description                     |
| ------ | ---------------------------- | ------------------------------- |
| `GET`  | `/api/videos/:id/transcript` | Fetch transcript (rate-limited) |
| `GET`  | `/api/videos/:id/details`    | Video title, author, duration   |
| `GET`  | `/api/videos/stats`          | Transcript service diagnostics  |

### AI

| Method | Endpoint            | Description                  |
| ------ | ------------------- | ---------------------------- |
| `POST` | `/api/ai/summarize` | Generate markdown summary    |
| `POST` | `/api/ai/quiz`      | Generate 5-question MCQ quiz |

### User

| Method | Endpoint                | Description                     |
| ------ | ----------------------- | ------------------------------- |
| `GET`  | `/api/user/dashboard`   | Stats, streaks, recent activity |
| `PUT`  | `/api/user/profile`     | Update display name / avatar    |
| `POST` | `/api/user/quiz-result` | Save quiz score                 |
| `POST` | `/api/user/track`       | Track a watched video           |
| `GET`  | `/api/user/history`     | Learning history                |

### Playlists

| Method   | Endpoint             | Description                      |
| -------- | -------------------- | -------------------------------- |
| `POST`   | `/api/playlists`     | Create playlist from YouTube URL |
| `GET`    | `/api/playlists`     | List user's playlists            |
| `DELETE` | `/api/playlists/:id` | Delete a playlist                |

---

## 🧠 Transcript Engine

Transcript fetching uses a layered architecture with full production hardening:

```
Request
  │
  ├─ LRU cache hit?  ──────────────────────────> Return instantly
  │
  ├─ In-flight dedup — same video already fetching? ──> Await same Promise
  │
  └─ Concurrency semaphore (max 3 workers)
       │
       ├─ Layer 1: Python youtube_transcript_api ≥1.2.4
       │     └─ 30 s timeout (SIGTERM → SIGKILL)
       │
       └─ Layer 2: Invidious public mirrors (9 instances)
```

**Rate limiting** (applied to `/transcript` only):

- 10 requests / minute per IP
- 25 requests / 5 minutes per authenticated user
- HTTP 429 with `Retry-After` header on breach

---

## 🤖 AI Engine

Gemini calls now exclusively use the Gemini 2.5 Flash model:

```
gemini-2.5-flash
```

The model gets 2 attempts with a 1.5 s backoff on 503 / 429 if capacity issues occur.

---

## ⚙️ Environment Variables

Create `server/.env`:

```env
# Server
PORT=5000
CLIENT_URL=http://localhost:5173

# Database
MONGO_URI=your_mongodb_uri

# Auth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_session_secret

# AI
GEMINI_API_KEY_SUMMARY=your_gemini_key
GEMINI_API_KEY_QUIZ=your_gemini_key
YOUTUBE_API_KEY=your_youtube_data_api_key

# Transcript engine tuning (optional — safe defaults apply)
PYTHON_BIN=py                  # python | python3 | py
TRANSCRIPT_CONCURRENCY=3       # max simultaneous Python processes
TRANSCRIPT_QUEUE_DEPTH=20      # max queued requests before 503
TRANSCRIPT_TIMEOUT_MS=30000    # ms before Python process is killed
```

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Install Python transcript library (one-time)
pip install youtube-transcript-api

# Start dev server (auto-restarts on change)
npm start
```

Server runs on **http://localhost:5000** by default.
