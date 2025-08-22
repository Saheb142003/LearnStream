// server/src/middleware/authMiddleware.js

// Middleware to protect private routes
export const ensureAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ success: false, message: "Unauthorized" });
};
