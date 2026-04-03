// In-memory rate limiter: 20 requests per hour per uid
const requestCounts = new Map();
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 20;

function rateLimit(req, res, next) {
  const uid = req.uid;
  const now = Date.now();

  if (!requestCounts.has(uid)) {
    requestCounts.set(uid, { count: 1, windowStart: now });
    return next();
  }

  const record = requestCounts.get(uid);
  if (now - record.windowStart > WINDOW_MS) {
    requestCounts.set(uid, { count: 1, windowStart: now });
    return next();
  }

  if (record.count >= MAX_REQUESTS) {
    return res.status(429).json({
      error: "Rate limit exceeded. You can make 20 AI requests per hour."
    });
  }

  record.count++;
  next();
}

// Clean up stale entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [uid, record] of requestCounts.entries()) {
    if (now - record.windowStart > WINDOW_MS) requestCounts.delete(uid);
  }
}, WINDOW_MS);

module.exports = { rateLimit };
