async function renderHome() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="hero reveal in-view">
      <div class="hero-content">
        <div class="hero-greeting">${greetingByTime()}</div>
        <h1>Find the right vendor for every tender, in one place</h1>
        <p>Canteen, water supply, transport, labour and more - manufacturing companies and vendors connect, bid, and get to work.</p>
        <div class="hero-stats" id="hero-stats">
          <div class="hero-stat"><div class="num">-</div><div class="lbl">Verified vendors</div></div>
          <div class="hero-stat"><div class="num">-</div><div class="lbl">Open tenders</div></div>
          <div class="hero-stat"><div class="num">-</div><div class="lbl">Companies</div></div>
        </div>
        <div class="hero-cta">
          <button class="cta-primary" id="cta-company">I'm a company - post a tender</button>
          <button class="cta-secondary" id="cta-vendor">I'm a vendor - find tenders</button>
        </div>
      </div>
    </div>

    <div class="section-head reveal"><h2>Recently joined vendors</h2><button class="see-all" data-goto="vendor">Browse all</button></div>
    <div class="hscroll" id="home-vendors">${skeletonHscroll()}</div>

    <div class="section-head reveal"><h2>Latest tenders published</h2><button class="see-all" data-goto="vendor">Browse all</button></div>
    <div class="hscroll" id="home-tenders">${skeletonHscroll()}</div>

    <div class="card reveal" style="margin-top:10px">
      <h3>How it works</h3>
      <div class="grid-4">
        <div><strong>1. Register</strong><div class="small-muted">Company or vendor, in a couple of minutes</div></div>
        <div><strong>2. Get verified</strong><div class="small-muted">Admin checks vendor documents</div></div>
        <div><strong>3. Publish or bid</strong><div class="small-muted">Post a tender, or apply to one</div></div>
        <div><strong>4. Get to work</strong><div class="small-muted">Company shortlists and awards</div></div>
      </div>
    </div>
  `;

  document.getElementById("cta-company").onclick = () => switchTab("company");
  document.getElementById("cta-vendor").onclick = () => switchTab("vendor");
  document.querySelectorAll("[data-goto]").forEach((b) => b.onclick = () => switchTab(b.dataset.goto));

  observeReveals(app);
  loadHomeStats();
  loadHomeVendors();
  loadHomeTenders();
}

function skeletonHscroll() {
  return `<div class="skeleton" style="min-width:240px;height:120px"></div><div class="skeleton" style="min-width:240px;height:120px"></div><div class="skeleton" style="min-width:240px;height:120px"></div>`;
}

async function loadHomeStats() {
  try {
    const [vendors, tenders] = await Promise.all([
      apiRequest("/vendors?verifiedOnly=true"),
      apiRequest("/tenders?status=open")
    ]);
    const nums = document.querySelectorAll("#hero-stats .num");
    nums[0].textContent = vendors.length;
    nums[1].textContent = tenders.length;
    nums[2].textContent = new Set(tenders.map((t) => t.company && t.company._id)).size || "-";
  } catch { /* silent on homepage */ }
}

async function loadHomeVendors() {
  const box = document.getElementById("home-vendors");
  try {
    const vendors = await apiRequest("/vendors/latest?limit=8");
    box.innerHTML = vendors.length ? vendors.map((v) => `
      <div class="showcase-card">
        <span class="showcase-badge"><i class="ti ti-check"></i> verified</span>
        <h3>${escapeHtml((v.user && (v.user.businessName || v.user.name)) || "Vendor")}</h3>
        <div class="meta">${(v.categories || []).map(categoryLabel).join(", ")}</div>
        <div class="meta" style="margin-top:6px">${v.experienceYears || 0} yrs experience</div>
      </div>
    `).join("") : `<div class="empty-state">No verified vendors yet - be the first to join.</div>`;
  } catch (err) { box.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`; }
}

async function loadHomeTenders() {
  const box = document.getElementById("home-tenders");
  try {
    const tenders = await apiRequest("/tenders/latest?limit=8");
    box.innerHTML = tenders.length ? tenders.map((t) => `
      <div class="showcase-card">
        <span class="showcase-badge" style="background:#eeedfe;color:#4338ca"><i class="ti ti-briefcase"></i> ${categoryLabel(t.category)}</span>
        <h3>${escapeHtml(t.title)}</h3>
        <div class="meta">${escapeHtml((t.company && (t.company.companyName || t.company.name)) || "")}</div>
        <div class="meta" style="margin-top:6px">${timeAgo(t.createdAt)}</div>
      </div>
    `).join("") : `<div class="empty-state">No open tenders yet.</div>`;
  } catch (err) { box.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`; }
}
