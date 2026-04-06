const admin = require("./_lib/admin");
const { cors } = require("./_lib/cors");
const { verifyAuth } = require("./_lib/auth");
const { checkRateLimit } = require("./_lib/rateLimit");
const { buildSystemPrompt } = require("./_lib/prompts/system");

const CRISIS_KEYWORDS = [
  "i want to die", "want to die", "kill myself", "end my life", "suicidal",
  "hurt myself", "self harm", "self-harm", "don't want to be here",
  "can't go on", "no reason to live", "ending it all", "not worth living",
  "feel like giving up on life"
];

function detectCrisis(message) {
  const lower = message.toLowerCase();
  return CRISIS_KEYWORDS.some(kw => lower.includes(kw));
}

const CRISIS_RESPONSE = "I hear you, and I'm really glad you shared that with me. Please reach out to someone who can truly support you right now: **Crisis Text Line** — text HOME to 741741, or call a trusted person in your life. You matter, and you deserve real support.";
const CRISIS_RESOURCES = [
  { name: "Crisis Text Line", contact: "Text HOME to 741741" },
  { name: "International Crisis Centers", contact: "https://www.iasp.info/resources/Crisis_Centres/" }
];

function formatMessagesForMistral(messages) {
  let prompt = "<s>";
  for (const msg of messages) {
    if (msg.role === "system") {
      prompt += `[INST] ${msg.content} [/INST] Understood. I am Mind Mate, your academic companion. </s><s>`;
    } else if (msg.role === "user") {
      prompt += `[INST] ${msg.content} [/INST]`;
    } else if (msg.role === "assistant") {
      prompt += ` ${msg.content} </s><s>`;
    }
  }
  return prompt;
}

