const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
const functions = require("firebase-functions");

router.post("/", async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "text is required" });
  }
  const trimmed = text.trim();
  if (trimmed.length < 20) {
    return res.status(400).json({ error: "Journal entry must be at least 20 characters" });
  }
  if (trimmed.length > 5000) {
    return res.status(400).json({ error: "Journal entry must be under 5000 characters" });
  }

  try {
    const hfApiKey = functions.config().hf && functions.config().hf.api_key;
    if (!hfApiKey) {
      return res.json({ moodLabel: "neutral", moodScore: 0.5 });
    }

    const response = await fetch(
      "https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hfApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: trimmed })
      }
    );

    if (!response.ok) {
      return res.json({ moodLabel: "neutral", moodScore: 0.5 });
    }

    const data = await response.json();
    const topLabel = data && data[0] && data[0][0] && data[0][0].label;
    const topScore = (data && data[0] && data[0][0] && data[0][0].score) || 0.5;

    let moodLabel = "neutral";
    if (topLabel === "LABEL_2") moodLabel = "positive";
    else if (topLabel === "LABEL_0") moodLabel = "negative";

    return res.json({ moodLabel, moodScore: parseFloat(topScore.toFixed(3)) });
  } catch (err) {
    console.error("analyzeMood error:", err);
    return res.json({ moodLabel: "neutral", moodScore: 0.5 });
  }
});

module.exports = router;
