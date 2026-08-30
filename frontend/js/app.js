const CATEGORIES = [
  "canteen", "water_supply", "transport", "labour",
  "security", "housekeeping", "raw_material", "equipment_rental", "other"
];

const app = document.getElementById("app");
let currentTab = "company";

// ---------- session helpers (each role keeps its own session so you can demo all 4 in one browser) ----------
function getSession(role) {
  const raw = localStorage.getItem("session_" + role);
  return raw ? JSON.parse(raw) : null;
}
function setSession(role, data) {
  localStorage.setItem("session_" + role, JSON.stringify(data));
}
function clearSession(role) {
  localStorage.removeItem("session_" + role);
}

// ---------- tab switching ----------
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentTab = btn.dataset.tab;
    render();
  });
});

function render() {
  if (currentTab === "company") return renderCompany();
  if (currentTab === "vendor") return renderVendor();
  if (currentTab === "guest") return renderGuest();
  if (currentTab === "admin") return renderAdmin();
}

function categoryOptions(selected) {
  return CATEGORIES.map(
    (c) => `<option value="${c}" ${c === selected ? "selected" : ""}>${c.replace("_", " ")}</option>`
  ).join("");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

// =========================================================
// COMPANY TAB
// =========================================================
async function renderCompany() {
  const session = getSession("company");

  if (!session) {
    app.innerHTML = authFormHtml("company", "Company login / register");
    attachAuthHandlers("company");
    return;
  }

  app.innerHTML = `
    <div class="card top-right">
      <div><h2>Welcome, ${escapeHtml(session.user.companyName || session.user.name)}</h2>
      <div class="who">Logged in as company - ${escapeHtml(session.user.email)}</div></div>
      <button class="link" id="logout-company">Log out</button>
    </div>

    <div class="card">
      <h3>Post a new requirement</h3>
      <form id="req-form">
        <div class="grid-2">
          <div><label>Category</label><select name="category">${categoryOptions()}</select></div>
          <div><label>Location</label><input name="location" placeholder="e.g. Jaipur plant" /></div>
        </div>
        <label>Title</label>
        <input name="title" placeholder="e.g. Need canteen vendor for 200 workers" required />
        <label>Description</label>
        <textarea name="description" placeholder="Details of what you need"></textarea>
        <button class="primary" type="submit">Post requirement</button>
      </form>
      <div id="req-msg"></div>
    </div>

    <div class="card">
      <h3>My posted requirements</h3>
      <div id="my-requirements"><div class="empty-state">Loading...</div></div>
    </div>

    <div class="card">
      <h3>Browse verified vendors</h3>
      <label>Filter by category</label>
      <select id="vendor-filter">${`<option value="">All categories</option>` + categoryOptions()}</select>
      <div id="vendor-browse-list"></div>
    </div>
  `;

  document.getElementById("logout-company").onclick = () => { clearSession("company"); render(); };

  document.getElementById("req-form").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const msg = document.getElementById("req-msg");
    try {
      await apiRequest("/requirements", {
        method: "POST",
        token: session.token,
        body: {
          category: f.get("category"),
          title: f.get("title"),
          description: f.get("description"),
          location: f.get("location")
        }
      });
      msg.innerHTML = `<div class="success-msg">Requirement posted.</div>`;
      e.target.reset();
      loadMyRequirements(session);
    } catch (err) {
      msg.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`;
    }
  };

  document.getElementById("vendor-filter").onchange = (e) => loadVendorBrowse(e.target.value);

  loadMyRequirements(session);
  loadVendorBrowse("");
}

async function loadMyRequirements(session) {
  const box = document.getElementById("my-requirements");
  try {
    const reqs = await apiRequest("/requirements/mine/all", { token: session.token });
    if (!reqs.length) { box.innerHTML = `<div class="empty-state">You haven't posted any requirements yet.</div>`; return; }

    box.innerHTML = reqs.map((r) => `
      <div class="list-item">
        <div class="row">
          <div>
            <strong>${escapeHtml(r.title)}</strong> <span class="pill ${r.status}">${r.status}</span>
            <div class="meta">${r.category.replace("_", " ")} - ${escapeHtml(r.location || "no location given")}</div>
          </div>
          <button class="link" data-view-applicants="${r._id}">View applicants</button>
        </div>
        <div id="applicants-${r._id}"></div>
      </div>
    `).join("");

    box.querySelectorAll("[data-view-applicants]").forEach((btn) => {
      btn.onclick = () => loadApplicants(session, btn.dataset.viewApplicants);
    });
  } catch (err) {
    box.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`;
  }
}

async function loadApplicants(session, requirementId) {
  const box = document.getElementById("applicants-" + requirementId);
  box.innerHTML = `<div class="empty-state">Loading applicants...</div>`;
  try {
    const apps = await apiRequest("/applications/requirement/" + requirementId, { token: session.token });
    if (!apps.length) { box.innerHTML = `<div class="empty-state">No applications yet.</div>`; return; }

    box.innerHTML = apps.map((a) => `
      <div class="list-item">
        <div class="row">
          <div>
            <strong>${escapeHtml(a.vendor.name)}</strong> <span class="pill ${a.status}">${a.status}</span>
            ${a.status === "approved" ? `<div class="meta">Phone: ${escapeHtml(a.vendor.phone)} (Phase 1 contact - direct call/WhatsApp)</div>` : ""}
          </div>
          ${a.status === "pending" ? `
            <div>
              <button class="secondary" data-approve="${a._id}">Approve</button>
              <button class="danger" data-reject="${a._id}">Reject</button>
            </div>` : ""}
        </div>
      </div>
    `).join("");

    box.querySelectorAll("[data-approve]").forEach((b) => b.onclick = async () => {
      await apiRequest("/applications/" + b.dataset.approve + "/approve", { method: "PATCH", token: session.token });
      loadApplicants(session, requirementId);
    });
    box.querySelectorAll("[data-reject]").forEach((b) => b.onclick = async () => {
      await apiRequest("/applications/" + b.dataset.reject + "/reject", { method: "PATCH", token: session.token });
      loadApplicants(session, requirementId);
    });
  } catch (err) {
    box.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`;
  }
}

async function loadVendorBrowse(category) {
  const box = document.getElementById("vendor-browse-list");
  box.innerHTML = `<div class="empty-state">Loading...</div>`;
  try {
    const vendors = await apiRequest("/vendors" + (category ? "?category=" + category : ""));
    if (!vendors.length) { box.innerHTML = `<div class="empty-state">No verified vendors in this category yet.</div>`; return; }
    box.innerHTML = vendors.map(vendorCardHtml).join("");
  } catch (err) {
    box.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`;
  }
}

function vendorCardHtml(v) {
  return `
    <div class="list-item">
      <div class="row">
        <div>
          <strong>${escapeHtml(v.user.name)}</strong> <span class="pill verified">verified</span>
          <div class="meta">${v.category.replace("_", " ")} - ${v.experienceYears} yrs experience</div>
          <div class="meta">${escapeHtml(v.description || "")}</div>
        </div>
      </div>
    </div>
  `;
}

// =========================================================
// VENDOR TAB
// =========================================================
async function renderVendor() {
  const session = getSession("vendor");

  if (!session) {
    app.innerHTML = authFormHtml("vendor", "Vendor login / register");
    attachAuthHandlers("vendor");
    return;
  }

  app.innerHTML = `
    <div class="card top-right">
      <div><h2>Welcome, ${escapeHtml(session.user.name)}</h2>
      <div class="who">Logged in as vendor - ${escapeHtml(session.user.email)}</div></div>
      <button class="link" id="logout-vendor">Log out</button>
    </div>

    <div class="card">
      <h3>My profile</h3>
      <div id="profile-status"></div>
      <form id="profile-form">
        <div class="grid-2">
          <div><label>Category</label><select name="category" id="p-category">${categoryOptions()}</select></div>
          <div><label>Years of experience</label><input type="number" min="0" name="experienceYears" id="p-exp" /></div>
        </div>
        <label>Description (what work you do)</label>
        <textarea name="description" id="p-desc"></textarea>
        <label>Achievements (past clients, certifications etc.)</label>
        <textarea name="achievements" id="p-ach"></textarea>
        <button class="primary" type="submit">Save profile</button>
      </form>
      <div id="profile-msg"></div>
    </div>

    <div class="card">
      <h3>Open requirements</h3>
      <label>Filter by category</label>
      <select id="req-filter">${`<option value="">All categories</option>` + categoryOptions()}</select>
      <div id="requirement-browse-list"></div>
    </div>

    <div class="card">
      <h3>My applications</h3>
      <div id="my-applications"><div class="empty-state">Loading...</div></div>
    </div>
  `;

  document.getElementById("logout-vendor").onclick = () => { clearSession("vendor"); render(); };

  loadOwnProfile(session);

  document.getElementById("profile-form").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const msg = document.getElementById("profile-msg");
    try {
      await apiRequest("/vendors/profile", {
        method: "POST",
        token: session.token,
        body: {
          category: f.get("category"),
          experienceYears: Number(f.get("experienceYears") || 0),
          description: f.get("description"),
          achievements: f.get("achievements")
        }
      });
      msg.innerHTML = `<div class="success-msg">Profile saved. It will show as "pending verification" until admin approves it.</div>`;
      loadOwnProfile(session);
    } catch (err) {
      msg.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`;
    }
  };

  document.getElementById("req-filter").onchange = (e) => loadRequirementBrowse(session, e.target.value);

  loadRequirementBrowse(session, "");
  loadMyApplications(session);
}

