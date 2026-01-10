# Mind Mate

A mental health and academic tracking application built with Firebase.

## Features

- 📊 **Dashboard** - Overview of tasks, GPA, and mood
- ✅ **Task Management** - Create, edit, and track tasks
- 📈 **GPA Tracker** - Monitor academic performance
- 🧠 **Mood Journal** - Track emotions with AI-powered sentiment analysis
- 📉 **Insights** - Visualize your academic and emotional patterns
- 👤 **User Profile** - Manage your account settings

## Setup

### 1. Firebase Setup

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase (if not already done):
   ```bash
   firebase init
   ```

### 2. Hugging Face API Key (Optional - for sentiment analysis)

1. Get your free API key from: https://huggingface.co/settings/tokens
2. Open `frontend/journal.html`
3. Find line 380 and replace `YOUR_HUGGINGFACE_API_KEY_HERE` with your actual API key

### 3. Deploy

Deploy to Firebase Hosting:
```bash
firebase deploy --only hosting
```

Your app will be live at: `https://mind-mate-ff2cf.web.app`

## Tech Stack

- **Frontend**: HTML, Tailwind CSS, Vanilla JavaScript
- **Backend**: Firebase (Authentication, Realtime Database)
- **AI**: Hugging Face API (Sentiment Analysis)

## Project Structure

```
mind-mate/
├── frontend/          # All frontend files
│   ├── *.html        # Page files
│   ├── auth.js       # Firebase authentication
│   ├── firebase-config.js  # Firebase configuration
│   └── styles.css    # External stylesheet
├── firebase.json     # Firebase configuration
└── README.md         # This file
```