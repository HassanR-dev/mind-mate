import { auth } from "./auth.js";
import { signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const TOAST_CONTAINER_ID = "toast-container";

function ensureToastContainer() {
  let container = document.getElementById(TOAST_CONTAINER_ID);
  if (!container) {
    container = document.createElement("div");
    container.id = TOAST_CONTAINER_ID;
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  return container;
}

export function showToast(message, type = "info", timeout = 3000) {
  const container = ensureToastContainer();
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  }, timeout);
}

export function setButtonLoading(button, isLoading, loadingText = "Loading...") {
  if (!button) return;
  if (isLoading) {
    if (!button.dataset.originalHtml) {
      button.dataset.originalHtml = button.innerHTML;
    }
    button.disabled = true;
    button.classList.add("is-loading");
    button.innerHTML = `<span class="spinner"></span><span>${loadingText}</span>`;
  } else {
    button.disabled = false;
    button.classList.remove("is-loading");
    if (button.dataset.originalHtml) {
      button.innerHTML = button.dataset.originalHtml;
      delete button.dataset.originalHtml;
    }
  }
}

export function attachLogout(target) {
  const buttons = typeof target === "string"
    ? document.querySelectorAll(target)
    : (target instanceof Element ? [target] : Array.from(target || []));

  if (!buttons.length) return;

  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await signOut(auth);
        window.location.href = "login.html";
      } catch (error) {
        showToast(`Logout failed: ${error.message}`, "error");
      }
    });
  });
}

export function initMobileNav({ button, panel, overlay, close }) {
  const menuButton = document.querySelector(button);
  const panelEl = document.querySelector(panel);
  const overlayEl = document.querySelector(overlay);
  const closeButton = document.querySelector(close);

  if (!menuButton || !panelEl || !overlayEl) return;

  const openNav = () => {
    panelEl.classList.add("open");
    overlayEl.classList.add("open");
    document.body.classList.add("mobile-nav-open");
  };

  const closeNav = () => {
    panelEl.classList.remove("open");
    overlayEl.classList.remove("open");
    document.body.classList.remove("mobile-nav-open");
  };

  menuButton.addEventListener("click", openNav);
  overlayEl.addEventListener("click", closeNav);
  if (closeButton) closeButton.addEventListener("click", closeNav);
}

function buildModal({ title, content, confirmText, cancelText }) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const modal = document.createElement("div");
  modal.className = "modal";

  modal.innerHTML = `
    <div class="modal-header">
      <h3>${title}</h3>
      <button class="modal-close" aria-label="Close">✕</button>
    </div>
    <div class="modal-body">${content}</div>
    <div class="modal-actions">
      <button class="modal-btn modal-cancel">${cancelText}</button>
      <button class="modal-btn modal-confirm">${confirmText}</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const cleanup = () => {
    overlay.classList.remove("open");
    overlay.addEventListener("transitionend", () => overlay.remove(), { once: true });
  };

  requestAnimationFrame(() => overlay.classList.add("open"));
  return { overlay, modal, cleanup };
}

export function showConfirm({
  title = "Confirm",
  message = "Are you sure?",
  confirmText = "Confirm",
  cancelText = "Cancel"
} = {}) {
  return new Promise((resolve) => {
    const { overlay, modal, cleanup } = buildModal({
      title,
      content: `<p>${message}</p>`,
      confirmText,
      cancelText
    });

    const confirmBtn = modal.querySelector(".modal-confirm");
    const cancelBtn = modal.querySelector(".modal-cancel");
    const closeBtn = modal.querySelector(".modal-close");

    const done = (result) => {
      cleanup();
      resolve(result);
    };

    confirmBtn.addEventListener("click", () => done(true));
    cancelBtn.addEventListener("click", () => done(false));
    closeBtn.addEventListener("click", () => done(false));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) done(false);
    });
  });
}

export function showFormModal({
  title = "Enter details",
  fields = [],
  confirmText = "Save",
  cancelText = "Cancel"
} = {}) {
  const content = fields.map((field) => {
    const id = `field-${field.name}`;
    if (field.type === "select") {
      const options = (field.options || [])
        .map((opt) => `<option value="${opt.value}" ${opt.value === field.value ? "selected" : ""}>${opt.label}</option>`)
        .join("");
      return `
        <label class="modal-field">
          <span>${field.label}</span>
          <select id="${id}">${options}</select>
        </label>
      `;
    }
    return `
      <label class="modal-field">
        <span>${field.label}</span>
        <input id="${id}" type="${field.type || "text"}" placeholder="${field.placeholder || ""}" value="${field.value || ""}" />
      </label>
    `;
  }).join("");

  return new Promise((resolve) => {
    const { overlay, modal, cleanup } = buildModal({
      title,
      content,
      confirmText,
      cancelText
    });

    const confirmBtn = modal.querySelector(".modal-confirm");
    const cancelBtn = modal.querySelector(".modal-cancel");
    const closeBtn = modal.querySelector(".modal-close");

    const done = (values) => {
      cleanup();
      resolve(values);
    };

    confirmBtn.addEventListener("click", () => {
      const values = {};
      fields.forEach((field) => {
        const id = `field-${field.name}`;
        const input = modal.querySelector(`#${id}`);
        values[field.name] = input ? input.value : "";
      });
      done(values);
    });

    cancelBtn.addEventListener("click", () => done(null));
    closeBtn.addEventListener("click", () => done(null));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) done(null);
    });
  });
}
