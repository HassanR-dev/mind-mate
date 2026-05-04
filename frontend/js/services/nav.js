import { logout, getCurrentUser } from "./auth.service.js";
import { showToast } from "./toast.js";
import { listenToUserData } from "./db.service.js";
import { THEMES, applyTheme, loadTheme, getCurrentThemeId } from "./theme.service.js";

const NAV_ITEMS = [
  { href: "dashboard.html",       icon: "dashboard",       label: "Dashboard",       page: "dashboard" },
  { href: "tasks.html",           icon: "check_box",       label: "Tasks",           page: "tasks" },
  { href: "gpa.html",             icon: "school",          label: "GPA Tracker",     page: "gpa" },
  { href: "journal.html",         icon: "mood",            label: "Mood Journal",    page: "journal" },
  { href: "insights.html",        icon: "insights",        label: "Insights",        page: "insights" },
  { href: "stress-reliever.html", icon: "sentiment_calm",  label: "Stress Reliever", page: "stress" },
  { href: "user-profile.html",    icon: "person",          label: "Profile",         page: "profile" },
];

// ── Desktop sidebar (injected into #nav-sidebar placeholder) ─────────────
function injectDesktopNav(activePage) {
  const container = document.getElementById("nav-sidebar");
  if (!container) return;

  const links = NAV_ITEMS.map(n => {
    const isActive = n.page === activePage;
    const cls = isActive
      ? "bg-primary text-background-dark font-medium"
      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium";
    const fill = isActive ? " fill-1" : "";
    return `<a class="flex items-center gap-3 px-4 py-3 rounded-xl ${cls} transition-colors" href="${n.href}">
      <span class="material-symbols-outlined${fill}">${n.icon}</span>${n.label}</a>`;
  }).join("");

  container.innerHTML = `
    <aside class="hidden md:flex w-64 flex-col bg-surface-light dark:bg-surface-dark border-r border-gray-200 dark:border-gray-800 h-full flex-shrink-0 z-20">
      <div class="p-6">
        <div class="flex items-center gap-3 mb-8">
          <div class="size-8 bg-primary rounded-lg flex items-center justify-center text-background-dark">
            <span class="material-symbols-outlined">school</span>
          </div>
          <div>
            <h1 class="font-bold text-lg leading-tight">Mind Mate</h1>
            <p class="text-xs text-gray-500 dark:text-gray-400">Student Companion</p>
          </div>
        </div>
        <nav class="flex flex-col gap-2">${links}</nav>
      </div>
      <div class="mt-auto p-6 border-t border-gray-200 dark:border-gray-800">
        <div class="flex items-center gap-3">
          <div class="size-10 rounded-full bg-cover bg-center" role="img" aria-label="User avatar" style="background-image: url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23283930%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 dy=%22.1em%22 font-size=%2240%22 fill=%22%2313ec80%22 font-family=%22sans-serif%22>MM</text></svg>')"></div>
          <div class="flex-1 min-w-0">
            <p class="font-medium truncate" data-user-name>Student</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate" data-user-email></p>
          </div>
          <a href="user-profile.html" class="text-gray-400 hover:text-white" aria-label="Settings">
            <span class="material-symbols-outlined">settings</span>
          </a>
        </div>
        <button data-action="logout" class="mt-2 flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors w-full">
          <span class="material-symbols-outlined">logout</span>
          <span class="text-sm font-medium">Log Out</span>
        </button>
      </div>
    </aside>`;
}

// ── Mobile nav overlay ───────────────────────────────────────────────────
function injectMobileNav(activePage) {
  if (document.getElementById("mobile-nav-overlay")) return;

  const links = NAV_ITEMS.map(n => {
    const active = n.page === activePage;
    const cls = active
      ? "bg-primary text-black font-bold"
      : "text-white/80 hover:bg-white/10";
    return `<a href="${n.href}" class="flex items-center gap-3 px-4 py-3 rounded-xl ${cls} transition-colors">
      <span class="material-symbols-outlined">${n.icon}</span>${n.label}</a>`;
  }).join("");

  const overlay = document.createElement("div");
  overlay.id = "mobile-nav-overlay";
  overlay.className = "hidden fixed inset-0 z-[100] md:hidden";
  overlay.innerHTML = `
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" data-close></div>
    <nav class="absolute left-0 top-0 bottom-0 w-72 bg-[#111814] p-6 flex flex-col gap-2 overflow-y-auto shadow-2xl animate-[slideIn_0.2s_ease]">
      <div class="flex items-center justify-between mb-6">
        <span class="font-bold text-lg text-white">Mind Mate</span>
        <button type="button" data-close class="text-slate-400 hover:text-white"><span class="material-symbols-outlined">close</span></button>
      </div>
      ${links}
      <div class="mt-auto pt-4 border-t border-white/10">
        <button data-action="logout" class="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 w-full transition-colors">
          <span class="material-symbols-outlined">logout</span>Log Out
        </button>
      </div>
    </nav>`;
  document.body.appendChild(overlay);

  if (!document.getElementById("mobile-nav-style")) {
    const style = document.createElement("style");
    style.id = "mobile-nav-style";
    style.textContent = "@keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}";
    document.head.appendChild(style);
  }

  overlay.querySelectorAll("[data-close]").forEach(el =>
    el.addEventListener("click", () => overlay.classList.add("hidden"))
  );
  document.addEventListener("keydown", e => { if (e.key === "Escape") overlay.classList.add("hidden"); });

  document.querySelectorAll("button").forEach(btn => {
    const icon = btn.querySelector(".material-symbols-outlined");
    if (icon && icon.textContent.trim() === "menu") {
      btn.addEventListener("click", () => overlay.classList.remove("hidden"));
    }
  });
}

