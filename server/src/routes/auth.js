// server/src/routes/auth.js
import express from "express";
import passport from "passport";

const router = express.Router();

// Google OAuth login request
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/login/failed",
    session: true,
  }),
  (req, res) => {
    // Redirect to frontend after successful login
    req.session.save(() => {
      res.redirect(process.env.CLIENT_URL);
    });
  }
);

// Login success
router.get("/login/success", (req, res) => {
  if (req.user) {
    const { _id, name, email, picture } = req.user;
    res.json({
      success: true,
      user: { id: _id, name, email, picture },
    });
  } else {
    res.status(401).json({ success: false, message: "Not authenticated" });
  }
});

// Login failed
router.get("/login/failed", (req, res) => {
  res.status(401).json({ success: false, message: "Google login failed" });
});

// Logout
router.post("/logout", (req, res, next) => {
  const clearCookieAndSendResponse = () => {
    res.clearCookie("connect.sid", { path: "/" });
    res.status(200).json({ success: true, message: "Logged out successfully" });
  };

  const destroySession = () => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) console.error("Session destroy error:", err);
        clearCookieAndSendResponse();
      });
    } else {
      clearCookieAndSendResponse();
    }
  };

  req.logout(function (err) {
    if (err) {
      console.error("Passport logout error (ignoring):", err);
    }
    destroySession();
  });
});

export default router;
