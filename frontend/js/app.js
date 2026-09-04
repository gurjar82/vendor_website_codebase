let currentTab = "home";

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function render() {
  if (currentTab === "home") return renderHome();
  if (currentTab === "company") return renderCompany();
  if (currentTab === "vendor") return renderVendor();
  if (currentTab === "guest") return renderGuest();
  if (currentTab === "admin") return renderAdmin();
}

async function initApp() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
  document.querySelector(".brand").addEventListener("click", () => switchTab("home"));

  try {
    await loadCategories();
  } catch (err) {
    document.getElementById("app").innerHTML = `
      <div class="card" style="margin-top:24px">
        <h2>Can't reach the backend</h2>
        <p class="error-msg">${escapeHtml(err.message)}. Make sure the backend server is running on http://localhost:5000 (see README - "npm run dev" inside the backend folder).</p>
      </div>`;
    return;
  }
  render();
}

initApp();
