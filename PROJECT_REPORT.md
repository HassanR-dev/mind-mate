# Mind Mate — Project Report
### Student Wellness & Academic Companion Web Application
**Final Year Project (FYP) — Computer Science / AI**

---

## 1. Executive Summary

Mind Mate is an AI-powered student wellness and academic companion web application built as a Final Year Project. The system addresses the growing challenge of student burnout, academic stress, and poor mental health in university settings by combining academic performance tracking with emotional wellness monitoring through artificial intelligence.

The application enables students to track their GPA across semesters, maintain a mood journal with automatic emotion detection, manage tasks and deadlines, receive personalised AI chat support, predict stress levels based on behavioural patterns, and automatically import courses from university transcripts using document AI.

Mind Mate is a fully deployed, production-ready web application with a live frontend on Firebase Hosting and a serverless AI backend on Vercel.

---

## 2. Problem Statement

University students face an escalating mental health crisis. Studies consistently show that academic pressure, deadline anxiety, poor sleep, and isolation contribute to high rates of burnout, depression, and anxiety among university students. Most existing tools address either academic performance or wellness — not both together. Students lack a unified platform that:

- Tracks academic performance and predicts where they need to improve
- Monitors their emotional state over time using behavioural signals
- Provides immediate, context-aware AI support at any hour
- Gives actionable insight rather than passive data dashboards

Mind Mate bridges this gap with a data-driven, AI-assisted platform built specifically for university students.

---

## 3. Core Features

### 3.1 GPA Tracker
- Track courses, credits, and grades across multiple semesters
- Automatic Cumulative GPA (CGPA) calculation using weighted average
- Semester-based filtering with dynamic semester management
- What-If Scenario simulator: change a course grade hypothetically and see projected CGPA impact
- Impact Insight: identifies which course improvement would yield the highest GPA gain
- Multi-select bulk delete for managing large course lists
- CSV export of full academic report
- GPA trend chart visualising semester-by-semester performance

### 3.2 AI Transcript Parser
- Upload a university transcript PDF (up to 5 MB)
- The system extracts raw text using `pdf-parse` on the server
- Extracted text is sent to Meta's Llama 3.1 8B Instruct model via HuggingFace Router
- The LLM identifies all courses with their names, credit hours, letter grades, and semester labels
- A preview modal shows all extracted courses in an editable table
- Students can correct any misread field before importing
- One-click bulk import adds all selected courses to the GPA tracker
- Only works on digitally-generated PDFs (not scanned images), which covers most modern university transcripts

### 3.3 Mood Journal
- Daily journal entries with free-text input
- Automatic emotion detection using a fine-tuned `j-hartmann/emotion-english-distilroberta-base` model hosted on HuggingFace
- Emotion classification maps 7 primary emotions (joy, sadness, anger, fear, disgust, surprise, neutral) to 5 mood levels: awful, bad, okay, good, great
- Mood history visualised with colour-coded entries
- Journal streak tracking to encourage consistent emotional check-ins

### 3.4 AI Chat Companion (Mind Mate Bot)
- Conversational AI powered by Meta Llama 3.1 8B Instruct (accessed via HuggingFace Router with OpenAI-compatible API)
- Context-aware: before generating a response, the system fetches the student's live data from Firebase — their name, university, major, graduation year, CGPA, pending tasks, overdue deadlines, and most recent mood
- Personalised system prompt is dynamically constructed per-request using this real data
- Mood-adaptive tone: the chatbot's communication style changes based on detected student mood (extra gentle for distressed students, energetic for positive moods)
- Crisis detection: keyword matching for 15 crisis phrases triggers an immediate, pre-approved crisis response with emergency resources (Crisis Text Line: text HOME to 741741)
- Smart local fallback: if the HuggingFace API is unavailable, the chatbot uses a rule-based local reply engine covering common student scenarios (stress, procrastination, study tips, time management, sleep)
- Conversation history maintained client-side for multi-turn dialogue

