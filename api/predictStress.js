const admin = require("./_lib/admin");
const { cors } = require("./_lib/cors");
const { verifyAuth } = require("./_lib/auth");
const { checkRateLimit } = require("./_lib/rateLimit");

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const uid = await verifyAuth(req, res);
  if (!uid) return;
  if (!checkRateLimit(uid)) return res.status(429).json({ error: "Rate limit exceeded. You can make 20 AI requests per hour." });

  const db = admin.database();

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [journalsSnap, tasksSnap, gpasSnap] = await Promise.all([
      db.ref(`users/${uid}/journals`).once("value"),
      db.ref(`users/${uid}/tasks`).once("value"),
      db.ref(`users/${uid}/gpas`).once("value")
    ]);

    let recentMoodScores = [];
    let journalDays = new Set();

    journalsSnap.forEach(child => {
      const j = child.val();
      const journalDate = new Date(j.createdAt || j.timestamp);
      if (journalDate >= sevenDaysAgo) {
        const moodScore = j.moodScore !== undefined ? j.moodScore : (
          j.moodLabel === "positive" ? 0.8 :
          j.moodLabel === "neutral" ? 0.5 : 0.2
        );
        recentMoodScores.push(moodScore);
        journalDays.add(journalDate.toDateString());
      }
    });

    const avgMoodScore = recentMoodScores.length > 0
      ? recentMoodScores.reduce((a, b) => a + b, 0) / recentMoodScores.length
      : 0.5;

    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      if (journalDays.has(d.toDateString())) streak++;
      else break;
    }

    let overdueCount = 0;
    tasksSnap.forEach(child => {
      const task = child.val();
      if (!task.completed && task.dueDate && new Date(task.dueDate) < now) overdueCount++;
    });

    let gpaTrend = "stable";
    const gpas = [];
    gpasSnap.forEach(child => gpas.push(child.val()));
    gpas.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    if (gpas.length >= 2) {
      const recent = parseFloat(gpas[gpas.length - 1].gpa || 0);
      const previous = parseFloat(gpas[gpas.length - 2].gpa || 0);
      if (recent < previous - 0.2) gpaTrend = "declining";
      else if (recent > previous + 0.2) gpaTrend = "improving";
    }

    let stressScore = 0;
    const factors = [];
    if (avgMoodScore < 0.3) { stressScore += 3; factors.push("low_mood"); }
    if (overdueCount >= 3) { stressScore += 2; factors.push("overdue_tasks"); }
    if (gpaTrend === "declining") { stressScore += 2; factors.push("gpa_decline"); }
    if (streak >= 3) { stressScore -= 1; factors.push("journal_streak_positive"); }

    let stressLevel = "low";
    if (stressScore >= 5) stressLevel = "high";
    else if (stressScore >= 3) stressLevel = "moderate";

    return res.json({
      stressLevel,
      stressScore: Math.max(0, stressScore),
      factors,
      overdueCount,
      journalStreak: streak,
      avgMoodScore: parseFloat(avgMoodScore.toFixed(3))
    });
  } catch (err) {
    console.error("predictStress error:", err);
    return res.status(500).json({ error: "Failed to predict stress" });
  }
};