async function loadOwnProfile(session) {
  const statusBox = document.getElementById("profile-status");
  try {
    const { profile } = await apiRequest("/vendors/me/profile", { token: session.token });
    if (profile) {
      statusBox.innerHTML = `<span class="pill ${profile.verified ? "verified" : "unverified"}">${profile.verified ? "verified" : "pending verification"}</span>`;
      document.getElementById("p-category").value = profile.category;
      document.getElementById("p-exp").value = profile.experienceYears;
      document.getElementById("p-desc").value = profile.description;
      document.getElementById("p-ach").value = profile.achievements;
    } else {
      statusBox.innerHTML = `<div class="empty-state">No profile yet - fill the form below to create one.</div>`;
    }
  } catch (err) {
    statusBox.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`;
  }
}

async function loadRequirementBrowse(session, category) {
  const box = document.getElementById("requirement-browse-list");
  box.innerHTML = `<div class="empty-state">Loading...</div>`;
  try {
    const reqs = await apiRequest("/requirements" + (category ? "?category=" + category : ""));
    if (!reqs.length) { box.innerHTML = `<div class="empty-state">No open requirements in this category yet.</div>`; return; }

    box.innerHTML = reqs.map((r) => `
      <div class="list-item">
        <div class="row">
          <div>
            <strong>${escapeHtml(r.title)}</strong>
            <div class="meta">${r.category.replace("_", " ")} - ${escapeHtml(r.location || "")} - posted by ${escapeHtml(r.company.companyName || r.company.name)}</div>
            <div class="meta">${escapeHtml(r.description || "")}</div>
          </div>
          <button class="secondary" data-apply="${r._id}">Apply</button>
        </div>
      </div>
    `).join("");

    box.querySelectorAll("[data-apply]").forEach((btn) => btn.onclick = async () => {
      try {
        await apiRequest("/applications", { method: "POST", token: session.token, body: { requirementId: btn.dataset.apply } });
        btn.outerHTML = `<span class="pill pending">applied</span>`;
        loadMyApplications(session);
      } catch (err) {
        alert(err.message);
      }
    });
  } catch (err) {
    box.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`;
  }
}

