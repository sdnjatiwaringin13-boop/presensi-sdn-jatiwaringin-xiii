"use strict";

(function () {
  const STORAGE_KEY = "presensiUser";

  function getCurrentUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const user = JSON.parse(raw);
      return user && typeof user === "object" ? user : null;
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }

  function getRole(user = getCurrentUser()) {
    return user ? String(user.role || "").toUpperCase() : "";
  }

  function requireLogin() {
    const user = getCurrentUser();
    if (!user) {
      location.replace("index.html");
      return null;
    }
    return user;
  }

  function requireRole(allowedRoles) {
    const user = requireLogin();
    if (!user) return null;
    const allowed = (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles])
      .map(x => String(x || "").toUpperCase());
    if (!allowed.includes(getRole(user))) {
      location.replace("dashboard.html");
      return null;
    }
    return user;
  }

  function requireAdmin() { return requireRole("ADMIN"); }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    try { sessionStorage.clear(); } catch (_) {}
    location.replace("index.html");
  }

  window.Auth = { getCurrentUser, getRole, requireLogin, requireRole, requireAdmin, logout, goDashboard: () => location.href = "dashboard.html" };
  window.getCurrentUser = getCurrentUser;
  window.requireAdmin = requireAdmin;
  window.logout = logout;
})();
