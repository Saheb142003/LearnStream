# LearnStream

**LearnStream** is a full-stack web application for organizing, managing, and tracking online learning playlists, built with the **MERN stack**. It provides a modern and intuitive way to manage YouTube playlists, track video durations, and maintain personalized learning dashboards.

🔗 **Live App**: [learnstream.netlify.app](https://learnstream.netlify.app)

---

## 📑 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Screenshots](#screenshots)
- [Contribution Guidelines](#contribution-guidelines)
- [License](#license)
- [Author](#author)

---

## 📖 Overview

LearnStream enables users to **build custom learning paths** using YouTube playlists.  
Users can log in with Google, add playlists, view total durations, and track learning progress with ease.

---

## ✨ Features

- 🎥 **YouTube Playlist Integration** – Add and fetch playlists with metadata & thumbnails.
- ⏳ **Video Duration Calculation** – Get total and per-video durations in H/M/S format.
- 🔐 **User Authentication** – Secure login/signup via Google OAuth.
- 📊 **Personal Dashboard** – Manage playlists and progress individually.
- 📱 **Responsive Frontend** – Built with **Vite + React** and styled using **Tailwind CSS**.
- 🗄️ **Real-Time Database** – MongoDB stores users, playlists, and video data.
- 🌐 **RESTful API** – Express.js backend with CRUD endpoints.
- ⚡ **Robust Error Handling** – Clear backend validation & error feedback.

---

## 🛠️ Technology Stack

| Layer    | Technology                           |
| -------- | ------------------------------------ |
| Frontend | React, Vite, Tailwind CSS            |
| Backend  | Node.js, Express.js                  |
| Database | MongoDB (Mongoose)                   |
| Auth     | Google OAuth                         |
| APIs     | YouTube Data API                     |
| Other    | JavaScript, Python (utility scripts) |

---

## 🚀 Getting Started

### ✅ Prerequisites

- **Node.js** ≥ 16.x
- **MongoDB** (Atlas or local)
- **Google OAuth credentials**
- **YouTube API key**

### ⚙️ Installation

```bash
# Clone the repository
git clone https://github.com/Saheb142003/LearnStream.git
cd LearnStream

# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install

# Configure environment variables (see .env.example for details)

# Start the backend server
npm run server

# Start the frontend (in another terminal)
npm run dev
```

---

## 🔑 Environment Variables

Create `.env` files for both frontend and backend.

```env
# Frontend
REACT_APP_YOUTUBE_API_KEY=your_youtube_api_key
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id

# Backend
MONGODB_URI=your_mongodb_connection_string
```

Refer to `.env.example` if provided.

---

## 📂 Project Structure

```
LearnStream/
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   └── server.js
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── index.js
│   └── vite.config.js
│
├── package.json
├── README.md
├── .env.example
```

---

## 📸 Screenshots

### 🎥 Home View

![Home View](./frontend/assets/Capture1.JPG)

### 🎥 Feed View

![Feed View](./frontend/assets/Feed.png)

---

## 🤝 Contribution Guidelines

- 🍴 Fork the repo and create a branch for each feature/bugfix.
- 📝 Follow consistent code style & write clear commit messages.
- 🔀 Submit PRs with a detailed description of changes.

---

## 📜 License

This project is licensed under the **MIT License**.

---

## 👨‍💻 Author

Developed by **Saheb Ansari**  
_BTech CSE '26_