async function loadMyApplications(session) {
  const box = document.getElementById("my-applications");
  try {
    const apps = await apiRequest("/applications/mine", { token: session.token });
    if (!apps.length) { box.innerHTML = `<div class="empty-state">You haven't applied to anything yet.</div>`; return; }

    box.innerHTML = apps.map((a) => `
      <div class="list-item">
        <div class="row">
          <div>
            <strong>${escapeHtml(a.requirement.title)}</strong> <span class="pill ${a.status}">${a.status}</span>
            <div class="meta">${a.requirement.category.replace("_", " ")}</div>
          </div>
        </div>
      </div>
    `).join("");
  } catch (err) {
    box.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`;
  }
}

// =========================================================
// GUEST TAB (read-only, no login)
// =========================================================
async function renderGuest() {
  app.innerHTML = `
    <div class="card">
      <h2>Guest view</h2>
      <div class="who">Read-only - log in as a company or vendor to take any action.</div>
    </div>

    <div class="card">
      <h3>Vendors on the platform</h3>
      <select id="guest-vendor-filter">${`<option value="">All categories</option>` + categoryOptions()}</select>
      <div id="guest-vendors"></div>
    </div>

    <div class="card">
      <h3>Open requirements</h3>
      <select id="guest-req-filter">${`<option value="">All categories</option>` + categoryOptions()}</select>
      <div id="guest-requirements"></div>
    </div>
  `;

  document.getElementById("guest-vendor-filter").onchange = (e) => loadGuestVendors(e.target.value);
  document.getElementById("guest-req-filter").onchange = (e) => loadGuestRequirements(e.target.value);

  loadGuestVendors("");
  loadGuestRequirements("");
}

async function loadGuestVendors(category) {
  const box = document.getElementById("guest-vendors");
  box.innerHTML = `<div class="empty-state">Loading...</div>`;
  try {
    const vendors = await apiRequest("/vendors" + (category ? "?category=" + category : ""));
    box.innerHTML = vendors.length ? vendors.map(vendorCardHtml).join("") : `<div class="empty-state">No vendors yet.</div>`;
  } catch (err) {
    box.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`;
  }
}

