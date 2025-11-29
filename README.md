# LearnStream - AI-Powered Learning Platform

![LearnStream Home](/frontend/assets/Home.JPG)

<div align="center">

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)

</div>

<br />

**LearnStream** is a modern, AI-enhanced video learning platform designed to transform how you consume educational content. By integrating advanced AI capabilities directly into the video experience, LearnStream helps you learn faster, retain more, and track your progress effectively.

### 🔗 [Live Demo](https://learnstream.netlify.app)

---

## 🚀 Key Features

### 🧠 AI-Powered Learning Tools

- **Instant Summaries**: Get concise, AI-generated summaries of any video to grasp key concepts in seconds using Google Gemini.
- **Interactive Quizzes**: Test your knowledge with auto-generated quizzes based on video content.
- **Smart Transcripts**: Follow along with synchronized transcripts for better accessibility and note-taking.

### 📊 Comprehensive Dashboard

- **Activity Tracking**: Monitor your daily watch time, app usage, and learning streaks.
- **Progress Visualization**: Visualize your learning habits with interactive charts.
- **Quiz History**: Keep track of your quiz scores and identify areas for improvement.

### 📺 Intelligent Feed & Player

- **Mixed Content Feed**: Discover both individual videos and curated playlists in a seamless, infinite-scroll feed.
- **Smart Search**: Find content instantly with optimized, debounced search.
- **Distraction-Free Player**: Focus on learning with a clean, theater-mode player interface.

![LearnStream Feed](/frontend/assets/Feed.JPG)

---

## 🛠️ Tech Stack

| Category      | Technologies                                                     |
| ------------- | ---------------------------------------------------------------- |
| **Frontend**  | React, Vite, Tailwind CSS, Framer Motion, Recharts, Lucide React |
| **Backend**   | Node.js, Express, MongoDB, Mongoose                              |
| **AI & Data** | Google Gemini API, YouTube Transcript API, Python (Scripting)    |
| **Auth**      | Passport.js (Google OAuth 2.0)                                   |
| **DevOps**    | Docker (Optional), Render/Netlify (Deployment)                   |

---

## 📦 Installation & Setup

### Prerequisites

- **Node.js** (v18+ recommended)
- **MongoDB** (Local or Atlas URI)
- **Python** (Required for some transcript fetching fallbacks)
- **Google Cloud Console Project** (For OAuth and Gemini API)

### 1. Clone the Repository

```bash
git clone https://github.com/Saheb142003/LearnStream.git
cd LearnStream
```

### 2. Backend Setup

Navigate to the server directory and install dependencies:

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory with the following variables:

```env
PORT=8000
SERVER_URL=http://localhost:8000
CLIENT_URL=http://localhost:5173
MONGO_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SUMMARY_API_KEY=your_gemini_api_key
QUIZ_API_KEY=your_gemini_api_key
PYTHON_BIN=python
TRANSCRIPT_LANGS=en,en-US,en-GB,en-IN,hi
```

### 3. Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:8000
VITE_SERVER_URL=http://localhost:8000
```

---

## 🏃‍♂️ Running the Application

### Development Mode

You need to run both the backend and frontend servers.

**Terminal 1 (Backend):**

```bash
cd server
npm start
```

_Server runs on http://localhost:8000_

**Terminal 2 (Frontend):**

```bash
cd frontend
npm run dev
```

_Frontend runs on http://localhost:5173_

---

## 🤝 Contributing

Contributions are always welcome!

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.
