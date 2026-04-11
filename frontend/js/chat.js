import { chat } from "./services/ai.service.js";
import { showToast } from "./services/toast.js";

const STORAGE_KEY = "mm_chat_history";
const CRISIS_KW = [
  "i want to die", "want to die", "kill myself", "end my life", "suicidal",
  "hurt myself", "don't want to be here", "no reason to live"
];

let history = [];

export function initChat() {
  const messagesEl = document.getElementById("chat-messages");
  const inputEl    = document.getElementById("chat-input");
  const sendBtn    = document.getElementById("chat-send");
  if (!messagesEl || !inputEl || !sendBtn) return;

  // Restore or show welcome
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) { history = JSON.parse(saved); _renderHistory(messagesEl); }
    else _renderWelcome(messagesEl);
  } catch { _renderWelcome(messagesEl); }

  // Quick suggestions
  document.querySelectorAll("[data-chat-suggestion]").forEach(btn =>
    btn.addEventListener("click", () => { inputEl.value = btn.dataset.chatSuggestion; _send(); })
  );

  sendBtn.addEventListener("click", _send);
  inputEl.addEventListener("keypress", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); _send(); } });

  async function _send() {
    const text = inputEl.value.trim();
    if (!text) return;

    _appendMsg(messagesEl, "user", text);
    history.push({ role: "user", content: text });
    inputEl.value = "";
    _scrollBottom(messagesEl);

    // Client-side crisis pre-check
    if (CRISIS_KW.some(kw => text.toLowerCase().includes(kw))) {
      _appendCrisis(messagesEl);
      _saveHistory();
      _scrollBottom(messagesEl);
      return;
    }

    const typing = _showTyping(messagesEl);
    sendBtn.disabled = true;
    try {
      const result = await chat(text, history.slice(-10));
      typing.remove();
      if (result.crisisFlag) {
        _appendCrisis(messagesEl);
      } else {
        _appendMsg(messagesEl, "assistant", result.reply);
        history.push({ role: "assistant", content: result.reply });
      }
      _saveHistory();
    } catch {
      typing.remove();
      _appendMsg(messagesEl, "assistant", "I'm having a moment — please try again shortly.");
      showToast("Could not reach AI service", "warning");
    } finally {
      sendBtn.disabled = false;
      _scrollBottom(messagesEl);
    }
  }
}

function _appendMsg(container, role, text) {
  const isUser = role === "user";
  const div = document.createElement("div");
  div.className = `flex gap-3${isUser ? " flex-row-reverse" : ""}`;
  const safe = _sanitize(text).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  div.innerHTML = isUser
    ? `<div class="flex flex-col gap-1 items-end max-w-[85%]">
         <div class="bg-primary p-3 rounded-2xl rounded-tr-none shadow-sm text-background-dark font-medium text-sm">
           <p class="leading-relaxed">${_sanitize(text)}</p>
         </div></div>`
    : `<div class="size-8 rounded-full bg-surface-dark border border-gray-700 flex items-center justify-center shrink-0 shadow-sm mt-1">
         <span class="material-symbols-outlined text-primary text-xs">smart_toy</span>
       </div>
       <div class="flex flex-col gap-1 max-w-[85%]">
         <div class="bg-white dark:bg-surface-dark p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-200 dark:border-gray-700 text-sm">
           <p class="leading-relaxed">${safe}</p>
         </div></div>`;
  container.appendChild(div);
}

function _appendCrisis(container) {
  const div = document.createElement("div");
  div.className = "flex gap-3";
  div.innerHTML = `
    <div class="size-8 rounded-full bg-surface-dark border border-gray-700 flex items-center justify-center shrink-0 shadow-sm mt-1">
      <span class="material-symbols-outlined text-primary text-xs">smart_toy</span>
    </div>
    <div class="max-w-[90%] p-4 rounded-2xl rounded-tl-none border border-red-500/30 bg-red-500/10" role="alert">
      <p class="text-sm font-bold text-red-400 mb-2">💛 You are not alone</p>
      <p class="text-sm text-slate-300 leading-relaxed mb-3">I'm really glad you shared that. Please reach out for real support:</p>
      <a href="sms:741741?body=HOME" class="block text-xs font-bold text-primary hover:underline mb-1">📱 Crisis Text Line — text HOME to 741741</a>
      <a href="https://www.iasp.info/resources/Crisis_Centres/" target="_blank" rel="noopener" class="block text-xs text-primary hover:underline">🌐 International Crisis Centers</a>
    </div>`;
  container.appendChild(div);
}

function _showTyping(container) {
  const div = document.createElement("div");
  div.className = "flex gap-3";
  div.innerHTML = `
    <div class="size-8 rounded-full bg-surface-dark border border-gray-700 flex items-center justify-center shrink-0 shadow-sm mt-1">
      <span class="material-symbols-outlined text-primary text-xs">smart_toy</span>
    </div>
    <div class="bg-white dark:bg-surface-dark p-3 rounded-2xl rounded-tl-none border border-gray-200 dark:border-gray-700">
      <div class="flex gap-1 items-center h-5">
        <span class="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style="animation-delay:0ms"></span>
        <span class="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style="animation-delay:150ms"></span>
        <span class="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style="animation-delay:300ms"></span>
      </div>
    </div>`;
  container.appendChild(div);
  return div;
}

function _renderWelcome(container) {
  container.innerHTML = `
    <div class="text-center">
      <span class="text-[10px] text-gray-400 bg-gray-100 dark:bg-background-dark px-2 py-0.5 rounded-full">Today</span>
    </div>
    <div class="flex gap-3">
      <div class="size-8 rounded-full bg-surface-dark border border-gray-700 flex items-center justify-center shrink-0 shadow-sm mt-1">
        <span class="material-symbols-outlined text-primary text-xs">smart_toy</span>
      </div>
      <div class="max-w-[85%] bg-white dark:bg-surface-dark p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-200 dark:border-gray-700 text-sm">
        <p class="leading-relaxed">Hi! I'm Mind Mate — your academic companion 😊 How are you feeling today? I can help with study plans, managing stress, and staying on track.</p>
      </div>
    </div>
    <p class="text-center text-[10px] text-gray-400 mt-2 px-4">Mind Mate is an academic companion, not a therapist. If you need urgent mental health support, please contact a professional.</p>`;
}

function _renderHistory(container) {
  container.innerHTML = "";
  history.forEach(msg => _appendMsg(container, msg.role, msg.content));
}

function _saveHistory() {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-20))); } catch {}
}

function _scrollBottom(container) {
  setTimeout(() => { container.scrollTop = container.scrollHeight; }, 50);
}

function _sanitize(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