async function loadGuestRequirements(category) {
  const box = document.getElementById("guest-requirements");
  box.innerHTML = `<div class="empty-state">Loading...</div>`;
  try {
    const reqs = await apiRequest("/requirements" + (category ? "?category=" + category : ""));
    box.innerHTML = reqs.length ? reqs.map((r) => `
      <div class="list-item">
        <strong>${escapeHtml(r.title)}</strong>
        <div class="meta">${r.category.replace("_", " ")} - ${escapeHtml(r.location || "")}</div>
      </div>
    `).join("") : `<div class="empty-state">No open requirements yet.</div>`;
  } catch (err) {
    box.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`;
  }
}

// =========================================================
// ADMIN TAB
// =========================================================
async function renderAdmin() {
  const session = getSession("admin");

  if (!session) {
    app.innerHTML = `
      <div class="card">
        <h2>Admin login</h2>
        <div class="who">Only one seeded admin account exists (set in backend .env) - there is no admin signup form.</div>
        <form id="admin-login-form">
          <label>Email</label><input name="email" type="email" required />
          <label>Password</label><input name="password" type="password" required />
          <button class="primary" type="submit">Log in</button>
        </form>
        <div id="admin-auth-msg"></div>
      </div>
    `;
    document.getElementById("admin-login-form").onsubmit = async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const msg = document.getElementById("admin-auth-msg");
      try {
        const data = await apiRequest("/auth/login", { method: "POST", body: { email: f.get("email"), password: f.get("password") } });
        if (data.user.role !== "admin") throw new Error("This account is not an admin account");
        setSession("admin", data);
        render();
      } catch (err) {
        msg.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`;
      }
    };
    return;
  }

  app.innerHTML = `
    <div class="card top-right">
      <div><h2>Admin dashboard</h2><div class="who">${escapeHtml(session.user.email)}</div></div>
      <button class="link" id="logout-admin">Log out</button>
    </div>

    <div class="card"><h3>Overview</h3><div id="admin-overview" class="grid-2"></div></div>

    <div class="card">
      <h3>Vendors pending verification</h3>
      <div id="pending-vendors"><div class="empty-state">Loading...</div></div>
    </div>
  `;

  document.getElementById("logout-admin").onclick = () => { clearSession("admin"); render(); };

  loadAdminOverview(session);
  loadPendingVendors(session);
}

