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

  try {
    const hfApiKey = process.env.HF_API_KEY;
    if (!hfApiKey) return res.json({ reply: "I'm having trouble connecting right now. Please try again in a moment.", crisisFlag: false });

    let context = Object.assign({}, userContext);
    if (!context.moodLabel) {
      const db = admin.database();
      const journalsSnap = await db.ref(`users/${uid}/journals`).limitToLast(1).once("value");
      journalsSnap.forEach(child => {
        const j = child.val();
        context.moodLabel = j.moodLabel || j.mood || "neutral";
        context.moodScore = j.moodScore || 0.5;
      });
    }

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

    if (!response.ok) return res.json({ reply: "I'm a bit overwhelmed right now. Could you try again in a moment?", crisisFlag: false });

    const data = await response.json();
    let reply = (data && data[0] && data[0].generated_text && data[0].generated_text.trim()) || "I didn't catch that. Could you rephrase?";
    reply = reply.replace(/^\[\/INST\]\s*/i, "").trim();

    return res.json({ reply, crisisFlag: false });
  } catch (err) {
    console.error("chat error:", err);
    return res.json({ reply: "I'm having a moment. Let's try again shortly.", crisisFlag: false });
  }
};