### 3.5 Stress Predictor
- Automated stress level classification: Low, Moderate, or High
- Computed from three behavioural signals:
  1. **Mood trend**: 7-day rolling average of journal mood scores
  2. **Task pressure**: count of overdue tasks
  3. **GPA trajectory**: trend direction (improving, declining, or stable)
- Returns a stress score (0–1), dominant stress level, and contributing factors
- Used on the Insights page to display personalised wellness recommendations

### 3.6 Insights & Analytics
- Weekly analytics computation: mood averages, stress levels, task completion rates, journal streaks
- Analytics stored in Firebase RTDB for historical comparison
- Visualised on the Insights page with trend indicators
- Helps students understand patterns in their wellbeing over time

### 3.7 Task Manager
- Create, edit, complete, and delete tasks
- Due date assignment with overdue detection
- Tasks feed directly into the stress predictor and chatbot context

### 3.8 Stress Reliever
- Interactive bean mascot animation built as a browser-native canvas/CSS feature
- Tap counter with 4 cycling facial expressions
- Milestone badges awarded at tap thresholds
- Animated progress bar
- Designed as a quick mental break tool within the app

### 3.9 User Profile & Account Management
- Editable profile: display name, bio, university, major, graduation year
- Profile photo upload with client-side image resizing to 256×256 JPEG
- 4-theme appearance system (Dark Forest, Dark Midnight, Light Cloud, Light Amber) persisted in localStorage
- Email verification flow (sends verification email on signup, shows dashboard banner if unverified, resend available from profile)
- Complete data export in JSON format (full structured dump) and CSV format (flattened tables: courses, journal entries, tasks, account info)
- Account deletion: double-confirmation dialog, deletes all RTDB user data then removes Firebase Auth account

---

## 4. Technical Architecture

### 4.1 System Overview

```
[Browser] ──── HTTPS ────► [Firebase Hosting]
                               Frontend (HTML, CSS, JS)

[Browser] ──── HTTPS ────► [Vercel Serverless]
                               API Routes (Node.js)
                                  │
                                  ├──► [Firebase RTDB] (user data)
                                  ├──► [Firebase Auth] (identity)
                                  └──► [HuggingFace Router] (AI models)
```

Mind Mate uses a **static frontend + serverless backend** architecture:
- The frontend is a collection of HTML, CSS, and JavaScript files with no build step
- The backend consists of independent serverless functions deployed on Vercel
- All user data is stored in Firebase Realtime Database (RTDB)
- Authentication is handled by Firebase Auth with ID token verification on every API request
- AI inference is routed through HuggingFace's Inference Router

### 4.2 Frontend Stack

| Technology | Usage |
|---|---|
| HTML5 (7 pages) | Semantic markup for all app pages |
| Tailwind CSS (CDN) | Utility-first styling with dark mode support |
| Vanilla JavaScript (ES Modules) | All interactivity, no frontend framework |
| Firebase JS SDK v11 | Auth, Realtime Database client |
| CSS Custom Properties | Runtime theme switching |

**Pages:**
- `login.html` — Authentication (email/password, Google SSO, sign up, forgot password)
- `dashboard.html` — Overview with GPA widget, mood check-in, task summary, AI chat
- `gpa.html` — Full GPA tracker with transcript upload
- `journal.html` — Mood journal with emotion detection
- `tasks.html` — Task management
- `insights.html` — Analytics and wellness trends
- `stress-reliever.html` — Interactive bean mascot
- `user-profile.html` — Account settings, themes, data export

**Service Layer (`frontend/js/services/`):**

| File | Responsibility |
|---|---|
| `auth.service.js` | Firebase Auth state management, auth guard, logout |
| `db.service.js` | RTDB CRUD operations (`listenToUserData`, `pushUserData`, `updateUserData`, `removeUserData`, `getUserData`) |
| `ai.service.js` | HTTP client for all Vercel API endpoints |
| `theme.service.js` | 4-theme system, localStorage persistence, Tailwind dark class management |
| `nav.js` | Sidebar navigation, theme picker injection, mobile nav panel |
| `toast.js` | Toast notification system, confirm dialogs, prompt modals |
| `loading.js` | Loading state utilities |
| `validators.js` | Form validation helpers |

