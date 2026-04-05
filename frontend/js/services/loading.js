if (!document.getElementById("loading-styles")) {
  const style = document.createElement("style");
  style.id = "loading-styles";
  style.textContent = `
    @keyframes mmShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    @keyframes mmSpin { to{transform:rotate(360deg)} }
    .mm-skeleton {
      height:60px;border-radius:12px;margin-bottom:8px;
      background:linear-gradient(90deg,#1a2c24 25%,#22382e 50%,#1a2c24 75%);
      background-size:200% 100%;animation:mmShimmer 1.5s infinite;
    }
  `;
  document.head.appendChild(style);
}

export function showSkeleton(container, rows = 3) {
  container.innerHTML = "";
  for (let i = 0; i < rows; i++) {
    const el = document.createElement("div");
    el.className = "mm-skeleton";
    container.appendChild(el);
  }
}

export function hideSkeleton(container) {
  container.querySelectorAll(".mm-skeleton").forEach(el => el.remove());
}

export function showSpinner(container) {
  const el = document.createElement("div");
  el.className = "mm-spinner";
  el.style.cssText = "display:flex;justify-content:center;align-items:center;padding:24px";
  el.innerHTML = `<div style="width:32px;height:32px;border-radius:50%;border:3px solid rgba(19,236,128,0.2);border-top-color:#13ec80;animation:mmSpin 0.8s linear infinite"></div>`;
  container.appendChild(el);
  return el;
}

export function hideSpinner(container) {
  container.querySelectorAll(".mm-spinner").forEach(el => el.remove());
}
