(function () {
  "use strict";

  const STORAGE_KEY = "presensiUser";

  function getCurrentUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return null;
      }

      const user = JSON.parse(raw);

      if (!user || typeof user !== "object") {
        return null;
      }

      return user;

    } catch (error) {
      console.error("Gagal membaca user:", error);

      localStorage.removeItem(STORAGE_KEY);

      return null;
    }
  }

  function getRole(user = getCurrentUser()) {
    return user
      ? String(user.role || "").toUpperCase()
      : "";
  }

  function requireLogin() {
    const user = getCurrentUser();

    if (!user) {
      location.href = "index.html";
      return null;
    }

    return user;
  }

  function requireRole(allowedRoles) {
    const user = requireLogin();

    if (!user) {
      return null;
    }

    const role = getRole(user);

    const allowed = (
      Array.isArray(allowedRoles)
        ? allowedRoles
        : [allowedRoles]
    ).map(function (item) {
      return String(item || "").toUpperCase();
    });

    if (!allowed.includes(role)) {
      alert(
        "Anda tidak memiliki akses ke halaman ini."
      );

      location.href = "dashboard.html";

      return null;
    }

    return user;
  }

  function requireAdmin() {
    return requireRole("ADMIN");
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);

    location.href = "index.html";
  }

  function goDashboard() {
    location.href = "dashboard.html";
  }

  window.Auth = {
    getCurrentUser,
    getRole,
    requireLogin,
    requireRole,
    requireAdmin,
    logout,
    goDashboard
  };

  // kompatibilitas kode lama
  window.getCurrentUser = getCurrentUser;
  window.requireAdmin = requireAdmin;
  window.logout = logout;

})();
