server/
├── src/
│ ├── config/
│ │ └── passport.js # ✅ Passport Google strategy config
│ │
│ ├── models/
│ │ └── User.js # ✅ Mongoose schema for users
│ │
│ ├── routes/
│ │ ├── auth.js # ✅ Google login/logout, success/fail routes
│ │ └── user.js # (optional) protected routes for user data
│ │
│ ├── middleware/
│ │ └── authMiddleware.js # ✅ Checks if user is authenticated (for APIs)
│ │
│ ├── utils/
│ │ └── connectDB.js # ✅ MongoDB connection setup
│ │
│ ├── server.js # ✅ Main entry point (Express app, passport init, routes)
│ │
│ └── .env # Environment variables (Google keys, Mongo URI, etc.)
│
├── package.json
