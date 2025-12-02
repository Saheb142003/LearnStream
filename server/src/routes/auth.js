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
router.get("/login/success", async (req, res) => {
  if (req.user) {
    // Backfill createdAt for old users if missing
    if (!req.user.createdAt) {
      try {
        // Use lastLogin or current time as fallback
        const fallbackDate = req.user.lastLogin || new Date();
        // We need to bypass mongoose timestamps if we want to set a specific date,
        // but since we are just backfilling, setting it to a date is fine.
        // However, Mongoose timestamps option might override 'createdAt' on save if it thinks it's a new doc,
        // but this is an update.
        // To be safe, we can use $set in update or just save.
        // Since req.user is a mongoose doc (from deserializeUser), we can try saving.
        // But 'createdAt' is immutable by default in Mongoose timestamps?
        // Actually, if it's missing, Mongoose will create it on save if timestamps: true.
        // But we want to set it to an OLD date if possible (lastLogin), not now.
        // Let's try to update it directly.

        req.user.createdAt = fallbackDate;
        await req.user.save();
      } catch (err) {
        console.error("Error backfilling createdAt:", err);
      }
    }

    const { _id, name, email, picture, accountType, createdAt, lastLogin } =
      req.user;
    res.json({
      success: true,
      user: {
        id: _id,
        name,
        email,
        picture,
        accountType: accountType || "Learner",
        createdAt,
        lastLogin,
      },
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

    // Destroy the session in the store
    req.session.destroy((err) => {
      if (err) return next(err);

      // Explicitly clear the cookie
      // Note: The options must match those used when setting the cookie (except maxAge/expires)
      res.clearCookie("connect.sid", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      res.redirect(process.env.CLIENT_URL);
    });
  });
});

export default router;
