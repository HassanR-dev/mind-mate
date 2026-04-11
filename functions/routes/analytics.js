const admin = require("firebase-admin");

function getWeekKey(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

async function computeWeeklyAnalytics(snapshot, context) {
  const uid = context.params.uid;
  const db = admin.database();
  const now = new Date();
  const weekKey = getWeekKey(now);
  const weekStart = getWeekStart(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  try {
    const [journalsSnap, tasksSnap] = await Promise.all([
      db.ref(`users/${uid}/journals`).once("value"),
      db.ref(`users/${uid}/tasks`).once("value")
    ]);

    let moodScores = [];
    let stressLevels = [];
    let journalDays = new Set();

    journalsSnap.forEach(child => {
      const j = child.val();
      const date = new Date(j.createdAt || j.timestamp);
      if (date >= weekStart && date < weekEnd) {
        const score = j.moodScore !== undefined ? j.moodScore : (
          j.moodLabel === "positive" ? 0.8 : j.moodLabel === "neutral" ? 0.5 : 0.2
        );
        moodScores.push(score);
        if (j.stressLevel) stressLevels.push(j.stressLevel);
        journalDays.add(date.toDateString());
      }
    });

    // Journal streak
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      if (journalDays.has(d.toDateString())) streak++;
      else break;
    }

    let tasksCompleted = 0;
    let tasksOverdue = 0;
    tasksSnap.forEach(child => {
      const task = child.val();
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      if (dueDate && dueDate >= weekStart && dueDate < weekEnd) {
        if (task.completed) tasksCompleted++;
        else if (dueDate < now) tasksOverdue++;
      }
    });

    const stressCounts = { low: 0, moderate: 0, high: 0 };
    stressLevels.forEach(l => { if (stressCounts[l] !== undefined) stressCounts[l]++; });
    const stressDominant = Object.entries(stressCounts).sort((a, b) => b[1] - a[1])[0][0];

    const avgMoodScore = moodScores.length > 0
      ? moodScores.reduce((a, b) => a + b, 0) / moodScores.length
      : 0.5;

    await db.ref(`users/${uid}/analytics/weekly/${weekKey}`).set({
      avgMoodScore: parseFloat(avgMoodScore.toFixed(3)),
      stressDominant,
      tasksCompleted,
      tasksOverdue,
      journalStreak: streak,
      computedAt: now.toISOString()
    });

    console.log(`Weekly analytics computed for uid=${uid} week=${weekKey}`);
  } catch (err) {
    console.error("computeWeeklyAnalytics error:", err);
  }
}

module.exports = { computeWeeklyAnalytics };