async function loadAdminOverview(session) {
  const box = document.getElementById("admin-overview");
  try {
    const o = await apiRequest("/admin/overview", { token: session.token });
    box.innerHTML = `
      <div class="list-item"><div class="meta">Companies</div><strong>${o.companies}</strong></div>
      <div class="list-item"><div class="meta">Vendors</div><strong>${o.vendors}</strong></div>
      <div class="list-item"><div class="meta">Pending verification</div><strong>${o.pendingVendors}</strong></div>
      <div class="list-item"><div class="meta">Open requirements</div><strong>${o.openRequirements}</strong></div>
    `;
  } catch (err) {
    box.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`;
  }
}

async function loadPendingVendors(session) {
  const box = document.getElementById("pending-vendors");
  try {
    const vendors = await apiRequest("/admin/vendors/pending", { token: session.token });
    if (!vendors.length) { box.innerHTML = `<div class="empty-state">Nothing pending - all caught up.</div>`; return; }

    box.innerHTML = vendors.map((v) => `
      <div class="list-item">
        <div class="row">
          <div>
            <strong>${escapeHtml(v.user.name)}</strong>
            <div class="meta">${v.category.replace("_", " ")} - ${v.experienceYears} yrs - ${escapeHtml(v.user.phone)}</div>
            <div class="meta">${escapeHtml(v.description || "")}</div>
          </div>
          <div>
            <button class="secondary" data-verify="${v._id}">Verify</button>
            <button class="danger" data-remove="${v._id}">Remove</button>
          </div>
        </div>
      </div>
    `).join("");

    box.querySelectorAll("[data-verify]").forEach((b) => b.onclick = async () => {
      await apiRequest("/admin/vendors/" + b.dataset.verify + "/verify", { method: "PATCH", token: session.token });
      loadPendingVendors(session);
      loadAdminOverview(session);
    });
    box.querySelectorAll("[data-remove]").forEach((b) => b.onclick = async () => {
      await apiRequest("/admin/vendors/" + b.dataset.remove, { method: "DELETE", token: session.token });
      loadPendingVendors(session);
      loadAdminOverview(session);
    });
  } catch (err) {
    box.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`;
  }
}

// =========================================================
// SHARED AUTH FORM (company / vendor - both self-register)
// =========================================================
function authFormHtml(role, title) {
  return `
    <div class="card">
      <h2>${title}</h2>
      <div class="tabs" style="margin-bottom:14px;">
        <button class="tab-btn active" data-mode="login">Log in</button>
        <button class="tab-btn" data-mode="register">Register</button>
      </div>

      <form id="login-form-${role}">
        <label>Email</label><input name="email" type="email" required />
        <label>Password</label><input name="password" type="password" required />
        <button class="primary" type="submit">Log in</button>
      </form>

      <form id="register-form-${role}" style="display:none;">
        <label>Full name</label><input name="name" required />
        ${role === "company" ? `<label>Company name</label><input name="companyName" required />` : ""}
        <label>Email</label><input name="email" type="email" required />
        <label>Phone</label><input name="phone" required />
        <label>Password</label><input name="password" type="password" required minlength="6" />
        <button class="primary" type="submit">Register</button>
      </form>

      <div id="auth-msg-${role}"></div>
    </div>
  `;
}

function attachAuthHandlers(role) {
  const loginForm = document.getElementById("login-form-" + role);
  const registerForm = document.getElementById("register-form-" + role);
  const msg = document.getElementById("auth-msg-" + role);

  document.querySelectorAll(`.tabs [data-mode]`).forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll(`.tabs [data-mode]`).forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const isLogin = btn.dataset.mode === "login";
      loginForm.style.display = isLogin ? "block" : "none";
      registerForm.style.display = isLogin ? "none" : "block";
    };
  });

  loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      const data = await apiRequest("/auth/login", { method: "POST", body: { email: f.get("email"), password: f.get("password") } });
      if (data.user.role !== role) throw new Error(`This account is registered as ${data.user.role}, not ${role}`);
      setSession(role, data);
      render();
    } catch (err) {
      msg.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`;
    }
  };

  registerForm.onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      const data = await apiRequest("/auth/register", {
        method: "POST",
        body: {
          name: f.get("name"),
          companyName: f.get("companyName"),
          email: f.get("email"),
          phone: f.get("phone"),
          password: f.get("password"),
          role
        }
      });
      setSession(role, data);
      render();
    } catch (err) {
      msg.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`;
    }
  };
}

render();
