// ---------- toast notifications ----------
function toast(message, type = "info") {
  let stack = document.getElementById("toast-stack");
  if (!stack) {
    stack = document.createElement("div");
    stack.id = "toast-stack";
    document.body.appendChild(stack);
  }
  const el = document.createElement("div");
  el.className = "toast " + type;
  el.textContent = message;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 3800);
}

// ---------- confirm modal ----------
function confirmModal(message) {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = `
      <div class="modal-box">
        <p style="margin-top:0">${escapeHtml(message)}</p>
        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button class="ghost" id="modal-cancel">Cancel</button>
          <button class="danger" id="modal-ok">Confirm</button>
        </div>
      </div>`;
    document.body.appendChild(backdrop);
    backdrop.querySelector("#modal-cancel").onclick = () => { backdrop.remove(); resolve(false); };
    backdrop.querySelector("#modal-ok").onclick = () => { backdrop.remove(); resolve(true); };
    backdrop.onclick = (e) => { if (e.target === backdrop) { backdrop.remove(); resolve(false); } };
  });
}

// ---------- scroll reveal ----------
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in-view"); revealObserver.unobserve(e.target); } });
}, { threshold: 0.1 });

function observeReveals(root = document) {
  root.querySelectorAll(".reveal:not(.in-view)").forEach((el) => revealObserver.observe(el));
}

// ---------- helpers ----------
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str === undefined || str === null ? "" : String(str);
  return div.innerHTML;
}

function formatDate(d) {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return ""; }
}

function timeAgo(d) {
  if (!d) return "";
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  return Math.floor(diff / 86400) + "d ago";
}

function categoryLabel(value) {
  const found = (window.__categories || []).find((c) => c.value === value);
  return found ? found.label : (value || "").replace(/_/g, " ");
}

function skeletonRows(n = 3) {
  return Array.from({ length: n }).map(() => `<div class="skeleton" style="height:64px;margin-bottom:10px"></div>`).join("");
}

function greetingByTime() {
  const h = new Date().getHours();
  if (h < 12) return "Namaste, good morning";
  if (h < 17) return "Namaste, good afternoon";
  return "Namaste, good evening";
}
