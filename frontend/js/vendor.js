let vendorDashSection = "overview";

async function renderVendor() {
  const session = getSession("vendor");
  const app = document.getElementById("app");

  if (!session) {
    app.innerHTML = authFormHtml("vendor", "Vendor login / register");
    attachAuthHandlers("vendor");
    return;
  }

  app.innerHTML = `
    <div class="card top-right reveal in-view">
      <div><h2>Welcome, ${escapeHtml(session.user.businessName || session.user.name)}</h2>
      <div class="who">Logged in as vendor - ${escapeHtml(session.user.email)}</div></div>
      <button class="link" id="logout-vendor">Log out</button>
    </div>
    <div class="dash">
      <div class="side-nav">
        ${vSideNavBtn("overview", "ti-layout-dashboard", "Overview")}
        ${vSideNavBtn("profile", "ti-user", "My profile")}
        ${vSideNavBtn("work", "ti-history", "Previous work")}
        ${vSideNavBtn("documents", "ti-file", "Documents")}
        ${vSideNavBtn("browse", "ti-search", "Open tenders")}
        ${vSideNavBtn("bids", "ti-file-text", "My bids")}
        ${vSideNavBtn("notifications", "ti-bell", "Notifications")}
      </div>
      <div id="vendor-panel"></div>
    </div>
  `;
  document.getElementById("logout-vendor").onclick = () => { clearSession("vendor"); render(); };
  document.querySelectorAll(".side-nav button").forEach((b) => b.onclick = () => { vendorDashSection = b.dataset.section; renderVendorPanel(session); });

  renderVendorPanel(session);
}

function vSideNavBtn(section, icon, label) {
  return `<button data-section="${section}" class="${vendorDashSection === section ? "active" : ""}"><i class="ti ${icon}"></i> ${label}</button>`;
}

async function renderVendorPanel(session) {
  document.querySelectorAll(".side-nav button").forEach((b) => b.classList.toggle("active", b.dataset.section === vendorDashSection));
  const panel = document.getElementById("vendor-panel");
  if (vendorDashSection === "overview") return renderVendorOverview(session, panel);
  if (vendorDashSection === "profile") return renderVendorProfileEditor(session, panel);
  if (vendorDashSection === "work") return renderPreviousWork(session, panel);
  if (vendorDashSection === "documents") return renderDocuments(session, panel);
  if (vendorDashSection === "browse") return renderBrowseTenders(session, panel);
  if (vendorDashSection === "bids") return renderMyBids(session, panel);
  if (vendorDashSection === "notifications") return renderNotifications(session, panel);
}

function profileCompletionPct(profile) {
  if (!profile) return 0;
  let score = 0, total = 5;
  if (profile.categories && profile.categories.length) score++;
  if (profile.description) score++;
  if (profile.experienceYears) score++;
  if (profile.previousWork && profile.previousWork.length) score++;
  if (profile.documents && profile.documents.length) score++;
  return Math.round((score / total) * 100);
}

