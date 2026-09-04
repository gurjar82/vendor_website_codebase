function stepIndicatorHtml(total, current) {
  let html = `<div class="step-indicator">`;
  for (let i = 1; i <= total; i++) {
    html += `<div class="step-dot ${i < current ? "done" : i === current ? "active" : ""}">${i < current ? "&#10003;" : i}</div>`;
    if (i < total) html += `<div class="step-line"></div>`;
  }
  html += `</div>`;
  return html;
}

function authFormHtml(role, title) {
  return `
    <div class="card reveal in-view" style="max-width:640px;margin:24px auto">
      <h2>${title}</h2>
      <div class="tabs" style="margin-bottom:16px;background:#f5f4ff;padding:4px;border-radius:24px;display:inline-flex">
        <button class="tab-btn active" data-mode="login">Log in</button>
        <button class="tab-btn" data-mode="register">Register</button>
      </div>

      <form id="login-form-${role}">
        <label>Email</label><input name="email" type="email" required />
        <label>Password</label><input name="password" type="password" required />
        <button class="primary" type="submit">Log in</button>
      </form>

      <div id="register-wrap-${role}" style="display:none">
        ${role === "company" ? companyRegisterStepsHtml() : vendorRegisterStepsHtml()}
      </div>

      <div id="auth-msg-${role}"></div>
    </div>
  `;
}

function companyRegisterStepsHtml() {
  return `
    <div id="reg-step-indicator"></div>
    <form id="register-form-company">
      <div class="reg-step" data-step="1">
        <label>Full name (contact person)</label><input name="name" required />
        <label>Email</label><input name="email" type="email" required />
        <label>Phone</label><input name="phone" required />
        <label>Password</label><input name="password" type="password" minlength="6" required />
      </div>
      <div class="reg-step" data-step="2" style="display:none">
        <label>Company name</label><input name="companyName" required />
        <div class="grid-2">
          <div><label>Company type</label><input name="companyType" placeholder="Pvt Ltd, LLP, etc." /></div>
          <div><label>Industry</label><input name="industry" placeholder="e.g. Manufacturing" /></div>
        </div>
        <label>Registration number</label><input name="registrationNumber" />
        <label>Business description</label><textarea name="businessDescription"></textarea>
        <label>Website</label><input name="website" placeholder="https://" />
      </div>
      <div class="reg-step" data-step="3" style="display:none">
        <label>Registered address</label><input name="line1" placeholder="Street address" />
        <div class="grid-2">
          <div><label>City</label><input name="city" /></div>
          <div><label>State</label><input name="state" /></div>
        </div>
        <div class="grid-2">
          <div><label>Country</label><input name="country" value="India" /></div>
          <div><label>PIN code</label><input name="pinCode" /></div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:16px">
        <button type="button" class="ghost" id="reg-back-company" style="display:none">Back</button>
        <button type="button" class="primary" id="reg-next-company">Continue</button>
        <button type="submit" class="primary" id="reg-submit-company" style="display:none">Create account</button>
      </div>
    </form>
  `;
}

function vendorRegisterStepsHtml() {
  return `
    <div id="reg-step-indicator"></div>
    <form id="register-form-vendor">
      <div class="reg-step" data-step="1">
        <label>Full name</label><input name="name" required />
        <label>Email</label><input name="email" type="email" required />
        <label>Phone</label><input name="phone" required />
        <label>Password</label><input name="password" type="password" minlength="6" required />
      </div>
      <div class="reg-step" data-step="2" style="display:none">
        <label>Business name</label><input name="businessName" required />
        <div class="grid-2">
          <div><label>Business type</label><input name="businessType" placeholder="Proprietorship, Pvt Ltd..." /></div>
          <div><label>Owner / authorized person</label><input name="ownerName" /></div>
        </div>
        <div class="grid-2">
          <div><label>Business start date</label><input name="businessStartDate" type="date" /></div>
          <div><label>GST number</label><input name="gstNumber" /></div>
        </div>
        <label>Website</label><input name="website" placeholder="https://" />
        <label>Address</label><input name="line1" placeholder="Street address" />
        <div class="grid-3">
          <div><label>City</label><input name="city" /></div>
          <div><label>State</label><input name="state" /></div>
          <div><label>PIN code</label><input name="pinCode" /></div>
        </div>
      </div>
      <div class="reg-step" data-step="3" style="display:none">
        <label>Which services do you offer? (select all that apply)</label>
        <div class="chip-group" id="vendor-reg-categories"></div>
        <label>Years of experience</label><input name="experienceYears" type="number" min="0" />
        <label>Short description of your work</label><textarea name="description"></textarea>
        <div id="vendor-reg-labour-fields" style="display:none"></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:16px">
        <button type="button" class="ghost" id="reg-back-vendor" style="display:none">Back</button>
        <button type="button" class="primary" id="reg-next-vendor">Continue</button>
        <button type="submit" class="primary" id="reg-submit-vendor" style="display:none">Create account</button>
      </div>
    </form>
  `;
}