### 4.3 Backend Stack

**Runtime:** Node.js on Vercel Serverless Functions

**API Endpoints (`api/`):**

| Endpoint | Method | Description |
|---|---|---|
| `/api/chat` | POST | AI chatbot with full user context |
| `/api/analyzeMood` | POST | Emotion detection from journal text |
| `/api/predictStress` | POST | Stress level classification |
| `/api/analytics` | POST | Weekly analytics computation and storage |
| `/api/parseTranscript` | POST | PDF transcript parsing with LLM extraction |

**Shared Library (`api/_lib/`):**

| File | Responsibility |
|---|---|
| `admin.js` | Firebase Admin SDK initialisation (singleton guard) |
| `auth.js` | Firebase ID token verification middleware |
| `cors.js` | CORS headers for cross-origin requests |
| `rateLimit.js` | In-memory rate limiter (20 requests/hour per user) |
| `prompts/system.js` | Dynamic system prompt builder for chatbot |

### 4.4 Database Schema (Firebase RTDB)

```
users/
  {uid}/
    profile/
      displayName: string
      bio: string
      university: string
      major: string
      graduationYear: string
      photoURL: string (base64 data URL)

    gpas/
      {courseId}/
        courseName: string
        credits: number
        gpa: number (0.0 – 4.0)
        semester: string (e.g. "Fall 2024")
        createdAt: ISO string
        source?: "transcript" | "manual"

    journals/
      {entryId}/
        text: string
        mood: string
        detectedMood: string (awful | bad | okay | good | great)
        moodScore: number (0–1)
        createdAt: ISO string

    tasks/
      {taskId}/
        title: string
        completed: boolean
        dueDate: ISO string
        createdAt: ISO string

    analytics/
      weekly/
        {weekKey}/
          avgMoodScore: number
          stressDominant: string
          tasksCompleted: number
          journalStreak: number

    preferences/
      moodReminder: boolean
      deadlineAlerts: boolean
      publicProfile: boolean
```

**Security Rules:** All data under `users/{uid}` is readable and writable only by the authenticated user with matching UID. All other paths are denied.

### 4.5 Authentication Flow

1. User signs in via email/password or Google SSO through Firebase Auth
2. On signup with email/password, a verification email is automatically sent
3. Every page runs `authGuard()` on load — redirects to login if no session
4. For all API calls, the client fetches a Firebase ID Token from the current session
5. Each API route calls `verifyAuth()` which validates the token against Firebase Admin SDK
6. The UID extracted from the verified token is used to scope all database operations

---

## 5. AI Components

### 5.1 Emotion Detection Model
- **Model:** `j-hartmann/emotion-english-distilroberta-base`
- **Provider:** HuggingFace Inference Router
- **Architecture:** DistilRoBERTa fine-tuned for 7-class emotion classification
- **Input:** Journal entry text (20–5,000 characters)
- **Output:** Probability scores across 7 emotions; top emotion mapped to 5 mood levels
- **Mapping:** joy→great, surprise→good, neutral→okay, fear/disgust→bad, sadness/anger→awful
- **Latency:** ~1–3 seconds per inference call
- **Fallback:** Returns `okay` with score 0.5 if the model is unavailable

### 5.2 AI Chat Model
- **Model:** `meta-llama/Llama-3.1-8B-Instruct`
- **Provider:** HuggingFace Router (OpenAI-compatible `/v1/chat/completions`)
- **Context window used:** Last 10 messages from conversation history
- **Max output tokens:** 300 per response
- **Temperature:** 0.7 (balanced creativity and coherence)
- **System prompt:** Dynamically built per-request with the student's real data
- **Fallback:** Local rule-based reply engine covering 8 topic categories