async function renderVendorOverview(session, panel) {
  panel.innerHTML = `<div class="card">${skeletonRows(1)}</div>`;
  try {
    const { profile } = await apiRequest("/vendors/me/profile", { token: session.token });
    const bids = await apiRequest("/bids/mine", { token: session.token });
    const pct = profileCompletionPct(profile);
    panel.innerHTML = `
      <div class="card">
        <h3>Profile completion</h3>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="small-muted">${pct}% complete ${profile && profile.verified ? "- <span class='pill verified'>verified</span>" : "- <span class='pill unverified'>pending verification</span>"}</div>
      </div>
      <div class="grid-4">
        <div class="stat-tile"><div class="num">${(profile && profile.previousWork.length) || 0}</div><div class="lbl">Previous tenders</div></div>
        <div class="stat-tile"><div class="num">${(profile && profile.documents.length) || 0}</div><div class="lbl">Documents uploaded</div></div>
        <div class="stat-tile"><div class="num">${bids.length}</div><div class="lbl">Bids submitted</div></div>
        <div class="stat-tile"><div class="num">${bids.filter((b) => b.status === "awarded").length}</div><div class="lbl">Tenders won</div></div>
      </div>
    `;
  } catch (err) { panel.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`; }
}

async function renderVendorProfileEditor(session, panel) {
  panel.innerHTML = `<div class="card">${skeletonRows(3)}</div>`;
  let selectedCategories = [];
  try {
    const { profile } = await apiRequest("/vendors/me/profile", { token: session.token });
    selectedCategories = (profile && profile.categories) || [];

    panel.innerHTML = `
      <div class="card">
        <h3>Business profile</h3>
        <div>${profile && profile.verified ? "<span class='pill verified'>verified</span>" : "<span class='pill unverified'>pending verification</span>"}</div>
        <form id="profile-form" style="margin-top:12px">
          <label>Services offered</label>
          <div class="chip-group" id="profile-categories"></div>
          <label>Years of experience</label><input type="number" name="experienceYears" min="0" value="${profile ? profile.experienceYears : ""}" />
          <label>Description</label><textarea name="description">${escapeHtml(profile ? profile.description : "")}</textarea>
          <div id="profile-labour-fields" style="display:none"></div>
          <button class="primary" type="submit">Save profile</button>
        </form>
        <div id="profile-msg"></div>
      </div>
    `;

    const chipBox = document.getElementById("profile-categories");
    chipBox.innerHTML = (categoriesData.categories || []).map((c) =>
      `<button type="button" class="chip ${selectedCategories.includes(c.value) ? "selected" : ""}" data-cat="${c.value}">${escapeHtml(c.label)}</button>`).join("");
    chipBox.querySelectorAll(".chip").forEach((chip) => chip.onclick = () => {
      const cat = chip.dataset.cat;
      if (selectedCategories.includes(cat)) selectedCategories = selectedCategories.filter((c) => c !== cat);
      else selectedCategories.push(cat);
      chip.classList.toggle("selected");
      renderLabourBlock();
    });

    function renderLabourBlock() {
      const box = document.getElementById("profile-labour-fields");
      if (!selectedCategories.includes("labour")) { box.style.display = "none"; box.innerHTML = ""; return; }
      box.style.display = "block";
      const fields = categoriesData.labourVendorFields || [];
      const existing = (profile && profile.labourDetails) || {};
      box.innerHTML = `<hr class="divider-line"/><label style="margin-top:0">Labour / manpower supply details</label>` +
        fields.map((f) => renderDynamicFieldInput(f, "labour_")).join("");
      // pre-fill from existing labourDetails
      if (existing.labourSupplyTypes) {
        const group = box.querySelector('[data-multiselect="labour_labour_supply_types"]');
        if (group) group.querySelectorAll(".chip").forEach((c) => { if (existing.labourSupplyTypes.includes(c.dataset.val)) c.classList.add("selected"); });
      }
      if (existing.totalManpower) box.querySelector('[name="labour_total_manpower"]').value = existing.totalManpower;
      if (existing.maxCapacity) box.querySelector('[name="labour_max_capacity"]').value = existing.maxCapacity;
      if (existing.serviceLocations) box.querySelector('[name="labour_service_locations"]').value = existing.serviceLocations;
      if (existing.accommodation) box.querySelector('[name="labour_accommodation"]').checked = true;
      if (existing.transportation) box.querySelector('[name="labour_transportation"]').checked = true;
      if (existing.payrollCapability) box.querySelector('[name="labour_payroll_capability"]').checked = true;
      activateMultiselectChips(box);
    }
    renderLabourBlock();

    document.getElementById("profile-form").onsubmit = async (e) => {
      e.preventDefault();
      const form = e.target;
      const f = new FormData(form);
      if (!selectedCategories.length) { toast("Select at least one service category", "error"); return; }
      const labourDetails = selectedCategories.includes("labour") ? collectDynamicFieldValues(form, categoriesData.labourVendorFields, "labour_") : undefined;
      try {
        await apiRequest("/vendors/profile", {
          method: "POST", token: session.token,
          body: { categories: selectedCategories, experienceYears: Number(f.get("experienceYears") || 0), description: f.get("description"), labourDetails }
        });
        toast("Profile saved - pending re-verification by admin", "success");
        renderVendorPanel(session);
      } catch (err) { document.getElementById("profile-msg").innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`; }
    };
  } catch (err) { panel.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`; }
}

// ---------- previous work ----------
async function renderPreviousWork(session, panel) {
  panel.innerHTML = `
    <div class="card">
      <h3>Add previous work / tender experience</h3>
      <form id="pw-form">
        <div class="grid-2">
          <div><label>Work / tender title</label><input name="title" required /></div>
          <div><label>Client / company name</label><input name="clientName" required /></div>
        </div>
        <div class="grid-2">
          <div><label>Category</label><select name="category">${categoryOptionsHtml()}</select></div>
          <div><label>Location</label><input name="location" /></div>
        </div>
        <label>Work description</label><textarea name="description"></textarea>
        <div class="grid-3">
          <div><label>Start date</label><input type="date" name="startDate" /></div>
          <div><label>End date</label><input type="date" name="endDate" /></div>
          <div><label>Contract duration</label><input name="contractDuration" placeholder="e.g. 12 months" /></div>
        </div>
        <div class="grid-2">
          <div><label>Contract value (Rs.)</label><input type="number" name="contractValue" /></div>
          <div><label>Manpower supplied (if labour)</label><input type="number" name="manpowerSupplied" /></div>
        </div>
        <label>Work status</label>
        <select name="workStatus"><option value="completed">Completed</option><option value="ongoing">Ongoing</option></select>
        <div class="grid-2">
          <div><label>Upload work order</label><input type="file" name="workOrder" /></div>
          <div><label>Upload completion certificate</label><input type="file" name="completionCertificate" /></div>
        </div>
        <label>Upload contract document</label><input type="file" name="contractDocument" />
        <label>Work photos (up to 4)</label><input type="file" name="photos" multiple accept="image/*" />
        <label>Additional notes</label><textarea name="notes"></textarea>
        <button class="primary" type="submit">+ Add this tender</button>
      </form>
      <div id="pw-msg"></div>
    </div>
    <div class="card"><h3>My previous work</h3><div id="pw-list">${skeletonRows(2)}</div></div>
  `;

  document.getElementById("pw-form").onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    try {
      await apiRequest("/vendors/me/previous-work", { method: "POST", token: session.token, isForm: true, body: fd });
      toast("Previous work added", "success");
      form.reset();
      loadPreviousWorkList(session);
    } catch (err) { document.getElementById("pw-msg").innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`; }
  };
  loadPreviousWorkList(session);
}

