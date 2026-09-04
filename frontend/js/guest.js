async function renderGuest() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="card reveal in-view">
      <h2><i class="ti ti-eye"></i> Guest view</h2>
      <div class="who">Read-only - log in as a company or vendor to take any action.</div>
    </div>

    <div class="section-head reveal in-view"><h2>Open tenders</h2></div>
    <div class="card reveal in-view">
      <div class="grid-3">
        <div><label>Category</label><select id="g-t-cat">${`<option value="">All categories</option>` + categoryOptionsHtml()}</select></div>
        <div><label>Search</label><input id="g-t-q" placeholder="Search by title" /></div>
        <div><label>Location</label><input id="g-t-loc" placeholder="City / area" /></div>
      </div>
      <div id="guest-tenders" style="margin-top:14px"></div>
    </div>

    <div class="section-head reveal in-view"><h2>Vendor directory</h2></div>
    <div class="card reveal in-view">
      <label>Category</label>
      <select id="g-v-cat">${`<option value="">All categories</option>` + categoryOptionsHtml()}</select>
      <div id="guest-vendors" style="margin-top:14px"></div>
    </div>
  `;

  const filterTenders = () => loadGuestTenders(document.getElementById("g-t-cat").value, document.getElementById("g-t-q").value, document.getElementById("g-t-loc").value);
  document.getElementById("g-t-cat").onchange = filterTenders;
  document.getElementById("g-t-q").oninput = debounce(filterTenders, 350);
  document.getElementById("g-t-loc").oninput = debounce(filterTenders, 350);
  document.getElementById("g-v-cat").onchange = (e) => loadGuestVendors(e.target.value);

  loadGuestTenders("", "", "");
  loadGuestVendors("");
}

function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

async function loadGuestTenders(category, q, location) {
  const box = document.getElementById("guest-tenders");
  box.innerHTML = skeletonRows(3);
  try {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (q) params.set("q", q);
    if (location) params.set("location", location);
    const tenders = await apiRequest("/tenders?" + params.toString());
    box.innerHTML = tenders.length ? tenders.map(tenderCardHtml).join("") : `<div class="empty-state"><div class="big-icon"><i class="ti ti-briefcase-off"></i></div>No open tenders match this filter.</div>`;
  } catch (err) { box.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`; }
}

async function loadGuestVendors(category) {
  const box = document.getElementById("guest-vendors");
  box.innerHTML = skeletonRows(3);
  try {
    const vendors = await apiRequest("/vendors" + (category ? "?category=" + category : ""));
    box.innerHTML = vendors.length ? vendors.map(vendorCardHtml).join("") : `<div class="empty-state">No verified vendors in this category yet.</div>`;
  } catch (err) { box.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`; }
}

function tenderCardHtml(t) {
  return `
    <div class="list-item">
      <div class="row">
        <div>
          <strong>${escapeHtml(t.title)}</strong> <span class="pill open">${categoryLabel(t.category)}</span>
          <div class="meta">${escapeHtml((t.company && (t.company.companyName || t.company.name)) || "")} - ${escapeHtml(t.location || "")}</div>
          <div class="meta">Ref: ${escapeHtml(t.referenceNumber || "")} ${t.submissionDeadline ? "- deadline " + formatDate(t.submissionDeadline) : ""}</div>
        </div>
      </div>
    </div>`;
}

function vendorCardHtml(v) {
  const businessName = (v.user && (v.user.businessName || v.user.name)) || "Vendor";
  return `
    <div class="list-item">
      <div class="row">
        <div>
          <strong>${escapeHtml(businessName)}</strong> <span class="pill verified">verified</span>
          <div class="meta">${(v.categories || []).map(categoryLabel).join(", ")} - ${v.experienceYears || 0} yrs experience</div>
          <div class="meta">${escapeHtml(v.description || "")}</div>
        </div>
      </div>
    </div>`;
}
