// In-memory rate limiter: 20 requests per hour per uid
const requestCounts = new Map();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 20;

function checkRateLimit(uid) {
  const now = Date.now();

  if (!requestCounts.has(uid)) {
    requestCounts.set(uid, { count: 1, windowStart: now });
    return true;
  }

  const record = requestCounts.get(uid);
  if (now - record.windowStart > WINDOW_MS) {
    requestCounts.set(uid, { count: 1, windowStart: now });
    return true;
  }

  if (record.count >= MAX_REQUESTS) return false;

  record.count++;
  return true;
}

module.exports = { checkRateLimit };