async function loadPreviousWorkList(session) {
  const box = document.getElementById("pw-list");
  try {
    const { profile } = await apiRequest("/vendors/me/profile", { token: session.token });
    const work = (profile && profile.previousWork) || [];
    box.innerHTML = work.length ? work.map((w) => `
      <div class="list-item">
        <div class="row">
          <div>
            <strong>${escapeHtml(w.title)}</strong> <span class="pill ${w.workStatus === "completed" ? "approved" : "pending"}">${w.workStatus}</span>
            <div class="meta">${escapeHtml(w.clientName)} - ${categoryLabel(w.category)} - ${escapeHtml(w.location || "")}</div>
            ${w.photoUrls && w.photoUrls.length ? `<div class="meta">${w.photoUrls.length} photo(s) attached</div>` : ""}
          </div>
          <button class="link" data-del-work="${w._id}">Remove</button>
        </div>
      </div>`).join("") : `<div class="empty-state">No previous work added yet.</div>`;
    box.querySelectorAll("[data-del-work]").forEach((b) => b.onclick = async () => {
      if (!(await confirmModal("Remove this previous work entry?"))) return;
      await apiRequest("/vendors/me/previous-work/" + b.dataset.delWork, { method: "DELETE", token: session.token });
      loadPreviousWorkList(session);
    });
  } catch (err) { box.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`; }
}

// ---------- documents ----------
async function renderDocuments(session, panel) {
  panel.innerHTML = `
    <div class="card">
      <h3>Upload a document</h3>
      <form id="doc-form">
        <div class="grid-2">
          <div><label>Document category</label><select name="category">${(categoriesData.documentCategories || []).map((c) => `<option>${escapeHtml(c)}</option>`).join("")}</select></div>
          <div><label>Document name</label><input name="name" required placeholder="e.g. GST Certificate 2025" /></div>
        </div>
        <div class="grid-2">
          <div><label>File</label><input type="file" name="file" required /></div>
          <div><label>Expiry date (if applicable)</label><input type="date" name="expiryDate" /></div>
        </div>
        <button class="primary" type="submit">Upload document</button>
      </form>
      <div id="doc-msg"></div>
    </div>
    <div class="card"><h3>My documents</h3><div id="doc-list">${skeletonRows(2)}</div></div>
  `;
  document.getElementById("doc-form").onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    try {
      await apiRequest("/vendors/me/documents", { method: "POST", token: session.token, isForm: true, body: fd });
      toast("Document uploaded", "success");
      form.reset();
      loadDocumentsList(session);
    } catch (err) { document.getElementById("doc-msg").innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`; }
  };
  loadDocumentsList(session);
}

