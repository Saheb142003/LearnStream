// server/src/middleware/rateLimit.js
//
// Zero-dependency sliding-window rate limiter.
// Two independent limits enforced simultaneously:
//   1. Per-IP  — prevents anonymous abuse / scrapers
//   2. Per-user — per authenticated MongoDB user ID
//
// Responses on limit breach:
//   HTTP 429 with Retry-After header (seconds until oldest request ages out)

const WINDOWS = new Map(); // key → [timestamp, timestamp, ...]

/** Purge every entry older than windowMs. Called before every check. */
function purge(key, windowMs) {
  const now = Date.now();
  const timestamps = WINDOWS.get(key) || [];
  const fresh = timestamps.filter((t) => now - t < windowMs);
  if (fresh.length === 0) {
    WINDOWS.delete(key);
  } else {
    WINDOWS.set(key, fresh);
  }
  return fresh;
}

/** Record a new hit and return the current count within the window. */
function hit(key, windowMs) {
  const fresh = purge(key, windowMs);
  fresh.push(Date.now());
  WINDOWS.set(key, fresh);
  return fresh.length;
}

/**
 * Return seconds until the oldest timestamp in the window expires.
 * Used for the Retry-After response header.
 */
function retryAfter(key, windowMs) {
  const timestamps = WINDOWS.get(key) || [];
  if (timestamps.length === 0) return 0;
  const oldest = timestamps[0];
  return Math.ceil((oldest + windowMs - Date.now()) / 1000);
}

/**
 * Get the real client IP, honouring X-Forwarded-For when behind a proxy.
 * Falls back to socket address.
 */
function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    // X-Forwarded-For: client, proxy1, proxy2
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

/**
 * Factory that creates a rate-limit middleware.
 *
 * @param {Object} opts
 * @param {number} opts.ipMax         Max hits per IP per ipWindow  (default 10)
 * @param {number} opts.ipWindow      IP window in ms               (default 60_000)
 * @param {number} opts.userMax       Max hits per user per userWindow (default 25)
 * @param {number} opts.userWindow    User window in ms             (default 300_000)
 * @param {string} opts.resource      Label shown in 429 message
 */
export function createRateLimiter(opts = {}) {
  const {
    ipMax = 10,
    ipWindow = 60_000, // 1 minute
    userMax = 25,
    userWindow = 300_000, // 5 minutes
    resource = "this resource",
  } = opts;

  return function rateLimitMiddleware(req, res, next) {
    const ip = clientIp(req);
    const uid = req.user?._id?.toString() || req.user?.id?.toString() || null;

    // ── IP check ──────────────────────────────────────────────────────────────
    const ipKey = `ip:${ip}`;
    const ipCount = hit(ipKey, ipWindow);

    if (ipCount > ipMax) {
      const wait = retryAfter(ipKey, ipWindow);
      res.set("Retry-After", wait);
      return res.status(429).json({
        error: `Rate limit exceeded. You may access ${resource} ${ipMax} times per minute. Try again in ${wait}s.`,
        retryAfter: wait,
      });
    }

    // ── Per-user check (only if authenticated) ────────────────────────────────
    if (uid) {
      const userKey = `user:${uid}`;
      const userCount = hit(userKey, userWindow);

      if (userCount > userMax) {
        const wait = retryAfter(userKey, userWindow);
        res.set("Retry-After", wait);
        return res.status(429).json({
          error: `You've used all ${userMax} transcript requests for this 5-minute window. Try again in ${wait}s.`,
          retryAfter: wait,
        });
      }
    }

    next();
  };
}

// ─── Periodic memory cleanup ───────────────────────────────────────────────────
// Entries for IPs / users that haven't been seen in a while would persist
// forever without this. Run every 10 minutes.
setInterval(() => {
  const now = Date.now();
  const STALE_AFTER = 600_000; // 10 minutes of inactivity
  for (const [key, timestamps] of WINDOWS.entries()) {
    if (timestamps.length === 0 || now - timestamps.at(-1) > STALE_AFTER) {
      WINDOWS.delete(key);
    }
  }
}, 600_000).unref(); // .unref() so this timer doesn't keep the process alive
