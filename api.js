/* ── Shared API client, auth helpers, and UI utilities ── */

/* ── Core fetch wrapper ── */
async function request(method, path, body = null) {
  const baseUrl = localStorage.getItem("apiBaseUrl") || "http://localhost:3000";
  const token = localStorage.getItem("token");

  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const opts = { method, headers };
  if (body !== null) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(`${baseUrl}${path}`, opts);
    const ct = res.headers.get("content-type") || "";
    const data = ct.includes("application/json")
      ? await res.json()
      : await res.text();

    if (!res.ok) {
      const msg =
        typeof data === "object"
          ? (Array.isArray(data.message)
              ? data.message.join(", ")
              : data.message) || res.statusText
          : data || res.statusText;
      throw { status: res.status, message: msg };
    }
    return data;
  } catch (err) {
    if (err.status) throw err;
    throw { status: 0, message: "Cannot reach server — is it running?" };
  }
}

/* ── API methods ── */
const api = {
  /* Auth */
  login: (email, password) =>
    request("POST", "/auth/login", { email, password }),
  register: (name, email, password) =>
    request("POST", "/auth/register", { name, email, password }),
  verifyEmail: (email, code) =>
    request("POST", "/auth/verify-email", { email, code }),

  /* Users */
  getUsers: () => request("GET", "/users"),
  getUser: (id) => request("GET", `/users/${id}`),
  createUser: (d) => request("POST", "/users", d),
  updateUser: (id, d) => request("PATCH", `/users/${id}`, d),
  deleteUser: (id) => request("DELETE", `/users/${id}`),

  /* Projects */
  getProjects: () => request("GET", "/projects"),
  getProject: (id) => request("GET", `/projects/${id}`),
  createProject: (d) => request("POST", "/projects", d),
  updateProject: (id, d) => request("PATCH", `/projects/${id}`, d),
  deleteProject: (id) => request("DELETE", `/projects/${id}`),

  /* Tasks */
  getTasks: (pid) => request("GET", `/tasks${pid ? `?projectId=${pid}` : ""}`),
  getTask: (id) => request("GET", `/tasks/${id}`),
  createTask: (d) => request("POST", "/tasks", d),
  updateTask: (id, d) => request("PATCH", `/tasks/${id}`, d),
  deleteTask: (id) => request("DELETE", `/tasks/${id}`),
};

/* ── JWT payload decoder ── */
function decodeJwt(token) {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const padding = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
    return JSON.parse(atob(b64 + padding));
  } catch {
    return null;
  }
}

/* ── Auth session helpers ── */
const auth = {
  isLoggedIn: () => !!localStorage.getItem("token"),

  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem("currentUser"));
    } catch {
      return null;
    }
  },

  isAdmin: () => {
    const u = auth.getUser();
    return u && (u.role === "ADMIN" || u.role === "admin");
  },

  setSession: (data) => {
    /* Accept all common token field names from NestJS/Passport */
    const token =
      data.access_token || data.token || data.accessToken || data.jwt;

    if (!token) {
      console.warn(
        "[hub10] setSession: no token in response →",
        JSON.stringify(data),
      );
    }

    /* Build user object: explicit field → root-level id → decode JWT */
    let user = data.user || null;
    if (!user && data.id) user = data;
    if (!user && token) {
      const p = decodeJwt(token);
      if (p) {
        user = {
          id: p.sub || p.id || "",
          email: p.email || "",
          name: p.name || "",
          role: p.role || (p.roles && p.roles[0]) || "USER",
        };
      }
    }

    if (token) localStorage.setItem("token", token);
    if (user) localStorage.setItem("currentUser", JSON.stringify(user));

    console.log(
      "[hub10] session saved — token:",
      token ? token.slice(0, 20) + "…" : "NONE",
      "| role:",
      user?.role,
    );
  },

  clearSession: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
  },

  requireAuth: () => {
    if (!localStorage.getItem("token")) {
      window.location.href = "./login.html";
      return false;
    }
    return true;
  },

  requireAdmin: () => {
    if (!localStorage.getItem("token")) {
      window.location.href = "./login.html";
      return false;
    }
    if (!auth.isAdmin()) {
      window.location.href = "./user-dashboard.html";
      return false;
    }
    return true;
  },
};

/* ── UI helpers ── */
const ui = {
  showError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("hidden");
  },

  hideError(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  },

  setLoading(btnId, loading, loadText = "Loading…") {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    if (loading) {
      btn.dataset.orig = btn.textContent;
      btn.textContent = loadText;
    } else {
      btn.textContent = btn.dataset.orig || btn.textContent;
    }
  },

  showModal(id) {
    const m = document.getElementById(id);
    if (m) {
      m.classList.remove("hidden");
      m.classList.add("flex");
    }
  },

  hideModal(id) {
    const m = document.getElementById(id);
    if (m) {
      m.classList.add("hidden");
      m.classList.remove("flex");
    }
  },

  toast(msg, type = "success") {
    const palette = {
      success: "bg-green-800 border-green-600 text-green-100",
      error: "bg-red-800   border-red-600   text-red-100",
      warning: "bg-yellow-800 border-yellow-600 text-yellow-100",
      info: "bg-blue-800  border-blue-600   text-blue-100",
    };
    const t = document.createElement("div");
    t.className = `fixed bottom-5 right-5 px-4 py-3 rounded-xl border text-sm font-medium z-[9999] shadow-lg transition-opacity duration-300 ${palette[type] || palette.info}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => {
      t.style.opacity = "0";
      setTimeout(() => t.remove(), 300);
    }, 3000);
  },

  date(str) {
    if (!str) return "—";
    return new Date(str).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  },

  avatar(name = "?") {
    return (name[0] || "?").toUpperCase();
  },

  emptyRow(cols, msg = "No records found") {
    return `<tr><td colspan="${cols}" class="text-center py-10 text-slate-500">${msg}</td></tr>`;
  },
};
