async function renderAdmin() {
  const session = getSession("admin");
  const app = document.getElementById("app");

  if (!session) {
    app.innerHTML = `
      <div class="card reveal in-view" style="max-width:480px;margin:24px auto">
        <h2><i class="ti ti-shield-lock"></i> Admin login</h2>
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
      } catch (err) { msg.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`; }
    };
    return;
  }

  app.innerHTML = `
    <div class="card top-right reveal in-view">
      <div><h2><i class="ti ti-shield-lock"></i> Admin dashboard</h2><div class="who">${escapeHtml(session.user.email)}</div></div>
      <button class="link" id="logout-admin">Log out</button>
    </div>

    <div class="grid-4" id="admin-overview">${Array(4).fill('<div class="skeleton" style="height:70px"></div>').join("")}</div>

    <div class="card" style="margin-top:16px">
      <h3>Vendors pending verification</h3>
      <div id="pending-vendors">${skeletonRows(2)}</div>
    </div>

    <div class="card">
      <h3>All companies</h3>
      <div id="all-companies">${skeletonRows(2)}</div>
    </div>

    <div class="card">
      <h3>All vendors</h3>
      <div id="all-vendors">${skeletonRows(2)}</div>
    </div>
  `;

  document.getElementById("logout-admin").onclick = () => { clearSession("admin"); render(); };

  loadAdminOverview(session);
  loadPendingVendors(session);
  loadAllCompanies(session);
  loadAllVendorsAdmin(session);
}

async function loadAdminOverview(session) {
  const box = document.getElementById("admin-overview");
  try {
    const o = await apiRequest("/admin/overview", { token: session.token });
    box.innerHTML = `
      <div class="stat-tile"><div class="num">${o.companies}</div><div class="lbl">Companies</div></div>
      <div class="stat-tile"><div class="num">${o.vendors}</div><div class="lbl">Vendors</div></div>
      <div class="stat-tile"><div class="num">${o.pendingVendors}</div><div class="lbl">Pending verification</div></div>
      <div class="stat-tile"><div class="num">${o.openTenders}</div><div class="lbl">Open tenders</div></div>
    `;
  } catch (err) { box.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`; }
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
            <strong>${escapeHtml((v.user && (v.user.businessName || v.user.name)) || "Vendor")}</strong>
            <div class="meta">${(v.categories || []).map(categoryLabel).join(", ")} - ${v.experienceYears} yrs - ${escapeHtml(v.user ? v.user.phone : "")}</div>
            <div class="meta">${escapeHtml(v.description || "")}</div>
            <div class="meta">${(v.documents || []).length} document(s), ${(v.previousWork || []).length} previous work entries</div>
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
      toast("Vendor verified", "success");
      loadPendingVendors(session);
      loadAdminOverview(session);
      loadAllVendorsAdmin(session);
    });
    box.querySelectorAll("[data-remove]").forEach((b) => b.onclick = async () => {
      if (!(await confirmModal("Remove this vendor profile permanently?"))) return;
      await apiRequest("/admin/vendors/" + b.dataset.remove, { method: "DELETE", token: session.token });
      toast("Vendor profile removed", "success");
      loadPendingVendors(session);
      loadAdminOverview(session);
    });
  } catch (err) { box.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`; }
}

async function loadAllCompanies(session) {
  const box = document.getElementById("all-companies");
  try {
    const companies = await apiRequest("/admin/companies", { token: session.token });
    box.innerHTML = companies.length ? companies.map((c) => `
      <div class="list-item">
        <div class="row">
          <div>
            <strong>${escapeHtml(c.companyName || c.name)}</strong> <span class="pill ${c.status}">${c.status}</span>
            <div class="meta">${escapeHtml(c.email)} - ${escapeHtml(c.industry || "")}</div>
          </div>
          <button class="${c.status === "active" ? "danger" : "secondary"}" data-suspend="${c._id}" data-next="${c.status === "active"}">
            ${c.status === "active" ? "Suspend" : "Reactivate"}
          </button>
        </div>
      </div>
    `).join("") : `<div class="empty-state">No companies registered yet.</div>`;

    box.querySelectorAll("[data-suspend]").forEach((b) => b.onclick = async () => {
      const suspend = b.dataset.next === "true";
      if (!(await confirmModal(suspend ? "Suspend this company's account?" : "Reactivate this account?"))) return;
      await apiRequest("/admin/users/" + b.dataset.suspend + "/suspend", { method: "PATCH", token: session.token, body: { suspend } });
      toast(suspend ? "Company suspended" : "Company reactivated", "success");
      loadAllCompanies(session);
    });
  } catch (err) { box.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`; }
}

async function loadAllVendorsAdmin(session) {
  const box = document.getElementById("all-vendors");
  try {
    const vendors = await apiRequest("/admin/vendors", { token: session.token });
    box.innerHTML = vendors.length ? vendors.map((v) => `
      <div class="list-item">
        <div class="row">
          <div>
            <strong>${escapeHtml((v.user && (v.user.businessName || v.user.name)) || "Vendor")}</strong>
            <span class="pill ${v.verified ? "verified" : "unverified"}">${v.verified ? "verified" : "pending"}</span>
            ${v.user && v.user.status === "suspended" ? `<span class="pill suspended">suspended</span>` : ""}
            <div class="meta">${(v.categories || []).map(categoryLabel).join(", ")}</div>
          </div>
          ${v.user ? `<button class="${v.user.status === "active" ? "danger" : "secondary"}" data-suspend-v="${v.user._id}" data-next="${v.user.status === "active"}">
            ${v.user.status === "active" ? "Suspend" : "Reactivate"}
          </button>` : ""}
        </div>
      </div>
    `).join("") : `<div class="empty-state">No vendors registered yet.</div>`;

    box.querySelectorAll("[data-suspend-v]").forEach((b) => b.onclick = async () => {
      const suspend = b.dataset.next === "true";
      if (!(await confirmModal(suspend ? "Suspend this vendor's account?" : "Reactivate this account?"))) return;
      await apiRequest("/admin/users/" + b.dataset.suspendV + "/suspend", { method: "PATCH", token: session.token, body: { suspend } });
      toast(suspend ? "Vendor suspended" : "Vendor reactivated", "success");
      loadAllVendorsAdmin(session);
    });
  } catch (err) { box.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`; }
}
