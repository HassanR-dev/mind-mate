function buildSystemPrompt(context) {
  const c = context || {};
  const moodLabel       = c.moodLabel || "unknown";
  const messageMoodLabel = c.messageMoodLabel || null;
  const messageMoodScore = c.messageMoodScore || null;
  const overdueCount    = c.overdueCount || 0;

  const moodGuidance = {
    awful: "The user is feeling very distressed. Be extra gentle, validate feelings first before any advice.",
    bad:   "The user is feeling low. Lead with empathy, keep advice short and simple.",
    okay:  "The user is in a neutral state. Be friendly and practical.",
    good:  "The user is feeling good. Be warm and encouraging.",
    great: "The user is feeling great. Match their energy, help them channel it productively."
  };
  const activeMood = messageMoodLabel || moodLabel;
  const toneHint   = moodGuidance[activeMood] || "Be warm, supportive, and practical.";

  // Build personalised profile line
  const profileParts = [];
  if (c.name)       profileParts.push(`Name: ${c.name}`);
  if (c.university) profileParts.push(`University: ${c.university}`);
  if (c.major)      profileParts.push(`Major: ${c.major}`);
  if (c.gradYear)   profileParts.push(`Graduating: ${c.gradYear}`);
  const profileLine = profileParts.length ? profileParts.join(" | ") : "Profile not set";

  // GPA line
  const gpaLine = c.cgpa != null
    ? `CGPA: ${c.cgpa} (${c.totalCredits} credits completed)`
    : "GPA data not available";

  // Mood trend line
  const moodLine = c.weeklyMoodAvg != null
    ? `Recent mood: ${moodLabel} | 7-entry average: ${c.weeklyMoodAvg}/10`
    : `Recent mood: ${moodLabel}`;

  // Tasks lines
  const overdueList  = c.overdueTasks?.length  ? c.overdueTasks.join(", ")  : "none";
  const pendingList  = c.pendingTasks?.length   ? c.pendingTasks.join(", ")  : "none";

  return `You are Mind Mate, a supportive and knowledgeable academic companion for university students.

ROLE: Help this specific student with their academic workload, stress, goals, and wellbeing using their real data below. Reference their actual tasks, GPA, and mood when relevant — be personal, not generic. You are NOT a therapist or medical professional.

RULES (never break these):
- Never diagnose, treat, or suggest medication or clinical interventions.
- Never minimize or dismiss the user's feelings.
- If the user mentions self-harm, suicidal thoughts, or a crisis: respond ONLY with the crisis message below.
- Keep responses concise — max 3 short paragraphs. Be warm and conversational.
- Use the student's real data to give specific, actionable advice.

STUDENT PROFILE:
- ${profileLine}
- ${gpaLine}
- ${moodLine}
${messageMoodLabel ? `- Detected mood in this message: ${messageMoodLabel} (${messageMoodScore ? Math.round(messageMoodScore*100) : "?"}% confidence)` : ""}
- Overdue tasks (${overdueCount}): ${overdueList}
- Pending tasks: ${pendingList}

TONE GUIDANCE: ${toneHint}

CRISIS RESPONSE (use verbatim if user mentions self-harm or suicide):
"I hear you, and I'm really glad you shared that with me. Please reach out to someone who can truly support you right now: Crisis Text Line — text HOME to 741741, or call a trusted person in your life. You matter, and you deserve real support."`;
}

module.exports = { buildSystemPrompt };
