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

    // Use fine-tuned MindMate model if set AND it has live inference,
    // otherwise use j-hartmann's 7-emotion model (production-ready, hosted)
    const modelUrl = process.env.HF_EMOTION_MODEL
      ? `https://router.huggingface.co/hf-inference/models/${process.env.HF_EMOTION_MODEL}`
      : "https://router.huggingface.co/hf-inference/models/j-hartmann/emotion-english-distilroberta-base";

    const response = await fetch(modelUrl, {
      method: "POST",
      headers: { "Authorization": `Bearer ${hfApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ inputs: trimmed })
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("analyzeMood HF error:", response.status, errText.slice(0, 200));
      return res.json({ moodLabel: "okay", moodScore: 0.5 });
    }

    const data = await response.json();
    console.log("analyzeMood HF raw:", JSON.stringify(data).slice(0, 300));

    // HF text-classification may return [[{label,score},...]] OR [{label,score},...]
    let results = Array.isArray(data) ? data : [];
    if (results.length && Array.isArray(results[0])) results = results[0];
    if (!results.length) return res.json({ moodLabel: "okay", moodScore: 0.5 });

    // Get top prediction (highest score)
    const topResult = [...results].sort((a, b) => (b.score || 0) - (a.score || 0))[0];
    if (!topResult || !topResult.label) return res.json({ moodLabel: "okay", moodScore: 0.5 });

    const topLabel = topResult.label;
    const topScore = topResult.score || 0.5;

    // Map model output to Mind Mate's 5 mood levels
    // Supports: fine-tuned (awful/bad/okay/good/great), j-hartmann (7 emotions), and legacy LABEL_*
    const FINE_TUNED_MOODS = ["awful", "bad", "okay", "good", "great"];
    const J_HARTMANN_MAP = {
      joy:      "great",
      surprise: "good",
      neutral:  "okay",
      fear:     "bad",
      disgust:  "bad",
      sadness:  "awful",
      anger:    "awful"
    };
    let moodLabel;
    const lowerLabel = String(topLabel).toLowerCase();
    if (FINE_TUNED_MOODS.includes(lowerLabel)) {
      moodLabel = lowerLabel;
    } else if (J_HARTMANN_MAP[lowerLabel]) {
      moodLabel = J_HARTMANN_MAP[lowerLabel];
    } else if (topLabel === "LABEL_2") {
      moodLabel = "good";
    } else if (topLabel === "LABEL_0") {
      moodLabel = "bad";
    } else {
      moodLabel = "okay";
    }

    return res.json({ moodLabel, moodScore: parseFloat(topScore.toFixed(3)) });
  } catch (err) {
    console.error("analyzeMood error:", err);
    return res.json({ moodLabel: "okay", moodScore: 0.5 });
  }
};
