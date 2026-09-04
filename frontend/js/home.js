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

    <div class="section-head reveal"><h2>Recently joined vendors</h2><button class="see-all" data-goto="guest">Browse all</button></div>
    <div class="hscroll" id="home-vendors">${skeletonHscroll()}</div>

    <div class="section-head reveal"><h2>Recently joined companies</h2><button class="see-all" data-goto="guest">Browse all</button></div>
    <div class="hscroll" id="home-companies">${skeletonHscroll()}</div>

    <div class="section-head reveal"><h2>Latest tenders published</h2><button class="see-all" data-goto="guest">Browse all</button></div>
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
  loadHomeCompanies();
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
    box.innerHTML = vendors.length ? vendors.map(vendorShowcaseCardHtml).join("")
      : `<div class="empty-state">No verified vendors yet - be the first to join.</div>`;
    box.querySelectorAll("[data-open-vendor]").forEach((el) => el.onclick = () => openVendorShowcaseModal(el.dataset.openVendor, vendors));
  } catch (err) { box.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`; }
}

function vendorShowcaseCardHtml(v) {
  const work = v.previousWork || [];
  const photo = work.map((w) => (w.photoUrls || [])[0]).find(Boolean);
  const reviewText = v.achievements || v.description || "";
  const businessName = (v.user && (v.user.businessName || v.user.name)) || "Vendor";
  return `
    <div class="showcase-card" data-open-vendor="${v._id}" style="cursor:pointer;padding-top:0;overflow:hidden">
      ${photo
        ? `<img src="${fileUrl(photo)}" alt="" style="width:calc(100% + 36px);margin:0 -18px 12px;height:120px;object-fit:cover;display:block" />`
        : `<div style="width:calc(100% + 36px);margin:0 -18px 12px;height:120px;background:linear-gradient(135deg,#4338ca22,#0f766e22);display:flex;align-items:center;justify-content:center"><i class="ti ti-building-store" style="font-size:28px;color:#4338ca88"></i></div>`
      }
      <span class="showcase-badge"><i class="ti ti-check"></i> verified</span>
      <h3>${escapeHtml(businessName)}</h3>
      <div class="meta">${(v.categories || []).map(categoryLabel).join(", ")}</div>
      <div class="meta" style="margin-top:6px">${v.experienceYears || 0} yrs experience - ${work.length} previous work${work.length === 1 ? "" : "s"}</div>
      ${reviewText ? `<div class="meta" style="margin-top:8px;font-style:italic">"${escapeHtml(reviewText.slice(0, 90))}${reviewText.length > 90 ? "..." : ""}"</div>` : ""}
    </div>
  `;
}

function openVendorShowcaseModal(vendorId, vendorsCache) {
  const v = (vendorsCache || []).find((x) => x._id === vendorId);
  if (!v) return;
  const businessName = (v.user && (v.user.businessName || v.user.name)) || "Vendor";
  const work = v.previousWork || [];
  const allPhotos = work.flatMap((w) => (w.photoUrls || []).map((p) => ({ p, title: w.title, client: w.clientName })));

  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `
    <div class="modal-box" style="max-width:640px;max-height:88vh;overflow:auto">
      <h3 style="margin-bottom:2px">${escapeHtml(businessName)} <span class="pill verified">verified</span></h3>
      <div class="meta">${(v.categories || []).map(categoryLabel).join(", ")} - ${v.experienceYears || 0} yrs experience</div>
      ${v.description ? `<p style="font-size:14px">${escapeHtml(v.description)}</p>` : ""}
      ${v.achievements ? `<div class="card" style="background:#f8f8ff;padding:14px;margin:10px 0"><strong>Achievements / review</strong><p style="margin:6px 0 0;font-size:13.5px">${escapeHtml(v.achievements)}</p></div>` : ""}

      <hr class="divider-line"/>
      <strong>Previous work photos</strong>
      ${allPhotos.length ? `
        <div class="hscroll" style="margin-top:10px">
          ${allPhotos.map((ph) => `<div style="min-width:160px"><img src="${fileUrl(ph.p)}" style="width:160px;height:120px;object-fit:cover;border-radius:10px" /><div class="small-muted" style="margin-top:4px">${escapeHtml(ph.title)}</div></div>`).join("")}
        </div>` : `<div class="empty-state">No photos uploaded yet.</div>`}

      <hr class="divider-line"/>
      <strong>Previous work / experience (${work.length})</strong>
      ${work.length ? work.map((w) => `
        <div class="list-item">
          <strong>${escapeHtml(w.title)}</strong>
          <div class="meta">${escapeHtml(w.clientName)} - ${categoryLabel(w.category)} ${w.contractDuration ? "- " + escapeHtml(w.contractDuration) : ""}</div>
          ${w.description ? `<div class="meta" style="margin-top:4px">${escapeHtml(w.description)}</div>` : ""}
          ${w.notes ? `<div class="meta" style="margin-top:4px;font-style:italic">${escapeHtml(w.notes)}</div>` : ""}
        </div>`).join("") : `<div class="empty-state">No previous work added yet.</div>`}

      <button class="ghost" id="close-modal" style="margin-top:10px">Close</button>
    </div>`;
  document.body.appendChild(backdrop);
  backdrop.querySelector("#close-modal").onclick = () => backdrop.remove();
  backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.remove(); };
}

async function loadHomeCompanies() {
  const box = document.getElementById("home-companies");
  try {
    const companies = await apiRequest("/companies/latest?limit=8");
    box.innerHTML = companies.length ? companies.map((c) => `
      <div class="showcase-card">
        <span class="showcase-badge" style="background:#eeedfe;color:#4338ca"><i class="ti ti-building"></i> ${escapeHtml(c.industry || "company")}</span>
        <h3>${escapeHtml(c.companyName || c.name)}</h3>
        <div class="meta">${escapeHtml((c.address && c.address.city) || "")}</div>
        ${c.businessDescription ? `<div class="meta" style="margin-top:8px">${escapeHtml(c.businessDescription.slice(0, 90))}${c.businessDescription.length > 90 ? "..." : ""}</div>` : ""}
      </div>
    `).join("") : `<div class="empty-state">No companies joined yet - be the first to register.</div>`;
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
