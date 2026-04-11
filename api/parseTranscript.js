const { cors } = require("./_lib/cors");
const { verifyAuth } = require("./_lib/auth");
const { checkRateLimit } = require("./_lib/rateLimit");

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const uid = await verifyAuth(req, res);
  if (!uid) return;
  if (!checkRateLimit(uid))
    return res
      .status(429)
      .json({ error: "Rate limit exceeded. Try again later." });

  const { pdfBase64 } = req.body;
  if (!pdfBase64 || typeof pdfBase64 !== "string")
    return res.status(400).json({ error: "pdfBase64 is required" });

  // Reject oversized payloads (~5 MB raw PDF → ~6.6 MB base64)
  if (pdfBase64.length > 7_000_000)
    return res
      .status(413)
      .json({ error: "File too large. Maximum PDF size is 5 MB." });

  try {
    // ── 1. Extract text from PDF ──────────────────────────────
    const pdfParse = require("pdf-parse");
    const pdfBuffer = Buffer.from(pdfBase64, "base64");
    const pdfData = await pdfParse(pdfBuffer);
    const text = (pdfData.text || "").trim();

    if (text.length < 30) {
      return res.status(400).json({
        error:
          "Could not extract readable text from this PDF. It may be a scanned image — only digitally-generated transcripts are supported.",
      });
    }

    // ── 2. Send to LLM for structured extraction ─────────────
    const hfApiKey = process.env.HF_API_KEY;
    if (!hfApiKey)
      return res
        .status(500)
        .json({ error: "AI service is not configured on the server." });

    const userPrompt = `Extract every course from the transcript below.
Return ONLY a valid JSON array — no markdown, no explanation, no extra text.

Each object MUST have exactly these fields:
  "courseName"  — full course name (string)
  "credits"     — credit hours (number, default 3 if unknown)
  "grade"       — letter grade: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, F (string)
  "semester"    — e.g. "Fall 2024", "Spring 2023", "Semester 5" (string, "Unknown" if unclear)

Transcript:
"""
${text.substring(0, 8000)}
"""

JSON array:`;

    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/Llama-3.1-8B-Instruct",
          messages: [
            {
              role: "system",
              content:
                "You are a precise data-extraction assistant. You read university transcripts and return ONLY a JSON array of course objects. Never include markdown fences, commentary, or explanation — just the raw JSON array.",
            },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 4000,
          temperature: 0.05, // near-deterministic for extraction
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error(
        "parseTranscript LLM error:",
        response.status,
        errText.slice(0, 300)
      );
      return res
        .status(502)
        .json({ error: "AI extraction failed. Please try again." });
    }

    const data = await response.json();
    let replyText = (data?.choices?.[0]?.message?.content || "").trim();

    // ── 3. Parse JSON from LLM response ──────────────────────
    let courses = [];
    try {
      // Strip markdown code fences if the model wrapped them
      replyText = replyText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "");
      const match = replyText.match(/\[[\s\S]*\]/);
      if (match) {
        courses = JSON.parse(match[0]);
      } else {
        courses = JSON.parse(replyText);
      }
    } catch (parseErr) {
      console.error(
        "parseTranscript JSON error:",
        parseErr.message,
        "\nRaw:",
        replyText.slice(0, 500)
      );
      return res.status(422).json({
        error:
          "Could not parse course data from the transcript. The format may be unsupported.",
      });
    }

    if (!Array.isArray(courses) || courses.length === 0) {
      return res.status(422).json({
        error: "No courses found in the transcript. Please check the PDF.",
      });
    }

    // ── 4. Validate & normalize each course ──────────────────
    const VALID_GRADES = [
      "A+", "A", "A-",
      "B+", "B", "B-",
      "C+", "C", "C-",
      "D+", "D", "D-",
      "F", "W", "I", "P", "NP",
    ];

    courses = courses
      .filter((c) => c && typeof c.courseName === "string" && c.courseName.trim())
      .map((c) => {
        let grade = String(c.grade || "").trim().toUpperCase();
        // Normalize common variants
        grade = grade.replace(/\s+/g, "");
        if (!VALID_GRADES.includes(grade)) grade = "N/A";

        return {
          courseName: String(c.courseName).trim().substring(0, 120),
          credits: Math.max(0.5, Math.min(parseFloat(c.credits) || 3, 30)),
          grade,
          semester: String(c.semester || "Unknown").trim().substring(0, 40),
        };
      });

    console.log(
      `parseTranscript: extracted ${courses.length} courses for uid=${uid}`
    );

    return res.json({
      courses,
      pageCount: pdfData.numpages || 0,
      textPreview: text.substring(0, 200) + "…",
    });
  } catch (err) {
    console.error("parseTranscript fatal:", err);
    return res.status(500).json({ error: "Failed to process transcript." });
  }
};
