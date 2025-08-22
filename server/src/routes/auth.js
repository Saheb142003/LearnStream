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
    res.redirect(process.env.CLIENT_URL);
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
router.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) return next(err);
    req.session = null; // Clear session
    res.redirect(process.env.CLIENT_URL);
  });
});

export default router;
