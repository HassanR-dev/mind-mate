const { cors } = require("./_lib/cors");
const { verifyAuth } = require("./_lib/auth");
const { checkRateLimit } = require("./_lib/rateLimit");

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const uid = await verifyAuth(req, res);
  if (!uid) return;
  if (!checkRateLimit(uid)) return res.status(429).json({ error: "Rate limit exceeded. You can make 20 AI requests per hour." });

  const { text } = req.body;
  if (!text || typeof text !== "string") return res.status(400).json({ error: "text is required" });
  const trimmed = text.trim();
  if (trimmed.length < 20) return res.status(400).json({ error: "Journal entry must be at least 20 characters" });
  if (trimmed.length > 5000) return res.status(400).json({ error: "Journal entry must be under 5000 characters" });

  try {
    const hfApiKey = process.env.HF_API_KEY;
    if (!hfApiKey) return res.json({ moodLabel: "okay", moodScore: 0.5 });

    // Use fine-tuned MindMate model if set, otherwise fall back to generic model
    const modelUrl = process.env.HF_EMOTION_MODEL
      ? `https://api-inference.huggingface.co/models/${process.env.HF_EMOTION_MODEL}`
      : "https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment";

    const response = await fetch(modelUrl, {
      method: "POST",
      headers: { "Authorization": `Bearer ${hfApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ inputs: trimmed })
    });

    if (!response.ok) return res.json({ moodLabel: "okay", moodScore: 0.5 });

    const data = await response.json();
    const topResult = data && data[0] && data[0][0];
    if (!topResult) return res.json({ moodLabel: "okay", moodScore: 0.5 });

    const topLabel = topResult.label;
    const topScore = topResult.score || 0.5;

    // Fine-tuned model returns mood names directly: awful/bad/okay/good/great
    const FINE_TUNED_MOODS = ["awful", "bad", "okay", "good", "great"];
    let moodLabel;
    if (FINE_TUNED_MOODS.includes(topLabel)) {
      // Fine-tuned model — use label directly
      moodLabel = topLabel;
    } else {
      // Legacy generic model — LABEL_0=negative, LABEL_1=neutral, LABEL_2=positive
      if (topLabel === "LABEL_2") moodLabel = "good";
      else if (topLabel === "LABEL_0") moodLabel = "bad";
      else moodLabel = "okay";
    }

    return res.json({ moodLabel, moodScore: parseFloat(topScore.toFixed(3)) });
  } catch (err) {
    console.error("analyzeMood error:", err);
    return res.json({ moodLabel: "okay", moodScore: 0.5 });
  }
};
