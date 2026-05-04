// Inject animation styles once
if (!document.getElementById("toast-styles")) {
  const style = document.createElement("style");
  style.id = "toast-styles";
  style.textContent = `
    @keyframes mmSlideIn { from { transform: translateX(110%); opacity:0 } to { transform: translateX(0); opacity:1 } }
    #toast-container * { box-sizing: border-box; }
  `;
  document.head.appendChild(style);
}

// Escape HTML special characters to prevent XSS
function _esc(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text || '').replace(/[&<>"']/g, m => map[m]);
}

let _container = null;
function getContainer() {
  if (!_container) {
    _container = document.createElement("div");
    _container.id = "toast-container";
    _container.setAttribute("aria-live", "polite");
    _container.style.cssText =
      "position:fixed;top:1rem;right:1rem;z-index:9999;display:flex;flex-direction:column;gap:8px;max-width:360px;pointer-events:none;";
    document.body.appendChild(_container);
  }
  return _container;
}

const TYPES = {
  success: { bg: "#13ec80", color: "#102219", icon: "check_circle" },
  error:   { bg: "#e05a5a", color: "#fff",    icon: "error" },
  warning: { bg: "#F8B55F", color: "#102219", icon: "warning" },
  info:    { bg: "#1a2c24", color: "#e8f5ee", icon: "info", border: "1px solid rgba(19,236,128,0.3)" }
};

export function showToast(message, type = "info", duration = 4000) {
  const cfg = TYPES[type] || TYPES.info;
  const el = document.createElement("div");
  el.setAttribute("role", "status");
  el.style.cssText = `
    background:${cfg.bg};color:${cfg.color};padding:12px 16px;border-radius:12px;
    ${cfg.border ? `border:${cfg.border};` : ""}
    display:flex;align-items:center;gap:10px;
    font-family:'Lexend',sans-serif;font-size:14px;font-weight:500;
    box-shadow:0 4px 20px rgba(0,0,0,0.35);pointer-events:all;cursor:pointer;
    animation:mmSlideIn 0.2s ease;transition:opacity 0.3s;
  `;
  el.innerHTML = `
    <span class="material-symbols-outlined" style="font-size:20px;flex-shrink:0">${cfg.icon}</span>
    <span style="flex:1">${_esc(message)}</span>
    <span class="material-symbols-outlined" style="font-size:16px;opacity:0.6;flex-shrink:0">close</span>
  `;
  const dismiss = () => { clearTimeout(timer); el.style.opacity = "0"; setTimeout(() => el.remove(), 300); };
  el.onclick = dismiss;
  const timer = setTimeout(dismiss, duration);
  const container = getContainer();
  // Cap visible toasts at 4 to prevent stacking overflow
  const existing = container.querySelectorAll("div");
  if (existing.length >= 4) existing[0]?.remove();
  container.appendChild(el);
  return el;
}

export function showConfirm(message) {
  return new Promise(resolve => {
    const overlay = _overlay();
    const modal = document.createElement("div");
    modal.style.cssText = _modalStyle();
    modal.innerHTML = `
      <p style="font-size:15px;margin-bottom:20px;line-height:1.5;color:#e8f5ee">${_esc(message)}</p>
      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button id="mm-cancel" style="${_btnStyle("#283930","#9db9ab")}">Cancel</button>
        <button id="mm-ok"     style="${_btnStyle("#13ec80","#102219",true)}">Confirm</button>
      </div>`;
    overlay.appendChild(modal);
    modal.querySelector("#mm-ok").onclick     = () => { overlay.remove(); resolve(true); };
    modal.querySelector("#mm-cancel").onclick = () => { overlay.remove(); resolve(false); };
  });
}

export function showPrompt(message, defaultValue = "") {
  return new Promise(resolve => {
    const overlay = _overlay();
    const modal = document.createElement("div");
    modal.style.cssText = _modalStyle();
    modal.innerHTML = `
      <p style="font-size:15px;margin-bottom:12px;color:#e8f5ee">${_esc(message)}</p>
      <input id="mm-input" type="text" value="${_esc(defaultValue)}"
        style="width:100%;padding:10px 14px;border-radius:8px;background:#102219;
               border:1px solid rgba(19,236,128,0.3);color:#e8f5ee;font-family:inherit;
               font-size:14px;outline:none;box-sizing:border-box;margin-bottom:16px"/>
      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button id="mm-cancel" style="${_btnStyle("#283930","#9db9ab")}">Cancel</button>
        <button id="mm-ok"     style="${_btnStyle("#13ec80","#102219",true)}">OK</button>
      </div>`;
    overlay.appendChild(modal);
    const input = modal.querySelector("#mm-input");
    input.focus();
    input.onkeypress = e => { if (e.key === "Enter") { overlay.remove(); resolve(input.value); } };
    modal.querySelector("#mm-ok").onclick     = () => { overlay.remove(); resolve(input.value); };
    modal.querySelector("#mm-cancel").onclick = () => { overlay.remove(); resolve(null); };
  });
}

function _overlay() {
  const el = document.createElement("div");
  el.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:10000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)";
  document.body.appendChild(el);
  return el;
}
function _modalStyle() {
  return "background:#1a2c24;border:1px solid rgba(19,236,128,0.2);border-radius:16px;padding:24px;max-width:380px;width:90%;font-family:'Lexend',sans-serif";
}
function _btnStyle(bg, color, bold = false) {
  return `padding:8px 20px;border-radius:8px;background:${bg};border:none;color:${color};cursor:pointer;font-family:inherit;font-size:14px;${bold ? "font-weight:700" : ""}`;
}
