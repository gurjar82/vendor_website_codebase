let companyDashSection = "overview";

async function renderCompany() {
  const session = getSession("company");
  const app = document.getElementById("app");

  if (!session) {
    app.innerHTML = authFormHtml("company", "Company login / register");
    attachAuthHandlers("company");
    return;
  }

  app.innerHTML = `
    <div class="card top-right reveal in-view">
      <div><h2>Welcome, ${escapeHtml(session.user.companyName || session.user.name)}</h2>
      <div class="who">Logged in as company - ${escapeHtml(session.user.email)}</div></div>
      <button class="link" id="logout-company">Log out</button>
    </div>
    <div class="dash">
      <div class="side-nav">
        ${sideNavBtn("overview", "ti-layout-dashboard", "Overview")}
        ${sideNavBtn("publish", "ti-plus", "Publish tender")}
        ${sideNavBtn("tenders", "ti-briefcase", "My tenders")}
        ${sideNavBtn("vendors", "ti-users", "Vendor directory")}
        ${sideNavBtn("notifications", "ti-bell", "Notifications")}
      </div>
      <div id="company-panel"></div>
    </div>
  `;
  document.getElementById("logout-company").onclick = () => { clearSession("company"); render(); };
  document.querySelectorAll(".side-nav button").forEach((b) => b.onclick = () => { companyDashSection = b.dataset.section; renderCompanyPanel(session); });

  renderCompanyPanel(session);
}

function sideNavBtn(section, icon, label) {
  return `<button data-section="${section}" class="${companyDashSection === section ? "active" : ""}"><i class="ti ${icon}"></i> ${label}</button>`;
}

async function renderCompanyPanel(session) {
  document.querySelectorAll(".side-nav button").forEach((b) => b.classList.toggle("active", b.dataset.section === companyDashSection));
  const panel = document.getElementById("company-panel");
  if (companyDashSection === "overview") return renderCompanyOverview(session, panel);
  if (companyDashSection === "publish") return renderTenderBuilder(session, panel);
  if (companyDashSection === "tenders") return renderMyTenders(session, panel);
  if (companyDashSection === "vendors") return renderVendorDirectory(session, panel);
  if (companyDashSection === "notifications") return renderNotifications(session, panel);
}

