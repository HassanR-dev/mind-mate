import { logout, getCurrentUser } from "./auth.service.js";

const NAV_ITEMS = [
  { href: "dashboard.html",    icon: "dashboard",   label: "Dashboard" },
  { href: "tasks.html",        icon: "check_box",   label: "Tasks" },
  { href: "gpa.html",          icon: "school",      label: "GPA Tracker" },
  { href: "journal.html",      icon: "mood",        label: "Mood Journal" },
  { href: "insights.html",     icon: "insights",    label: "Insights" },
];

export async function initNav(activePage) {
  // Wire all logout buttons
  document.querySelectorAll("[data-action='logout']").forEach(btn =>
    btn.addEventListener("click", () => logout())
  );

  // Update user name everywhere
  const user = await getCurrentUser();
  if (user) {
    const name = user.displayName || user.email?.split("@")[0] || "Student";
    document.querySelectorAll("[data-user-name]").forEach(el => { el.textContent = name; });
    document.querySelectorAll("[data-user-email]").forEach(el => { el.textContent = user.email || ""; });
  }

  // Mobile hamburger toggle
  const btn = document.getElementById("mobile-menu-btn");
  const overlay = document.getElementById("mobile-nav-overlay");
  if (btn && overlay) {
    btn.addEventListener("click", () => overlay.classList.toggle("hidden"));
    overlay.addEventListener("click", e => { if (e.target === overlay) overlay.classList.add("hidden"); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") overlay.classList.add("hidden"); });
  }
}
