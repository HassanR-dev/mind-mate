const admin = require("firebase-admin");

async function verifyAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }
  const token = authHeader.split("Bearer ")[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.uid = decoded.uid;
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
}

module.exports = { verifyAuth };
