# LearnStream — Frontend

> React 19 + Vite frontend for the LearnStream AI learning platform.

---

## 📁 Project Structure

```
frontend/
├── index.html
├── vite.config.js
├── package.json
├── tailwind.config.js
│
├── assets/
│   ├── Home.png               # Landing page screenshot (used in root README)
│   └── Feed.JPG              # Feed page screenshot
│
└── src/
    ├── main.jsx               # App entry — React root, AuthProvider
    ├── App.jsx                # Router — all page routes defined here
    ├── index.css              # Global styles, Tailwind imports, custom tokens
    │
    ├── context/
    │   └── AuthContext.jsx    # useAuth hook — current user, loading state
    │
    ├── components/
    │   ├── header/
    │   │   └── Header.jsx     # Top navigation bar
    │   └── navbar/
    │       └── Navbar.jsx     # Secondary nav (mobile / side)
    │
    └── pages/
        ├── Home/
        │   └── Home.jsx          # Landing page — YouTube URL input
        │
        ├── Feed/
        │   ├── Feed.jsx           # Video discovery & recommendations
        │   ├── FeedCard.jsx
        │   ├── FeedFilters.jsx
        │   ├── FeedSidebar.jsx
        │   ├── SearchBar.jsx
        │   └── VideoModal.jsx
        │
        ├── Playlist/
        │   ├── Playlist.jsx       # Playlist management
        │   ├── PlaylistCard.jsx
        │   ├── PlaylistSidebar.jsx
        │   ├── VideoList.jsx
        │   ├── EmptyState.jsx
        │   ├── PlaylistHeader.jsx
        │   └── VideoItem.jsx
        │
        ├── VideoPlayer/
        │   ├── Player.jsx         # Main video player + transcript/summary/quiz tabs
        │   └── components/
        │       ├── TranscriptBox.jsx    # Scrollable transcript panel
        │       ├── SummaryBox.jsx       # AI summary card (uses MarkdownRenderer)
        │       ├── MarkdownRenderer.jsx # Lightweight markdown → React renderer
        │       ├── QuizBox.jsx          # Interactive MCQ quiz
        │       ├── QuizResult.jsx       # Score + review screen
        │       └── ...
        │
        ├── Dashboard/
        │   ├── Dashboard.jsx      # Learning dashboard
        │   └── components/
        │       ├── StatsCards.jsx      # XP, streak, videos watched
        │       ├── ActivityChart.jsx   # Recharts weekly activity bar chart
        │       ├── QuizHistory.jsx     # Past quiz scores table
        │       └── RecentVideos.jsx    # Recently watched videos
        │
        ├── MyLearning/
        │   └── Learning.jsx       # Full watch history & progress
        │
        ├── Profile/
        │   └── Profile.jsx        # Edit display name, view account info
        │
        ├── About/
        │   └── About.jsx
        │
        └── Contact/
            └── Contact.jsx
```

---

## 📄 Key Components

### `Player.jsx`

The heart of the app. Manages:

- YouTube embed via `<iframe>`
- Tab switching between **Transcript**, **Summary**, and **Quiz**
- API calls to the backend for each feature
- Playlist navigation (prev / next video)

### `MarkdownRenderer.jsx`

Zero-dependency inline markdown parser that renders everything Gemini outputs:

| Token         | Rendered as                             |
| ------------- | --------------------------------------- |
| `### heading` | Indigo uppercase header with accent bar |
| `**bold**`    | `<strong>`                              |
| `*italic*`    | `<em>`                                  |
| `` `code` ``  | Indigo pill, mono font                  |
| `- bullet`    | Dot bullet with indigo colour           |
| `1. item`     | Numbered circle badge                   |
| ` ``` ` block | Dark code block, green mono text        |
| `---`         | Dashed divider                          |

### `SummaryBox.jsx`

Displays the AI-generated summary inside the original LearnStream card design.
Uses `MarkdownRenderer` for rich text rendering.

---

## 🎨 Design System

- **Framework:** Tailwind CSS v4
- **Animations:** Framer Motion (`motion`, `AnimatePresence`)
- **Icons:** Lucide React
- **Charts:** Recharts (Dashboard activity graph)
- **Fonts:** System sans-serif (Tailwind default)

---

## 🔗 Backend API Calls

All requests go to `VITE_BASE_URL` (defaults to `http://localhost:5000`):

| Feature       | Endpoint called                          |
| ------------- | ---------------------------------------- |
| Transcript    | `GET /api/videos/:id/transcript?lang=en` |
| Video details | `GET /api/videos/:id/details`            |
| Summary       | `POST /api/ai/summarize`                 |
| Quiz          | `POST /api/ai/quiz`                      |
| Dashboard     | `GET /api/user/dashboard`                |
| Track video   | `POST /api/user/track`                   |
| Auth status   | `GET /auth/current-user`                 |

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start dev server with hot-reload
npm start
```

App runs on **http://localhost:5173** by default.

### Environment (optional)

Create `frontend/.env.local` if the backend runs on a different port:

```env
VITE_BASE_URL=http://localhost:5000
```