function attachAuthHandlers(role) {
  const loginForm = document.getElementById("login-form-" + role);
  const registerWrap = document.getElementById("register-wrap-" + role);
  const msg = document.getElementById("auth-msg-" + role);

  document.querySelectorAll(`[data-mode]`).forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll(`[data-mode]`).forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const isLogin = btn.dataset.mode === "login";
      loginForm.style.display = isLogin ? "block" : "none";
      registerWrap.style.display = isLogin ? "none" : "block";
    };
  });

  loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      const data = await apiRequest("/auth/login", { method: "POST", body: { email: f.get("email"), password: f.get("password") } });
      if (data.user.role !== role) throw new Error(`This account is registered as ${data.user.role}, not ${role}`);
      setSession(role, data);
      toast("Welcome back, " + (data.user.businessName || data.user.companyName || data.user.name) + "!", "success");
      render();
    } catch (err) { msg.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`; }
  };

  setupRegisterWizard(role, msg);
}

function setupRegisterWizard(role, msg) {
  const totalSteps = role === "company" ? 3 : 3;
  let step = 1;
  const form = document.getElementById("register-form-" + role);
  const indicator = document.getElementById("reg-step-indicator");
  const nextBtn = document.getElementById("reg-next-" + role);
  const backBtn = document.getElementById("reg-back-" + role);
  const submitBtn = document.getElementById("reg-submit-" + role);
  let selectedCategories = [];

  if (role === "vendor") {
    const chipBox = document.getElementById("vendor-reg-categories");
    chipBox.innerHTML = (categoriesData.categories || []).map((c) =>
      `<button type="button" class="chip" data-cat="${c.value}">${escapeHtml(c.label)}</button>`).join("");
    chipBox.querySelectorAll(".chip").forEach((chip) => {
      chip.onclick = () => {
        const cat = chip.dataset.cat;
        if (selectedCategories.includes(cat)) selectedCategories = selectedCategories.filter((c) => c !== cat);
        else selectedCategories.push(cat);
        chip.classList.toggle("selected");
        renderVendorLabourFields();
      };
    });
  }

  function renderVendorLabourFields() {
    const box = document.getElementById("vendor-reg-labour-fields");
    if (!selectedCategories.includes("labour")) { box.style.display = "none"; box.innerHTML = ""; return; }
    box.style.display = "block";
    const fields = categoriesData.labourVendorFields || [];
    box.innerHTML = `<hr class="divider-line"/><label style="margin-top:0">Labour / manpower supply details</label>` +
      fields.map((f) => renderDynamicFieldInput(f, "labour_")).join("");
  }

  function updateStepView() {
    form.querySelectorAll(".reg-step").forEach((s) => s.style.display = Number(s.dataset.step) === step ? "block" : "none");
    indicator.innerHTML = stepIndicatorHtml(totalSteps, step);
    backBtn.style.display = step > 1 ? "inline-block" : "none";
    nextBtn.style.display = step < totalSteps ? "inline-block" : "none";
    submitBtn.style.display = step === totalSteps ? "inline-block" : "none";
  }
  updateStepView();

  nextBtn.onclick = () => {
    const currentFieldset = form.querySelector(`.reg-step[data-step="${step}"]`);
    const inputs = currentFieldset.querySelectorAll("input[required], select[required]");
    for (const inp of inputs) if (!inp.value) { inp.reportValidity(); return; }
    step = Math.min(totalSteps, step + 1);
    updateStepView();
  };
  backBtn.onclick = () => { step = Math.max(1, step - 1); updateStepView(); };

  form.onsubmit = async (e) => {
    e.preventDefault();
    if (role === "vendor" && !selectedCategories.length) {
      msg.innerHTML = `<div class="error-msg">Select at least one service category</div>`;
      return;
    }
    const f = new FormData(form);
    try {
      submitBtn.disabled = true;
      let body;
      if (role === "company") {
        body = {
          role, name: f.get("name"), email: f.get("email"), phone: f.get("phone"), password: f.get("password"),
          companyName: f.get("companyName"), companyType: f.get("companyType"), industry: f.get("industry"),
          registrationNumber: f.get("registrationNumber"), businessDescription: f.get("businessDescription"),
          website: f.get("website"),
          address: { line1: f.get("line1"), city: f.get("city"), state: f.get("state"), country: f.get("country"), pinCode: f.get("pinCode") }
        };
      } else {
        body = {
          role, name: f.get("name"), email: f.get("email"), phone: f.get("phone"), password: f.get("password"),
          businessName: f.get("businessName"), businessType: f.get("businessType"), ownerName: f.get("ownerName"),
          businessStartDate: f.get("businessStartDate"), gstNumber: f.get("gstNumber"), website: f.get("website"),
          address: { line1: f.get("line1"), city: f.get("city"), state: f.get("state"), pinCode: f.get("pinCode") }
        };
      }
      const data = await apiRequest("/auth/register", { method: "POST", body });
      setSession(role, data);

      if (role === "vendor") {
        const labourDetails = selectedCategories.includes("labour") ? collectDynamicFieldValues(form, categoriesData.labourVendorFields, "labour_") : undefined;
        await apiRequest("/vendors/profile", {
          method: "POST", token: data.token,
          body: {
            categories: selectedCategories,
            experienceYears: Number(f.get("experienceYears") || 0),
            description: f.get("description"),
            labourDetails
          }
        });
      }
      toast("Account created! Welcome to the platform.", "success");
      render();
    } catch (err) {
      msg.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`;
    } finally {
      submitBtn.disabled = false;
    }
  };
}

