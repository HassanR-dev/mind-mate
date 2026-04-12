# Mind Mate — Project Tasks

**Project:** FYP Student Wellness App  
**Timeline:** ~3 weeks to submission  
**Team:** Claude (Backend/Logic), Antigravity (UI/UX), User (PM)

---

## Status: Merged ✅

Both branches merged into `main` on 2026-04-12.  
- Claude's worktree (`claude/magical-wu`) → merged with `-X theirs`  
- Antigravity's UI polish → committed as `816820d`  
- Merge commit: `04bb8fa`

**Live URLs:**
- Frontend: https://mind-mate-ff2cf.web.app
- API: https://magical-wu-rho.vercel.app

---

## ✅ Completed

### Backend & Features (Claude)
- [x] Firebase RTDB schema (users, gpas, journals, tasks, analytics)
- [x] Auth (Firebase Auth + ID token verification)
- [x] `/api/analyzeMood` — j-hartmann emotion model via HF
- [x] `/api/predictStress` — mood trends + task analysis
- [x] `/api/chat` — Llama 3.1 8B with full context + crisis detection
- [x] `/api/analytics` — weekly mood/stress/task stats
- [x] `/api/parseTranscript` — PDF text extraction + LLM course extraction
- [x] Multi-select delete on GPA page (checkboxes + bulk delete)
- [x] Theme system (4 themes: Dark Forest, Dark Midnight, Light Cloud, Light Amber)
- [x] Theme CSS overrides (~400 lines covering all hardcoded Tailwind colors)
- [x] Stress Reliever page (bean mascot animation)

### Frontend & UI (Antigravity)
- [x] Swap alert()/prompt() to showToast()/showFormModal()
- [x] Add empty states (illustrations + CTAs)
- [x] UI polish — micro-animations, hover transitions
- [x] Responsive fine-tuning
- [x] Accessibility pass (ARIA labels, keyboard nav, focus indicators)
- [x] UX audit report

---

## 🔄 In Progress

### Claude — Backend Tasks
- [x] Forgotten password flow (Firebase Auth `sendPasswordResetEmail`) — already working
- [x] Email verification flow — sends on signup, banner on dashboard, status on profile
- [x] Data export (JSON + CSV) — full user data download on profile page
- [x] Account deletion — double-confirm, deletes RTDB data + Auth account

### Antigravity — UI Tasks
- [x] Micro-animations (fade-in, slide-up, card hover lift, nav stagger, button press)
- [x] Accessibility: focus-visible indicators, skip-to-content link, ARIA landmarks, sr-only utility
- [x] Mobile nav panel CSS (slide-over with backdrop blur)
- [x] Reduced motion support (@prefers-reduced-motion)
- [x] Skeleton loading class (.mm-skeleton)
- [x] Mobile responsiveness final pass (all pages audited)
- [x] Theme testing (CSS variable overrides confirmed across all 4 themes)

---

## ⏳ Pending

### High Priority
- [ ] Test transcript parsing with real student PDF
- [ ] Verify chatbot context gathering end-to-end
- [ ] Test all themes across all pages
- [ ] Fix dynamic content theme leaks (JS-generated HTML)

### Medium Priority
- [ ] Transcript source badge in GPA table
- [ ] Error handling & retry logic
- [ ] Loading spinners for long tasks

### Low Priority
- [ ] Dark/light theme transition animations
- [ ] Analytics dashboard visualizations
- [ ] Documentation (README, API docs)

---

## 📝 Coordination Notes

- **Both AIs now on `main` branch** — no more worktree
- **Conflict prevention:** Tell the other AI what files you changed
- **Deploy commands:**
  - Firebase: `npx firebase deploy --only hosting`
  - Vercel: `npx vercel --prod --yes`
- **Key shared files:** `frontend/gpa.html`, `frontend/styles.css`, `frontend/js/services/nav.js`

### Latest Antigravity Changes (2026-04-12):

**UX Audit Bug Fixes (42 issues found, top fixes applied):**
- **C1 FIXED** `login.html` — Fixed unclosed `<div>` tag on right visual panel
- **C2 FIXED** `auth.service.js` — `authGuard()` now returns a proper Promise
- **C3 FIXED** `dashboard.html` — Mood card now handles all 5 new mood names + 3 legacy
- **C4 FIXED** Deleted orphaned `ui.js` (dead code, crash risk)
- **C5 FIXED** `login.html` — Replaced undefined `setButtonLoading` with inline loading states
- **H2 FIXED** `journal.html` — Removed duplicate logout button from sidebar
- **H3 FIXED** `gpa.html` — Removed duplicate hamburger menu button
- **H5 FIXED** `tasks.html` — Replaced 4 sequential prompts with single "New Task" modal
- **H6 FIXED** `insights.html` — Made task/GPA trend indicators dynamic (no longer hardcoded)
- **H7 FIXED** `journal.html` — Added live character counter (20-5000 chars)
- **H8 FIXED** `login.html` — Replaced sequential signup prompts with single modal form
- **M2 FIXED** `dashboard.html` — Removed hardcoded +0.2 GPA badge (now dynamic)
- **M3 FIXED** `insights.html` — Added `role="img"` + `aria-label` to chart canvases
- **M4 FIXED** `dashboard.html` — Focus Mode button now visible on mobile
- **M5 FIXED** `user-profile.html` — Removed hardcoded personal info, empty placeholders
- **M7 FIXED** `toast.js` — Capped max visible toasts at 4
- **M13 FIXED** `tasks.html` — Due date now uses native date picker instead of text prompt
- **M14 FIXED** `insights.html` — Added empty state overlay on mood chart when no data
- **M15 FIXED** `insights.html` — Changed body from overflow-hidden to overflow-x-hidden
- **L1 FIXED** All pages — Added inline SVG favicon
- **L7 FIXED** `login.html` — Added `autocomplete` attributes to email/password inputs
- **L9 FIXED** `nav.js` — Mobile nav links changed from text-slate-300 to text-white/80
- **L10 FIXED** `user-profile.html` — Cancel button now reloads the page
- **L12 FIXED** `nav.js` — Added type="button" to close button

**Previous UI/UX work:**
- Micro-animations, accessibility, skip links, ARIA landmarks across all pages
- Theme system, mobile nav CSS, reduced motion support