### 5.3 Transcript Parsing Pipeline
- **Step 1 — PDF Text Extraction:** `pdf-parse` (npm) extracts raw text from the uploaded PDF buffer
- **Step 2 — LLM Structured Extraction:** Llama 3.1 8B receives the extracted text with a structured prompt instructing it to return a JSON array of course objects
- **Step 3 — JSON Validation:** The API cleans, validates, and normalises the LLM's response
- **Output schema per course:** `{ courseName, credits, grade, semester }`
- **Supported grade formats:** A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F, W, I, P, NP
- **Limitation:** Requires digitally-generated PDFs (not scanned/image-based)

### 5.4 Stress Prediction Algorithm
The stress predictor is a deterministic scoring algorithm (not a trained ML model) that combines three signals:

```
moodScore = 7-day rolling average of journal moodScore (0–1)
taskPressure = overdueCount / max(totalTasks, 1) (0–1 capped)
gpaTrend = (declining → 0.8) | (stable → 0.5) | (improving → 0.2)

stressScore = (moodWeight × (1 - moodScore))
            + (taskWeight × taskPressure)
            + (gpaWeight × gpaTrend)

Classification:
  stressScore ≥ 0.6 → High
  stressScore ≥ 0.35 → Moderate
  stressScore < 0.35 → Low
```

---

## 6. Theme System

Mind Mate supports 4 themes switchable at runtime without a page reload:

| Theme | Mode | Background | Accent |
|---|---|---|---|
| Dark Forest (default) | Dark | `#111814` (deep green-black) | `#13ec80` (emerald) |
| Dark Midnight | Dark | `#0d1117` (GitHub dark) | `#38bdf8` (sky blue) |
| Light Cloud | Light | `#f8fafb` (off-white) | `#10b981` (green) |
| Light Amber | Light | `#fffbf0` (warm cream) | `#f59e0b` (amber) |

**Implementation:**
- CSS Custom Properties (18 colour tokens) defined per theme under `html[data-theme="X"]` selectors
- Tailwind `dark` class toggled on `<html>` for dark/light mode
- Arbitrary Tailwind value overrides (e.g. `bg-[#111814]`) covered by CSS `!important` overrides
- Theme choice persisted in `localStorage` under key `mm-theme`
- Applied immediately on every page via `loadTheme()` called from `initNav()`

---

## 7. Security Considerations

| Concern | Mitigation |
|---|---|
| Unauthorised data access | Firebase ID token verified on every API request; RTDB rules enforce UID-scoped access |
| Secret exposure | `.env.local` gitignored; environment variables set in Vercel dashboard, not in code |
| Rate abuse | In-memory rate limiter: 20 AI requests/hour per user |
| Oversized uploads | PDF payload rejected above 7 MB (base64); file input validated client-side |
| XSS | No `innerHTML` used for user-supplied content; all dynamic insertions use `.textContent` or safe string escaping |
| Sensitive data in URLs | All data sent via POST body, never in URL parameters |
| Account deletion | Double confirmation dialog; deletes RTDB data before Auth account |
| Secrets in git history | `.env.local` removed from git tracking; gitignore updated |

---

## 8. Deployment

| Layer | Platform | URL |
|---|---|---|
| Frontend | Firebase Hosting | `https://mind-mate-ff2cf.web.app` |
| API | Vercel Serverless | `https://magical-wu-rho.vercel.app` |
| Database | Firebase Realtime Database | Managed by Google |
| AI Models | HuggingFace Router | Managed by HuggingFace |

**Deploy commands:**
```bash
# Frontend
npx firebase deploy --only hosting

# API
npx vercel --prod --yes
```

---

## 9. Project Structure