async function loadDocumentsList(session) {
  const box = document.getElementById("doc-list");
  try {
    const { profile } = await apiRequest("/vendors/me/profile", { token: session.token });
    const docs = (profile && profile.documents) || [];
    box.innerHTML = docs.length ? docs.map((d) => `
      <div class="doc-thumb">
        <i class="ti ti-file"></i>
        <div style="flex:1">
          <a href="${fileUrl(d.fileUrl)}" target="_blank">${escapeHtml(d.name)}</a>
          <div class="small-muted">${escapeHtml(d.category)} ${d.expiryDate ? "- expires " + formatDate(d.expiryDate) : ""} ${d.verified ? "- <span class='pill verified'>verified</span>" : ""}</div>
        </div>
        <button class="link" data-del-doc="${d._id}">Remove</button>
      </div>`).join("") : `<div class="empty-state">No documents uploaded yet.</div>`;
    box.querySelectorAll("[data-del-doc]").forEach((b) => b.onclick = async () => {
      if (!(await confirmModal("Remove this document?"))) return;
      await apiRequest("/vendors/me/documents/" + b.dataset.delDoc, { method: "DELETE", token: session.token });
      loadDocumentsList(session);
    });
  } catch (err) { box.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`; }
}

// ---------- browse + bid ----------
async function renderBrowseTenders(session, panel) {
  panel.innerHTML = `
    <div class="card">
      <h3>Open tenders</h3>
      <div class="grid-3">
        <div><label>Category</label><select id="bt-cat">${`<option value="">All categories</option>` + categoryOptionsHtml()}</select></div>
        <div><label>Search</label><input id="bt-q" placeholder="Search by title" /></div>
        <div><label>Location</label><input id="bt-loc" placeholder="City / area" /></div>
      </div>
      <div id="bt-list" style="margin-top:14px"></div>
    </div>
  `;
  const load = () => loadBrowseTenders(session, document.getElementById("bt-cat").value, document.getElementById("bt-q").value, document.getElementById("bt-loc").value);
  document.getElementById("bt-cat").onchange = load;
  document.getElementById("bt-q").oninput = debounce(load, 350);
  document.getElementById("bt-loc").oninput = debounce(load, 350);
  load();
}

async function loadBrowseTenders(session, category, q, location) {
  const box = document.getElementById("bt-list");
  box.innerHTML = skeletonRows(3);
  try {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (q) params.set("q", q);
    if (location) params.set("location", location);
    const tenders = await apiRequest("/tenders?" + params.toString());
    box.innerHTML = tenders.length ? tenders.map((t) => `
      <div class="list-item">
        <div class="row">
          <div>
            <strong>${escapeHtml(t.title)}</strong> <span class="pill open">${categoryLabel(t.category)}</span>
            <div class="meta">${escapeHtml((t.company && (t.company.companyName || t.company.name)) || "")} - ${escapeHtml(t.location || "")}</div>
            <div class="meta">${t.estimatedBudget ? "Budget: Rs. " + t.estimatedBudget + " - " : ""}${t.submissionDeadline ? "Deadline " + formatDate(t.submissionDeadline) : ""}</div>
          </div>
          <button class="secondary" data-bid="${t._id}">View &amp; bid</button>
        </div>
      </div>`).join("") : `<div class="empty-state">No open tenders match this filter.</div>`;
    box.querySelectorAll("[data-bid]").forEach((b) => b.onclick = () => openBidModal(session, b.dataset.bid));
  } catch (err) { box.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`; }
}

