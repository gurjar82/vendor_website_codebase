function getSession(role) {
  const raw = localStorage.getItem("session_" + role);
  return raw ? JSON.parse(raw) : null;
}
function setSession(role, data) { localStorage.setItem("session_" + role, JSON.stringify(data)); }
function clearSession(role) { localStorage.removeItem("session_" + role); }

let categoriesData = null;
async function loadCategories() {
  if (categoriesData) return categoriesData;
  categoriesData = await apiRequest("/categories");
  window.__categories = categoriesData.categories;
  return categoriesData;
}

function categoryOptionsHtml(selected) {
  const cats = (categoriesData && categoriesData.categories) || [];
  return cats.map((c) => `<option value="${c.value}" ${c.value === selected ? "selected" : ""}>${escapeHtml(c.label)}</option>`).join("");
}