async function renderCompanyOverview(session, panel) {
  panel.innerHTML = `<div class="grid-4" id="company-stats">${Array(4).fill('<div class="skeleton" style="height:70px"></div>').join("")}</div>
    <div class="card" style="margin-top:16px"><h3>Recent tenders</h3><div id="company-recent-tenders">${skeletonRows(2)}</div></div>`;
  try {
    const tenders = await apiRequest("/tenders/mine/all", { token: session.token });
    const open = tenders.filter((t) => t.status === "open").length;
    const closed = tenders.filter((t) => t.status === "closed").length;
    const awarded = tenders.filter((t) => t.status === "awarded").length;
    document.getElementById("company-stats").innerHTML = `
      <div class="stat-tile"><div class="num">${tenders.length}</div><div class="lbl">Total tenders</div></div>
      <div class="stat-tile"><div class="num">${open}</div><div class="lbl">Active tenders</div></div>
      <div class="stat-tile"><div class="num">${closed}</div><div class="lbl">Closed tenders</div></div>
      <div class="stat-tile"><div class="num">${awarded}</div><div class="lbl">Awarded</div></div>
    `;
    const recent = document.getElementById("company-recent-tenders");
    recent.innerHTML = tenders.slice(0, 5).length ? tenders.slice(0, 5).map((t) => `
      <div class="list-item"><div class="row"><div><strong>${escapeHtml(t.title)}</strong> <span class="pill ${t.status}">${t.status}</span>
      <div class="meta">${categoryLabel(t.category)} - ${timeAgo(t.createdAt)}</div></div></div></div>`).join("")
      : `<div class="empty-state">No tenders published yet - use "Publish tender" to create your first one.</div>`;
  } catch (err) { panel.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`; }
}

// ---------- tender builder wizard ----------
async function renderTenderBuilder(session, panel) {
  let step = 1;
  const totalSteps = 4;
  let category = "";
  let customFields = [];
  let requiredDocs = [];

  panel.innerHTML = `
    <div class="card">
      <h3>Publish a new tender</h3>
      <div id="tb-indicator"></div>
      <form id="tb-form">
        <div class="tb-step" data-step="1">
          <label>Tender category</label>
          <select id="tb-category" required><option value="">Select category...</option>${categoryOptionsHtml()}</select>
          <label>Tender title</label><input name="title" required placeholder="e.g. Canteen vendor needed for 200 workers" />
          <label>Reference number (optional - auto-generated if left blank)</label><input name="referenceNumber" />
          <label>Description</label><textarea name="description"></textarea>
          <label>Scope of work</label><textarea name="scopeOfWork"></textarea>
          <div class="grid-2">
            <div><label>Work location</label><input name="location" /></div>
            <div><label>Estimated budget (Rs.)</label><input name="estimatedBudget" type="number" /></div>
          </div>
          <div class="grid-3">
            <div><label>Expected start date</label><input name="expectedStartDate" type="date" /></div>
            <div><label>Expected end date</label><input name="expectedEndDate" type="date" /></div>
            <div><label>Submission deadline</label><input name="submissionDeadline" type="date" /></div>
          </div>
          <label>Terms &amp; conditions</label><textarea name="termsAndConditions"></textarea>
        </div>

        <div class="tb-step" data-step="2" style="display:none">
          <p class="small-muted">These fields are suggested for your category. Remove any you don't need, or add your own below.</p>
          <div id="tb-category-fields"></div>
          <hr class="divider-line"/>
          <div id="tb-custom-fields-list"></div>
          <div class="card" style="background:#f8f8ff">
            <h3 style="margin-top:0">Add a custom field</h3>
            <div class="grid-2">
              <div><label>Field label</label><input id="cf-label" placeholder="e.g. Preferred brand" /></div>
              <div><label>Field type</label>
                <select id="cf-type">
                  <option value="text">Text</option><option value="number">Number</option><option value="date">Date</option>
                  <option value="dropdown">Dropdown</option><option value="checkbox">Checkbox</option>
                  <option value="textarea">Long text</option><option value="file">File upload</option>
                </select>
              </div>
            </div>
            <label>Dropdown options (comma-separated, if applicable)</label><input id="cf-options" placeholder="Option A, Option B" />
            <button type="button" class="ghost" id="cf-add">+ Add field</button>
          </div>
        </div>

        <div class="tb-step" data-step="3" style="display:none">
          <p class="small-muted">Which documents must vendors submit with their bid?</p>
          <div id="tb-required-docs-list"></div>
          <div class="grid-2">
            <input id="rd-name" placeholder="Document name, e.g. GST Certificate" />
            <label class="checkbox-row" style="margin:8px 0"><input type="checkbox" id="rd-required" checked/> Required (not optional)</label>
          </div>
          <button type="button" class="ghost" id="rd-add">+ Add document requirement</button>
        </div>

        <div class="tb-step" data-step="4" style="display:none">
          <h3>Review</h3>
          <div id="tb-review"></div>
        </div>

        <div style="display:flex;justify-content:space-between;margin-top:16px">
          <button type="button" class="ghost" id="tb-back" style="display:none">Back</button>
          <button type="button" class="primary" id="tb-next">Continue</button>
          <button type="submit" class="primary" id="tb-submit" style="display:none">Publish tender</button>
        </div>
      </form>
      <div id="tb-msg"></div>
    </div>
  `;

  const form = document.getElementById("tb-form");

  function updateStepView() {
    form.querySelectorAll(".tb-step").forEach((s) => s.style.display = Number(s.dataset.step) === step ? "block" : "none");
    document.getElementById("tb-indicator").innerHTML = stepIndicatorHtml(totalSteps, step);
    document.getElementById("tb-back").style.display = step > 1 ? "inline-block" : "none";
    document.getElementById("tb-next").style.display = step < totalSteps ? "inline-block" : "none";
    document.getElementById("tb-submit").style.display = step === totalSteps ? "inline-block" : "none";
    if (step === 2 && category) renderCategoryFieldsUI();
    if (step === 4) renderReview();
  }
  updateStepView();

  document.getElementById("tb-category").onchange = (e) => {
    category = e.target.value;
    customFields = (categoriesData.tenderFieldTemplates[category] || []).map((f) => ({ ...f }));
  };

  document.getElementById("tb-next").onclick = () => {
    if (step === 1 && !category) { toast("Please select a tender category", "error"); return; }
    if (step === 1) {
      const title = form.querySelector('[name="title"]');
      if (!title.value) { title.reportValidity(); return; }
    }
    step = Math.min(totalSteps, step + 1);
    updateStepView();
  };
  document.getElementById("tb-back").onclick = () => { step = Math.max(1, step - 1); updateStepView(); };

  function renderCategoryFieldsUI() {
    document.getElementById("tb-category-fields").innerHTML = "";
    renderCustomFieldsList();
  }
  function renderCustomFieldsList() {
    const box = document.getElementById("tb-custom-fields-list");
    box.innerHTML = customFields.length ? customFields.map((f, i) => `
      <div class="list-item"><div class="row">
        <div><strong>${escapeHtml(f.label)}</strong><div class="meta">${f.type}${f.required ? " - required" : ""}</div></div>
        <button type="button" class="link" data-remove-field="${i}">Remove</button>
      </div></div>`).join("") : `<div class="empty-state">No requirement fields yet.</div>`;
    box.querySelectorAll("[data-remove-field]").forEach((b) => b.onclick = () => { customFields.splice(Number(b.dataset.removeField), 1); renderCustomFieldsList(); });
  }

  document.getElementById("cf-add").onclick = () => {
    const label = document.getElementById("cf-label").value.trim();
    const type = document.getElementById("cf-type").value;
    const optionsRaw = document.getElementById("cf-options").value.trim();
    if (!label) { toast("Enter a field label first", "error"); return; }
    customFields.push({
      id: "custom_" + Date.now(), label, type,
      options: optionsRaw ? optionsRaw.split(",").map((s) => s.trim()) : undefined
    });
    document.getElementById("cf-label").value = "";
    document.getElementById("cf-options").value = "";
    renderCustomFieldsList();
  };

  function renderRequiredDocsList() {
    const box = document.getElementById("tb-required-docs-list");
    box.innerHTML = requiredDocs.length ? requiredDocs.map((d, i) => `
      <div class="list-item"><div class="row">
        <div><strong>${escapeHtml(d.name)}</strong> <span class="pill ${d.required ? "pending" : "closed"}">${d.required ? "required" : "optional"}</span></div>
        <button type="button" class="link" data-remove-doc="${i}">Remove</button>
      </div></div>`).join("") : `<div class="empty-state">No document requirements added yet.</div>`;
    box.querySelectorAll("[data-remove-doc]").forEach((b) => b.onclick = () => { requiredDocs.splice(Number(b.dataset.removeDoc), 1); renderRequiredDocsList(); });
  }
  renderRequiredDocsList();

  document.getElementById("rd-add").onclick = () => {
    const name = document.getElementById("rd-name").value.trim();
    if (!name) { toast("Enter a document name", "error"); return; }
    requiredDocs.push({ name, required: document.getElementById("rd-required").checked });
    document.getElementById("rd-name").value = "";
    renderRequiredDocsList();
  };

  function renderReview() {
    const f = new FormData(form);
    document.getElementById("tb-review").innerHTML = `
      <div class="list-item"><strong>${escapeHtml(f.get("title"))}</strong> <span class="pill open">${categoryLabel(category)}</span>
      <div class="meta">${escapeHtml(f.get("location") || "")} ${f.get("estimatedBudget") ? "- Rs. " + escapeHtml(f.get("estimatedBudget")) : ""}</div></div>
      <p class="small-muted">${customFields.length} requirement field(s), ${requiredDocs.length} required document(s)</p>
    `;
  }

  form.onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const submitBtn = document.getElementById("tb-submit");
    submitBtn.disabled = true;
    try {
      await apiRequest("/tenders", {
        method: "POST", token: session.token,
        body: {
          category, title: f.get("title"), referenceNumber: f.get("referenceNumber"),
          description: f.get("description"), scopeOfWork: f.get("scopeOfWork"), location: f.get("location"),
          estimatedBudget: f.get("estimatedBudget") ? Number(f.get("estimatedBudget")) : undefined,
          expectedStartDate: f.get("expectedStartDate"), expectedEndDate: f.get("expectedEndDate"),
          submissionDeadline: f.get("submissionDeadline"), termsAndConditions: f.get("termsAndConditions"),
          customFields, requiredDocuments: requiredDocs
        }
      });
      toast("Tender published successfully!", "success");
      companyDashSection = "tenders";
      renderCompanyPanel(session);
    } catch (err) {
      document.getElementById("tb-msg").innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`;
    } finally { submitBtn.disabled = false; }
  };
}