```
mind-mate/
├── api/                          # Vercel serverless functions
│   ├── _lib/
│   │   ├── admin.js              # Firebase Admin SDK init
│   │   ├── auth.js               # Token verification middleware
│   │   ├── cors.js               # CORS middleware
│   │   ├── rateLimit.js          # Rate limiting
│   │   └── prompts/system.js     # Dynamic chatbot system prompt
│   ├── chat.js                   # AI chatbot endpoint
│   ├── analyzeMood.js            # Emotion detection endpoint
│   ├── predictStress.js          # Stress prediction endpoint
│   ├── analytics.js              # Weekly analytics endpoint
│   └── parseTranscript.js        # Transcript parsing endpoint
│
├── frontend/                     # Static web app (served by Firebase)
│   ├── js/
│   │   ├── services/
│   │   │   ├── auth.service.js
│   │   │   ├── db.service.js
│   │   │   ├── ai.service.js
│   │   │   ├── theme.service.js
│   │   │   ├── nav.js
│   │   │   ├── toast.js
│   │   │   ├── loading.js
│   │   │   └── validators.js
│   │   └── chat.js               # Chat UI logic
│   ├── dashboard.html
│   ├── gpa.html
│   ├── journal.html
│   ├── tasks.html
│   ├── insights.html
│   ├── stress-reliever.html
│   ├── user-profile.html
│   ├── login.html
│   ├── firebase-config.js
│   └── styles.css
│
├── database.rules.json           # Firebase RTDB security rules
├── firebase.json                 # Firebase project config
├── vercel.json                   # Vercel deployment config
├── package.json                  # Node dependencies (pdf-parse, firebase-admin)
└── TODO.md                       # Development task tracker
```

---

## 10. Key Design Decisions

**Why vanilla JS over React/Vue?**
The application is deployed on Firebase Hosting as static files. A build-free approach means faster iteration, no bundler configuration, and simpler deployment. ES Modules provide sufficient code organisation for this scale.

**Why Vercel for the API instead of Firebase Functions?**
Vercel has a more generous free tier for Node.js serverless functions, simpler deployment (`npx vercel --prod`), and better support for npm packages like `pdf-parse`. Firebase Functions were initially considered but abandoned.

**Why Firebase RTDB over Firestore?**
Real-time listeners (`onValue`) are a natural fit for the GPA tracker (live updates when a course is edited), task list, and journal. RTDB's simpler data model is sufficient for this use case.

**Why HuggingFace Router instead of direct model hosting?**
The Router provides free access to production-grade models (Llama 3.1, DistilRoBERTa) without managing GPU infrastructure. It uses the OpenAI-compatible API format, making it easy to swap models.

**Why pdf-parse over a cloud OCR service?**
Most university transcripts are digitally generated (not scanned), making text extraction straightforward. pdf-parse is a free npm package requiring no external API key. Cloud Vision/Textract would add cost and complexity for marginal benefit.

---

## 11. Limitations & Future Work

| Limitation | Potential Solution |
|---|---|
| Transcript parser only works on digital PDFs | Add OCR via Google Cloud Vision for scanned transcripts |
| Rate limit (20 AI requests/hour) uses in-memory storage — resets on function cold start | Use Redis or Firebase RTDB for persistent rate limiting |
| Stress predictor is rule-based, not ML | Train a classification model on labelled student stress data |
| No push notifications for deadlines | Integrate Firebase Cloud Messaging (FCM) |
| No native mobile app | Wrap in Capacitor or build a React Native version |
| Chat history not persisted across sessions | Store conversation history in RTDB |
| Emotion model not fine-tuned on student-specific language | Fine-tune on student journal entries with consent |

---

## 12. Summary Statistics

| Metric | Value |
|---|---|
| Total pages | 8 (including login) |
| API endpoints | 5 |
| Service modules | 8 |
| Themes | 4 (2 dark, 2 light) |
| AI models used | 2 (Llama 3.1 8B, DistilRoBERTa) |
| Database collections | 6 (profile, gpas, journals, tasks, analytics, preferences) |
| Lines of CSS (theme overrides) | ~400 |
| Total files in production | 38 |
| Frontend hosting | Firebase (free tier) |
| API hosting | Vercel (free tier) |
