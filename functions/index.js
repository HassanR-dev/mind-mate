const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

admin.initializeApp();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const { verifyAuth } = require("./middleware/auth");
const { rateLimit } = require("./middleware/rateLimit");

const moodRouter = require("./routes/mood");
const stressRouter = require("./routes/stress");
const chatRouter = require("./routes/chat");

app.use("/analyzeMood", verifyAuth, rateLimit, moodRouter);
app.use("/predictStress", verifyAuth, rateLimit, stressRouter);
app.use("/chat", verifyAuth, rateLimit, chatRouter);

exports.api = functions.https.onRequest(app);

// Weekly analytics trigger: runs after every new journal entry
const { computeWeeklyAnalytics } = require("./routes/analytics");
exports.onJournalCreated = functions.database
  .ref("/users/{uid}/journals/{journalId}")
  .onCreate(computeWeeklyAnalytics);
