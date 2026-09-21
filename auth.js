/*******************************************************
 * AUTHENTICATION & ROLE PROTECTION
 * SD NEGERI JATIWARINGIN XIII
 *******************************************************/

(function () {

  "use strict";


  /* =====================================================
     USER LOGIN
  ===================================================== */

  function getCurrentUser() {

    try {

      const saved =
        localStorage.getItem(
          "presensiUser"
        );


      if (!saved) {
        return null;
      }


      const user =
        JSON.parse(saved);


      if (
        !user ||
        !user.role
      ) {

        return null;

      }


      return user;


    } catch (error) {

      console.error(
        "Gagal membaca user:",
        error
      );


      return null;

    }

  }


  /* =====================================================
     LOGOUT
  ===================================================== */

  function logout() {

    localStorage.removeItem(
      "presensiUser"
    );


    window.location.href =
      "index.html";

  }


  /* =====================================================
     DASHBOARD
  ===================================================== */

  function goDashboard() {

    window.location.href =
      "dashboard.html";

  }


  /* =====================================================
     NORMALISASI ROLE
  ===================================================== */

  function getRole(user) {

    if (!user) {
      return "";
    }


    return String(
      user.role || ""
    )
      .trim()
      .toUpperCase();

  }


  /* =====================================================
     PROTEKSI LOGIN
  ===================================================== */

  function requireLogin() {

    const user =
      getCurrentUser();


    if (!user) {

      window.location.href =
        "index.html";

      return null;

    }


    return user;

  }


  /* =====================================================
     PROTEKSI ROLE
     
     roles:
     
     ["ADMIN"]
     ["GURU"]
     ["ADMIN", "GURU"]
  ===================================================== */

  function requireRole(
    allowedRoles
  ) {

    const user =
      requireLogin();


    if (!user) {
      return null;
    }


    const role =
      getRole(user);


    const allowed =
      Array.isArray(
        allowedRoles
      )
        ? allowedRoles.map(
            function (item) {

              return String(
                item
              )
                .trim()
                .toUpperCase();

            }
          )
        : [];


    if (
      allowed.indexOf(role) === -1
    ) {

      alert(
        "Anda tidak memiliki akses ke halaman ini."
      );


      window.location.href =
        "dashboard.html";


      return null;

    }


    return user;

  }


  /* =====================================================
     TAMPILKAN USER
  ===================================================== */

  function displayUser(
    elementId
  ) {

    const element =
      document.getElementById(
        elementId
      );


    if (!element) {
      return;
    }


    const user =
      getCurrentUser();


    if (!user) {

      element.textContent =
        "";

      return;

    }


    element.textContent =
      user.nama ||
      user.username ||
      "Pengguna";

  }


  /* =====================================================
     TAMPILKAN ROLE
  ===================================================== */

  function displayRole(
    elementId
  ) {

    const element =
      document.getElementById(
        elementId
      );


    if (!element) {
      return;
    }


    const user =
      getCurrentUser();


    if (!user) {

      element.textContent =
        "";

      return;

    }


    const role =
      getRole(user);


    if (role === "ADMIN") {

      element.textContent =
        "ADMIN";

    } else if (
      role === "GURU"
    ) {

      element.textContent =
        "GURU / WALI KELAS";

    } else {

      element.textContent =
        role;

    }

  }


  /* =====================================================
     EXPORT
  ===================================================== */

  window.Auth = {

    getCurrentUser:
      getCurrentUser,

    getRole:
      getRole,

    logout:
      logout,

    goDashboard:
      goDashboard,

    requireLogin:
      requireLogin,

    requireRole:
      requireRole,

    displayUser:
      displayUser,

    displayRole:
      displayRole

  };


})();