// ── Theme picker (injected into desktop sidebar bottom) ──────────────────
function injectThemePicker() {
  const sidebar = document.querySelector('#nav-sidebar aside');
  if (!sidebar) return;

  const bottomSection = sidebar.querySelector('.mt-auto');
  if (!bottomSection) return;

  const logoutBtn = bottomSection.querySelector('[data-action="logout"]');
  if (!logoutBtn) return;

  const currentId = getCurrentThemeId();

  const wrapper = document.createElement('div');
  wrapper.id = 'mm-theme-picker';
  wrapper.style.cssText = 'padding: 4px 8px 8px; display: flex; flex-direction: column; gap: 6px;';
  wrapper.innerHTML = `
    <span style="font-size:10px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color: var(--th-text-sec, #9db9ab);">Theme</span>
    <div id="mm-swatches" style="display:flex; gap:8px; align-items:center;"></div>
  `;

  logoutBtn.parentNode.insertBefore(wrapper, logoutBtn);

  const container = wrapper.querySelector('#mm-swatches');
  THEMES.forEach(theme => {
    const btn = document.createElement('button');
    btn.title = `${theme.name} — ${theme.desc}`;
    btn.setAttribute('aria-label', theme.name);
    const isActive = currentId === theme.id;
    btn.style.cssText = `
      width: 24px; height: 24px;
      border-radius: 50%;
      background: conic-gradient(${theme.bg} 0 50%, ${theme.accent} 50% 100%);
      border: 2.5px solid ${isActive ? theme.accent : 'transparent'};
      outline: ${isActive ? `2px solid ${theme.accent}` : 'none'};
      outline-offset: 1px;
      cursor: pointer;
      transition: transform 0.15s ease, border-color 0.15s, outline 0.15s;
      flex-shrink: 0;
    `;
    btn.addEventListener('mouseenter', () => { btn.style.transform = 'scale(1.25)'; });
    btn.addEventListener('mouseleave', () => { btn.style.transform = 'scale(1)'; });
    btn.addEventListener('click', () => {
      applyTheme(theme.id);
      container.querySelectorAll('button').forEach((b, i) => {
        const t = THEMES[i];
        const active = t.id === theme.id;
        b.style.borderColor = active ? t.accent : 'transparent';
        b.style.outline = active ? `2px solid ${t.accent}` : 'none';
      });
    });
    container.appendChild(btn);
  });
}

// ── Main init (called once per page) ─────────────────────────────────────
export async function initNav(activePage) {
  loadTheme();

  // Inject both navs from canonical NAV_ITEMS
  injectDesktopNav(activePage);
  injectMobileNav(activePage);

  // Wire all logout buttons (desktop + mobile)
  document.querySelectorAll("[data-action='logout']").forEach(btn =>
    btn.addEventListener("click", () => logout())
  );

  // Wire notification buttons
  document.querySelectorAll("button").forEach(btn => {
    const icon = btn.querySelector(".material-symbols-outlined");
    if (icon && icon.textContent.trim() === "notifications") {
      btn.addEventListener("click", () => showToast("Notifications coming soon!", "info"));
    }
  });

  // Theme picker
  injectThemePicker();

  // Update user info
  const user = await getCurrentUser();
  if (user) {
    const name = user.displayName || user.email?.split("@")[0] || "Student";
    document.querySelectorAll("[data-user-name]").forEach(el => { el.textContent = name; });
    document.querySelectorAll("[data-user-email]").forEach(el => { el.textContent = user.email || ""; });

    listenToUserData("profile/photoURL", snap => {
      const url = snap;
      const photoUrl = (url && typeof url === "string" && url.startsWith("data:")) ? url : user.photoURL;
      if (photoUrl) {
        document.querySelectorAll("[role='img'][aria-label*='avatar']").forEach(el => {
          el.style.backgroundImage = `url("${photoUrl}")`;
        });
      }
    });
  }
}