async function openBidModal(session, tenderId) {
  let tender, profile;
  try {
    [tender, { profile }] = await Promise.all([
      apiRequest("/tenders/" + tenderId),
      apiRequest("/vendors/me/profile", { token: session.token })
    ]);
  } catch (err) { toast(err.message, "error"); return; }

  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `
    <div class="modal-box" style="max-width:640px;max-height:88vh;overflow:auto">
      <h3>${escapeHtml(tender.title)}</h3>
      <div class="meta">${categoryLabel(tender.category)} - ${escapeHtml(tender.location || "")} - Ref ${escapeHtml(tender.referenceNumber)}</div>
      <p style="font-size:13px">${escapeHtml(tender.description || "")}</p>

      <form id="bid-form">
        <hr class="divider-line"/>
        <h3 style="margin-top:0">Bid details</h3>
        <div class="grid-2">
          <div><label>Quoted amount (Rs.)</label><input type="number" name="quotedAmount" /></div>
          <div><label>Proposed start date</label><input type="date" name="proposedStartDate" /></div>
        </div>
        <label>Completion time</label><input name="completionTime" placeholder="e.g. 30 days" />
        <label>Relevant experience</label><textarea name="relevantExperience"></textarea>
        <label>Team / manpower details</label><textarea name="teamDetails"></textarea>
        <label>Equipment / resources</label><textarea name="equipmentDetails"></textarea>
        <label>Additional notes</label><textarea name="additionalNotes"></textarea>

        ${tender.category === "labour" ? `
          <hr class="divider-line"/><h3>Labour-specific details</h3>
          <div class="grid-2">
            <div><label>Available labour category</label><input name="availableLabourCategory" /></div>
            <div><label>Available quantity</label><input type="number" name="availableQuantity" /></div>
          </div>
          <div class="grid-2">
            <div><label>Proposed wage/rate (Rs.)</label><input type="number" name="proposedWage" /></div>
            <div><label>Shift availability</label><input name="shiftAvailability" /></div>
          </div>
          <label class="checkbox-row"><input type="checkbox" name="accommodationCapability" /> Accommodation capability</label>
          <label class="checkbox-row"><input type="checkbox" name="transportCapability" /> Transportation capability</label>
          <label class="checkbox-row"><input type="checkbox" name="replacementCapability" /> Replacement capability</label>
        ` : ""}

        ${tender.fields && tender.fields.length ? `<hr class="divider-line"/><h3>Tender-specific requirements</h3>${tender.fields.map((f) => renderDynamicFieldInput(f, "tf_")).join("")}` : ""}

        ${tender.requiredDocuments && tender.requiredDocuments.length ? `
          <hr class="divider-line"/><h3>Required documents</h3>
          <p class="small-muted">Select from your profile documents, or upload new ones below.</p>
          ${tender.requiredDocuments.map((d) => `<div class="small-muted">${escapeHtml(d.name)} ${d.required ? "(required)" : "(optional)"}</div>`).join("")}
        ` : ""}

        <label>Select from your profile documents</label>
        <div class="chip-group" id="bid-profile-docs">
          ${(profile && profile.documents || []).map((d) => `<button type="button" class="chip" data-doc-id="${d._id}" data-doc-name="${escapeHtml(d.name)}" data-doc-url="${d.fileUrl}">${escapeHtml(d.name)}</button>`).join("") || "<span class='small-muted'>No profile documents yet</span>"}
        </div>
        <label>Or upload additional documents</label><input type="file" name="documents" multiple />

        <div id="bid-msg"></div>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:14px">
          <button type="button" class="ghost" id="bid-cancel">Cancel</button>
          <button type="submit" class="primary">Submit bid</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(backdrop);
  activateMultiselectChips(backdrop);
  backdrop.querySelectorAll("#bid-profile-docs .chip").forEach((c) => c.onclick = () => c.classList.toggle("selected"));
  backdrop.querySelector("#bid-cancel").onclick = () => backdrop.remove();
  backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.remove(); };

  backdrop.querySelector("#bid-form").onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData();
    const f = new FormData(form);
    ["quotedAmount", "proposedStartDate", "completionTime", "relevantExperience", "teamDetails", "equipmentDetails", "additionalNotes",
      "availableLabourCategory", "availableQuantity", "proposedWage", "shiftAvailability"].forEach((k) => fd.append(k, f.get(k) || ""));
    ["accommodationCapability", "transportCapability", "replacementCapability"].forEach((k) => fd.append(k, form.querySelector(`[name="${k}"]`) ? form.querySelector(`[name="${k}"]`).checked : false));
    fd.append("tenderId", tenderId);

    const answers = (tender.fields || []).map((field) => {
      const name = "tf_" + field.id;
      let value = "";
      if (field.type === "checkbox") value = form.querySelector(`[name="${name}"]`) ? String(form.querySelector(`[name="${name}"]`).checked) : "false";
      else if (field.type === "multiselect") {
        const group = form.querySelector(`[data-multiselect="${name}"]`);
        value = group ? Array.from(group.querySelectorAll(".chip.selected")).map((c) => c.dataset.val).join(", ") : "";
      } else value = f.get(name) || "";
      return { fieldId: field.id, label: field.label, value };
    });
    fd.append("answers", JSON.stringify(answers));

    const selectedDocs = Array.from(backdrop.querySelectorAll("#bid-profile-docs .chip.selected")).map((c) => ({ name: c.dataset.docName, fileUrl: c.dataset.docUrl }));
    fd.append("selectedProfileDocs", JSON.stringify(selectedDocs));

    const fileInput = form.querySelector('[name="documents"]');
    if (fileInput.files) Array.from(fileInput.files).forEach((file) => fd.append("documents", file));

    try {
      await apiRequest("/bids", { method: "POST", token: session.token, isForm: true, body: fd });
      toast("Bid submitted successfully!", "success");
      backdrop.remove();
      renderVendorPanel(session);
    } catch (err) { backdrop.querySelector("#bid-msg").innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`; }
  };
}