// ---------- my tenders + bid management ----------
async function renderMyTenders(session, panel) {
  panel.innerHTML = `<div class="card"><h3>My published tenders</h3><div id="my-tenders-list">${skeletonRows(3)}</div></div>`;
  const box = document.getElementById("my-tenders-list");
  try {
    const tenders = await apiRequest("/tenders/mine/all", { token: session.token });
    box.innerHTML = tenders.length ? tenders.map((t) => `
      <div class="list-item">
        <div class="row">
          <div>
            <strong>${escapeHtml(t.title)}</strong> <span class="pill ${t.status}">${t.status}</span>
            <div class="meta">${categoryLabel(t.category)} - ${escapeHtml(t.location || "")} - Ref ${escapeHtml(t.referenceNumber)}</div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="ghost" data-view-bids="${t._id}">View bids</button>
            ${t.status === "open" ? `<button class="danger" data-close="${t._id}">Close</button>` : ""}
          </div>
        </div>
        <div id="bids-${t._id}"></div>
      </div>
    `).join("") : `<div class="empty-state">No tenders published yet.</div>`;

    box.querySelectorAll("[data-view-bids]").forEach((b) => b.onclick = () => loadBidsForTender(session, b.dataset.viewBids));
    box.querySelectorAll("[data-close]").forEach((b) => b.onclick = async () => {
      if (!(await confirmModal("Close this tender? Vendors won't be able to bid anymore."))) return;
      await apiRequest(`/tenders/${b.dataset.close}/close`, { method: "PATCH", token: session.token });
      toast("Tender closed", "success");
      renderMyTenders(session, panel);
    });
  } catch (err) { box.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`; }
}

async function loadBidsForTender(session, tenderId) {
  const box = document.getElementById("bids-" + tenderId);
  box.innerHTML = skeletonRows(2);
  try {
    const bids = await apiRequest("/bids/tender/" + tenderId, { token: session.token });
    box.innerHTML = bids.length ? bids.map((b) => bidRowHtml(b)).join("") : `<div class="empty-state">No bids received yet.</div>`;

    box.querySelectorAll("[data-shortlist]").forEach((btn) => btn.onclick = () => actOnBid(session, btn.dataset.shortlist, "shortlist", tenderId));
    box.querySelectorAll("[data-reject]").forEach((btn) => btn.onclick = () => actOnBid(session, btn.dataset.reject, "reject", tenderId));
    box.querySelectorAll("[data-award]").forEach((btn) => btn.onclick = async () => {
      if (!(await confirmModal("Award this tender to this vendor? This closes the tender."))) return;
      actOnBid(session, btn.dataset.award, "award", tenderId);
    });
    box.querySelectorAll("[data-view-vendor]").forEach((btn) => btn.onclick = () => showVendorProfileModal(btn.dataset.viewVendor));
  } catch (err) { box.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`; }
}

