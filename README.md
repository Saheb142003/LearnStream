# LearnStream

[🌐 Live Demo](https://learnstream.netlify.app) | [🐞 Report Bug](https://github.com/Saheb142003/LearnStream/issues) | [✨ Request Feature](https://github.com/Saheb142003/LearnStream/issues)

---

![Stars](https://img.shields.io/github/stars/Saheb142003/LearnStream?style=for-the-badge)
![Forks](https://img.shields.io/github/forks/Saheb142003/LearnStream?style=for-the-badge)
![License](https://img.shields.io/github/license/Saheb142003/LearnStream?style=for-the-badge)
![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node](https://img.shields.io/badge/Node.js-20.0-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)

**LearnStream** is a premier **AI-powered educational platform** designed to transform passive video watching into an interactive learning experience. By leveraging advanced AI, LearnStream converts YouTube videos into comprehensive study guides, complete with transcripts, summaries, and interactive quizzes.

It brings together **video learning**, **AI analysis**, **progress tracking**, and **distraction-free viewing** in a clean, modern interface.

- **Tech Stack:** React 19, Tailwind CSS, Node.js, Express, MongoDB, Google Gemini AI
- **Live Site:** <https://learnstream.netlify.app>

---

## 📸 Screenshots

|                **Home Page**                |                  **Feed**                  |
| :-----------------------------------------: | :----------------------------------------: |
|   ![Home Page](frontend/assets/Home.JPG)    |     ![Feed](frontend/assets/Feed.JPG)      |
| _Transform videos into knowledge instantly_ | _Discover and track your learning journey_ |

In the age of endless content, **retention** is the real challenge. Students and professionals watch hours of tutorials but often struggle to recall key concepts or test their understanding.

**LearnStream solves this by:**

1.  **Removing Distractions**: No sidebar recommendations or ads.
2.  **Active Recall**: AI-generated quizzes force you to test your knowledge immediately.
3.  **Quick Review**: Summaries and transcripts allow for rapid revision without re-watching.

If you support this mission, leaving a ⭐ helps others discover the project!

---

## 🚀 Key Features

| Feature                 | Description                                |
| ----------------------- | ------------------------------------------ |
| **AI Transcripts**      | Accurate, time-synced video transcripts    |
| **Smart Summaries**     | AI-generated concise summaries of content  |
| **Interactive Quizzes** | Auto-generated quizzes to test retention   |
| **Distraction Free**    | Clean player interface focused on learning |
| **Progress Tracking**   | Track watched videos and quiz scores       |
| **Playlist Support**    | Import entire YouTube playlists            |
| **Secure Auth**         | Google OAuth & Local Authentication        |
| **Responsive Design**   | Works seamlessly on desktop and mobile     |

---

## 🧪 Tech & Architecture

This project is built as a **Monorepo** containing both the Frontend and Backend.

### **Frontend**

- **Framework:** React 19 (Vite)
- **Styling:** Tailwind CSS, Framer Motion
- **Icons:** Lucide React
- **State/Routing:** React Router v7, Context API
- **SEO:** React Helmet Async

### **Backend**

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose)
- **AI Engine:** Google Gemini API
- **Authentication:** Passport.js (Google OAuth)
- **Video Processing:** youtube-transcript, ytdl-core

### **DevOps**

- **Frontend Hosting:** Netlify
- **Backend Hosting:** Render
- **CI/CD:** GitHub Actions / Netlify Auto-Builds

---

## 🛠️ Getting Started

Follow these steps to run LearnStream locally on your machine.

### Prerequisites

- Node.js (v18+)
- MongoDB (Local or Atlas URI)
- Google Gemini API Key

### Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/Saheb142003/LearnStream.git
    cd LearnStream
    ```

2.  **Install Dependencies**

    ```bash
    # Install Frontend Dependencies
    cd frontend
    npm install

    # Install Backend Dependencies
    cd ../server
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the `server` directory:

    ```env
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    COOKIE_KEY=your_session_secret
    GEMINI_API_KEY=your_gemini_api_key
    CLIENT_URL=http://localhost:5173
    ```

4.  **Run the Application**
    Open two terminal windows:

    _Terminal 1 (Backend):_

    ```bash
    cd server
    npm start
    ```

    _Terminal 2 (Frontend):_

    ```bash
    cd frontend
    npm run dev
    ```

5.  **Visit the App**
    Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📝 License

LearnStream is licensed under the **MIT License**.

- **Free to use** for personal and educational purposes.
- **Open Source** contributions are welcome.

See: `LICENSE` file for details.

---

## 👥 Contributors

- **Lead Developer:** Md Sahebuddin Ansari ([@Saheb142003](https://github.com/Saheb142003))
- **Role:** Full Stack Developer

---

## 📬 Contact

- **Website:** <https://learnstream.netlify.app>
- **GitHub:** <https://github.com/Saheb142003>
- **LinkedIn:** <https://www.linkedin.com/in/saheb142003>
- **Email:** <saheb142003@gmail.com>
