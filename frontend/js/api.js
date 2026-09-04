const API_BASE = "http://localhost:5000";

async function apiRequest(path, { method = "GET", body, token, isForm = false } = {}) {
  const headers = {};
  if (token) headers.Authorization = "Bearer " + token;
  if (!isForm) headers["Content-Type"] = "application/json";

  const res = await fetch(API_BASE + "/api" + path, {
    method,
    headers,
    body: isForm ? body : (body ? JSON.stringify(body) : undefined)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
}

// convenience for building multipart/form-data bodies (file uploads)
function buildFormData(fields, files) {
  const fd = new FormData();
  Object.entries(fields || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    fd.append(k, typeof v === "object" ? JSON.stringify(v) : v);
  });
  Object.entries(files || {}).forEach(([fieldName, fileOrList]) => {
    if (!fileOrList) return;
    if (fileOrList instanceof FileList || Array.isArray(fileOrList)) {
      Array.from(fileOrList).forEach((f) => fd.append(fieldName, f));
    } else {
      fd.append(fieldName, fileOrList);
    }
  });
  return fd;
}

function fileUrl(path) {
  if (!path) return "";
  return path.startsWith("http") ? path : API_BASE + path;
}