function bidRowHtml(b) {
  const v = b.vendor || {};
  return `
    <div class="list-item" style="margin-top:8px;background:#fafafa">
      <div class="row">
        <div>
          <strong>${escapeHtml(v.businessName || v.name || "Vendor")}</strong> <span class="pill ${b.status}">${b.status.replace("_", " ")}</span>
          <div class="meta">Bid ${escapeHtml(b.bidId)} - ${b.quotedAmount ? "Rs. " + b.quotedAmount : "no quote given"} - ${timeAgo(b.appliedAt)}</div>
          ${b.documents && b.documents.length ? `<div class="meta">${b.documents.length} document(s) attached</div>` : ""}
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="ghost" data-view-vendor="${v._id}">View profile</button>
          ${b.status === "submitted" || b.status === "under_review" ? `
            <button class="secondary" data-shortlist="${b._id}">Shortlist</button>
            <button class="danger" data-reject="${b._id}">Reject</button>` : ""}
          ${b.status === "shortlisted" ? `<button class="primary" data-award="${b._id}">Award</button>` : ""}
        </div>
      </div>
    </div>`;
}

async function actOnBid(session, bidId, action, tenderId) {
  try {
    await apiRequest(`/bids/${bidId}/${action}`, { method: "PATCH", token: session.token });
    toast("Bid " + action + "ed", "success");
    loadBidsForTender(session, tenderId);
  } catch (err) { toast(err.message, "error"); }
}