async function renderMyBids(session, panel) {
  panel.innerHTML = `<div class="card"><h3>My bids</h3><div id="my-bids-list">${skeletonRows(3)}</div></div>`;
  const box = document.getElementById("my-bids-list");
  try {
    const bids = await apiRequest("/bids/mine", { token: session.token });
    box.innerHTML = bids.length ? bids.map((b) => `
      <div class="list-item">
        <div class="row">
          <div>
            <strong>${escapeHtml(b.tender ? b.tender.title : "Tender removed")}</strong> <span class="pill ${b.status}">${b.status.replace("_", " ")}</span>
            <div class="meta">Bid ${escapeHtml(b.bidId)} - ${b.quotedAmount ? "Rs. " + b.quotedAmount : ""} - ${timeAgo(b.appliedAt)}</div>
          </div>
          ${b.status === "submitted" || b.status === "under_review" ? `<button class="link" data-withdraw="${b._id}">Withdraw</button>` : ""}
        </div>
      </div>`).join("") : `<div class="empty-state">You haven't submitted any bids yet.</div>`;
    box.querySelectorAll("[data-withdraw]").forEach((b) => b.onclick = async () => {
      if (!(await confirmModal("Withdraw this bid?"))) return;
      await apiRequest("/bids/" + b.dataset.withdraw + "/withdraw", { method: "PATCH", token: session.token });
      toast("Bid withdrawn", "success");
      renderMyBids(session, panel);
    });
  } catch (err) { box.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`; }
}