// ---------- generic dynamic field renderer (used for labour vendor fields, tender builder, bids) ----------
function renderDynamicFieldInput(field, prefix = "") {
  const name = prefix + field.id;
  const req = field.required ? "required" : "";
  switch (field.type) {
    case "textarea":
      return `<label>${escapeHtml(field.label)}</label><textarea name="${name}" ${req}></textarea>`;
    case "number":
      return `<label>${escapeHtml(field.label)}</label><input type="number" name="${name}" ${req} />`;
    case "date":
      return `<label>${escapeHtml(field.label)}</label><input type="date" name="${name}" ${req} />`;
    case "dropdown":
      return `<label>${escapeHtml(field.label)}</label><select name="${name}" ${req}><option value="">Select...</option>${(field.options || []).map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join("")}</select>`;
    case "multiselect":
      return `<label>${escapeHtml(field.label)}</label><div class="chip-group" data-multiselect="${name}">${(field.options || []).map((o) => `<button type="button" class="chip" data-val="${escapeHtml(o)}">${escapeHtml(o)}</button>`).join("")}</div>`;
    case "checkbox":
      return `<div class="checkbox-row"><input type="checkbox" name="${name}" id="fld-${name}"/><label style="margin:0" for="fld-${name}">${escapeHtml(field.label)}</label></div>`;
    case "file":
      return `<label>${escapeHtml(field.label)}</label><input type="file" name="${name}" />`;
    default:
      return `<label>${escapeHtml(field.label)}</label><input type="text" name="${name}" ${req} />`;
  }
}

function activateMultiselectChips(root) {
  root.querySelectorAll("[data-multiselect]").forEach((group) => {
    group.querySelectorAll(".chip").forEach((chip) => {
      chip.onclick = () => chip.classList.toggle("selected");
    });
  });
}

function collectDynamicFieldValues(form, fields, prefix = "") {
  const result = {};
  const fd = new FormData(form);
  (fields || []).forEach((field) => {
    const name = prefix + field.id;
    if (field.type === "checkbox") {
      result[field.id] = form.querySelector(`[name="${name}"]`) ? form.querySelector(`[name="${name}"]`).checked : false;
    } else if (field.type === "multiselect") {
      const group = form.querySelector(`[data-multiselect="${name}"]`);
      result[field.id] = group ? Array.from(group.querySelectorAll(".chip.selected")).map((c) => c.dataset.val) : [];
    } else {
      result[field.id] = fd.get(name) || "";
    }
  });
  // map generic ids to the LabourDetails schema shape when used for vendor labour profile
  if (prefix === "labour_") {
    return {
      labourSupplyTypes: result.labour_supply_types || [],
      totalManpower: result.total_manpower ? Number(result.total_manpower) : undefined,
      maxCapacity: result.max_capacity ? Number(result.max_capacity) : undefined,
      serviceLocations: result.service_locations || "",
      accommodation: !!result.accommodation,
      transportation: !!result.transportation,
      payrollCapability: !!result.payroll_capability
    };
  }
  return result;
}
