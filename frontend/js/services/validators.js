export function validateJournalText(text) {
  if (!text || typeof text !== "string") return { valid: false, error: "Please write something." };
  const t = text.trim();
  if (t.length < 20)   return { valid: false, error: "Entry must be at least 20 characters." };
  if (t.length > 5000) return { valid: false, error: "Entry must be under 5000 characters." };
  return { valid: true, error: null };
}

export function validateTaskTitle(title) {
  if (!title || typeof title !== "string") return { valid: false, error: "Task title is required." };
  const t = title.trim();
  if (t.length === 0)  return { valid: false, error: "Task title cannot be empty." };
  if (t.length > 200)  return { valid: false, error: "Task title must be under 200 characters." };
  return { valid: true, error: null };
}

export function sanitizeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

export function formatDate(dateString) {
  if (!dateString) return "No date";
  try {
    return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" })
      .format(new Date(dateString));
  } catch { return dateString; }
}

export function formatDateTime(dateString) {
  if (!dateString) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
    }).format(new Date(dateString));
  } catch { return dateString; }
}

export function formatRelative(dateString) {
  if (!dateString) return "";
  try {
    const diffDays = Math.floor((Date.now() - new Date(dateString)) / 86400000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7)   return `${diffDays} days ago`;
    return formatDate(dateString);
  } catch { return dateString; }
}