async function showVendorProfileModal(vendorUserId) {
  try {
    const vendors = await apiRequest("/vendors?verifiedOnly=false");
    const v = vendors.find((x) => x.user && x.user._id === vendorUserId);
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = `<div class="modal-box" style="max-width:520px">
      <h3>${escapeHtml((v && v.user && (v.user.businessName || v.user.name)) || "Vendor profile")}</h3>
      ${v ? `
        <div class="meta">${(v.categories || []).map(categoryLabel).join(", ")} - ${v.experienceYears} yrs experience</div>
        <p>${escapeHtml(v.description || "")}</p>
        <p class="small-muted">Phone: ${escapeHtml(v.user.phone || "")} - Email: ${escapeHtml(v.user.email || "")}</p>
        <strong>Previous work (${(v.previousWork || []).length})</strong>
        ${(v.previousWork || []).slice(0, 3).map((w) => `<div class="list-item"><strong>${escapeHtml(w.title)}</strong><div class="meta">${escapeHtml(w.clientName)}</div></div>`).join("") || `<div class="empty-state">None added</div>`}
      ` : `<div class="empty-state">Profile not found</div>`}
      <button class="ghost" id="close-modal">Close</button>
    </div>`;
    document.body.appendChild(backdrop);
    backdrop.querySelector("#close-modal").onclick = () => backdrop.remove();
    backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.remove(); };
  } catch (err) { toast(err.message, "error"); }
}

async function renderVendorDirectory(session, panel) {
  panel.innerHTML = `
    <div class="card">
      <h3>Vendor directory</h3>
      <select id="cd-vendor-cat">${`<option value="">All categories</option>` + categoryOptionsHtml()}</select>
      <div id="cd-vendor-list" style="margin-top:14px"></div>
    </div>`;
  const load = async (cat) => {
    const box = document.getElementById("cd-vendor-list");
    box.innerHTML = skeletonRows(3);
    const vendors = await apiRequest("/vendors" + (cat ? "?category=" + cat : ""));
    box.innerHTML = vendors.length ? vendors.map(vendorCardHtml).join("") : `<div class="empty-state">No verified vendors yet.</div>`;
  };
  document.getElementById("cd-vendor-cat").onchange = (e) => load(e.target.value);
  load("");
}

async function renderNotifications(session, panel) {
  panel.innerHTML = `<div class="card"><h3>Notifications</h3><div id="notif-list">${skeletonRows(3)}</div></div>`;
  const box = document.getElementById("notif-list");
  try {
    const notifs = await apiRequest("/notifications/mine", { token: session.token });
    box.innerHTML = notifs.length ? notifs.map((n) => `
      <div class="list-item" style="${n.read ? "" : "background:#f5f4ff"}">
        ${escapeHtml(n.message)} <div class="meta">${timeAgo(n.createdAt)}</div>
      </div>`).join("") : `<div class="empty-state">No notifications yet.</div>`;
  } catch (err) { box.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`; }
}