// ── Detect mood from the user's message using fine-tuned model ──
async function detectMoodFromMessage(message, hfApiKey) {
  const model = process.env.HF_EMOTION_MODEL;
  if (!model || !hfApiKey) return null;
  try {
    const res = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        method: "POST",
        headers: { "Authorization": `Bearer ${hfApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: message }),
        signal: AbortSignal.timeout(5000) // don't slow chatbot > 5s
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const results = data && data[0];
    if (!Array.isArray(results) || !results.length) return null;
    const top = [...results].sort((a, b) => b.score - a.score)[0];
    const MOODS = ["awful", "bad", "okay", "good", "great"];
    return MOODS.includes(top.label) ? { mood: top.label, score: top.score } : null;
  } catch {
    return null;
  }
}

// ── Smart local fallback when HF API is unavailable ──
function localReply(message, context) {
  const lower = message.toLowerCase();
  // Prefer the live mood detected from this message, fall back to journal mood
  const mood = (context && context.messageMoodLabel) || (context && context.moodLabel) || "okay";

  // Greeting patterns
  if (/^(hi|hello|hey|howdy|yo|sup|what'?s up|good (morning|afternoon|evening))/.test(lower)) {
    const greetings = [
      "Hey there! How's your day going? I'm here to help with studying, planning, or just checking in.",
      "Hi! Good to see you. Want to chat about your courses, or just need a quick pep talk?",
      "Hey! I'm Mind Mate, your study buddy. What can I help you with today?"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // How are you / feelings
  if (/how are you|how'?s it going|how do you feel/.test(lower)) {
    return "I'm doing great, thanks for asking! More importantly — how are **you** doing? If something's on your mind, I'm all ears.";
  }

  // Stress / overwhelmed
  if (/stress|overwhelm|anxious|anxiety|too much|can'?t cope|burned out|burnout|exhausted/.test(lower)) {
    return "That sounds really tough, and it's okay to feel that way. Here are a few things that might help: **1)** Write down the 3 most urgent tasks and focus only on those. **2)** Take a 10-minute walk or stretch break. **3)** Try the Pomodoro technique — 25 min work, 5 min rest. You've got this!";
  }

  // Study help
  if (/study|exam|test|midterm|final|revision|review|prepare|preparation/.test(lower)) {
    return "Great that you're thinking about studying! Here are some tips: **1)** Break your material into smaller chunks. **2)** Use active recall — quiz yourself instead of re-reading. **3)** Space out your sessions over days, not all-nighters. **4)** Teach the material to someone (or even to yourself out loud). What subject are you working on?";
  }

  // Procrastination
  if (/procrastinat|lazy|can'?t start|don'?t feel like|unmotivated|no motivation|putting off/.test(lower)) {
    return "Procrastination is super common — you're not alone! Try the **2-minute rule**: commit to working for just 2 minutes. Once you start, momentum usually kicks in. Also, break your task into the smallest possible first step. What's the task you're avoiding?";
  }

  // Time management
  if (/time manage|schedule|planning|organize|too busy|no time|deadline/.test(lower)) {
    return "Time management is a skill — here's a quick framework: **1)** List everything due this week. **2)** Prioritize: what's urgent AND important? **3)** Block 2-3 focused hours for deep work. **4)** Use your Tasks page to track deadlines! Would you like help planning your week?";
  }

  // Sleep
  if (/sleep|tired|insomnia|can'?t sleep|late night|all.?nighter/.test(lower)) {
    return "Sleep is crucial for memory and focus. Try to: **1)** Set a consistent bedtime (even on weekends). **2)** Stop screens 30 min before bed. **3)** Avoid caffeine after 2 PM. **4)** If your mind races, write tomorrow's to-do list before bed — it helps clear your head.";
  }

  // GPA / grades
  if (/gpa|grade|cgpa|marks|score|failing|pass|credit/.test(lower)) {
    return "Check out your **GPA Tracker** page — it calculates your cumulative GPA across all semesters. You can also use the **What-If Scenario** to see how improving a specific course would affect your overall GPA. Want to talk strategy for a specific course?";
  }

  // Thanks
  if (/thank|thanks|thx|appreciate/.test(lower)) {
    return "You're welcome! I'm always here when you need a study buddy or just want to check in. Keep up the great work!";
  }

  // Mood-aware responses based on detected emotion
  if (mood === "awful") {
    return "It sounds like things are really hard right now, and that's okay to admit. You don't have to push through alone. Is there something specific that's weighing on you — an assignment, something personal, or just feeling completely drained?";
  }
  if (mood === "bad") {
    return "Sounds like you're going through a rough patch. That happens to everyone, especially during busy university periods. Want to talk about what's going on, or would some practical tips to get through the day help more?";
  }
  if (mood === "great" || mood === "good") {
    return "Love the energy! Sounds like things are going well. Want to use that momentum? It's a great time to tackle something you've been putting off or plan ahead for the week. What's on your plate?";
  }

  // Default helpful response
  const defaults = [
    "I'm here to help! I can chat about study strategies, time management, stress relief, or goal setting. What's on your mind?",
    "That's a great question! I'm best at helping with academic planning, study tips, and wellness check-ins. What would be most helpful right now?",
    "I'd love to help! Try asking me about study techniques, managing deadlines, dealing with stress, or how to improve your GPA."
  ];
  return defaults[Math.floor(Math.random() * defaults.length)];
}

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const uid = await verifyAuth(req, res);
  if (!uid) return;
  if (!checkRateLimit(uid)) return res.status(429).json({ error: "Rate limit exceeded. You can make 20 AI requests per hour." });

  const { message, history = [], userContext = {} } = req.body;
  if (!message || typeof message !== "string") return res.status(400).json({ error: "message is required" });
  if (message.trim().length > 2000) return res.status(400).json({ error: "Message too long (max 2000 characters)" });

  if (detectCrisis(message)) {
    return res.json({ reply: CRISIS_RESPONSE, crisisFlag: true, resources: CRISIS_RESOURCES });
  }

  // Gather user context from DB
  let context = Object.assign({}, userContext);
  try {
    if (!context.moodLabel) {
      const db = admin.database();
      const journalsSnap = await db.ref(`users/${uid}/journals`).limitToLast(1).once("value");
      journalsSnap.forEach(child => {
        const j = child.val();
        context.moodLabel = j.moodLabel || j.mood || "okay";
        context.moodScore = j.moodScore || 0.5;
      });
    }
  } catch { /* DB read failed, continue with defaults */ }

  // Detect mood from the user's current message using fine-tuned model
  const hfApiKey = process.env.HF_API_KEY;
  const detectedMood = await detectMoodFromMessage(message, hfApiKey);
  if (detectedMood) {
    context.messageMoodLabel = detectedMood.mood;
    context.messageMoodScore = detectedMood.score;
  }

  // Try HF API first, fall back to local replies
  if (hfApiKey) {
    try {
      const systemPrompt = buildSystemPrompt(context);
      const messages = [
        { role: "system", content: systemPrompt },
        ...history.slice(-10),
        { role: "user", content: message }
      ];

      const response = await fetch(
        "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3",
        {
          method: "POST",
          headers: { "Authorization": `Bearer ${hfApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            inputs: formatMessagesForMistral(messages),
            parameters: { max_new_tokens: 300, temperature: 0.7, return_full_text: false }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        let reply = (data && data[0] && data[0].generated_text && data[0].generated_text.trim()) || "";
        reply = reply.replace(/^\[\/INST\]\s*/i, "").trim();
        if (reply) return res.json({ reply, crisisFlag: false });
      }
      // If HF failed, fall through to local reply
    } catch (err) {
      console.error("HF API error (falling back to local):", err.message);
    }
  }

  // Local smart fallback — always works
  const reply = localReply(message, context);
  return res.json({ reply, crisisFlag: false });
};
