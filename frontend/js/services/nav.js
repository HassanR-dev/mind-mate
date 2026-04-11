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

function injectMobileNav(activePage) {
  if (document.getElementById("mobile-nav-overlay")) return;

  const links = NAV_ITEMS.map(n => {
    const active = n.page === activePage;
    const cls = active
      ? "bg-primary text-black font-bold"
      : "text-slate-300 hover:bg-white/10";
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
        <button data-close class="text-slate-400 hover:text-white"><span class="material-symbols-outlined">close</span></button>
      </div>
      ${links}
      <div class="mt-auto pt-4 border-t border-white/10">
        <button data-action="logout" class="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 w-full transition-colors">
          <span class="material-symbols-outlined">logout</span>Log Out
        </button>
      </div>
    </nav>`;
  document.body.appendChild(overlay);

  // Inject slide animation
  if (!document.getElementById("mobile-nav-style")) {
    const style = document.createElement("style");
    style.id = "mobile-nav-style";
    style.textContent = "@keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}";
    document.head.appendChild(style);
  }

  // Close handlers
  overlay.querySelectorAll("[data-close]").forEach(el =>
    el.addEventListener("click", () => overlay.classList.add("hidden"))
  );
  document.addEventListener("keydown", e => { if (e.key === "Escape") overlay.classList.add("hidden"); });

  // Wire hamburger buttons — any button with a menu icon in a mobile header
  document.querySelectorAll("button").forEach(btn => {
    const icon = btn.querySelector(".material-symbols-outlined");
    if (icon && icon.textContent.trim() === "menu") {
      btn.addEventListener("click", () => overlay.classList.remove("hidden"));
    }
  });
}

function injectThemePicker() {
  // Find sidebar bottom section (works across all page layouts)
  const sidebar = document.querySelector('.lg\\:flex.w-72, .hidden.lg\\:flex.w-72');
  if (!sidebar) return;

  const bottomSection = sidebar.children[sidebar.children.length - 1];
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

export async function initNav(activePage) {
  // Load saved theme first (before any render)
  loadTheme();

  // Inject mobile nav overlay
  injectMobileNav(activePage);

  // Wire all logout buttons
  document.querySelectorAll("[data-action='logout']").forEach(btn =>
    btn.addEventListener("click", () => logout())
  );

  // Wire all notification buttons (any button containing notifications icon)
  document.querySelectorAll("button").forEach(btn => {
    const icon = btn.querySelector(".material-symbols-outlined");
    if (icon && icon.textContent.trim() === "notifications") {
      btn.addEventListener("click", () => showToast("Notifications coming soon!", "info"));
    }
  });

  // Inject theme picker into sidebar
  injectThemePicker();

  // Update user name everywhere
  const user = await getCurrentUser();
  if (user) {
    const name = user.displayName || user.email?.split("@")[0] || "Student";
    document.querySelectorAll("[data-user-name]").forEach(el => { el.textContent = name; });
    document.querySelectorAll("[data-user-email]").forEach(el => { el.textContent = user.email || ""; });

    // Load and apply profile photo to all avatar elements
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
