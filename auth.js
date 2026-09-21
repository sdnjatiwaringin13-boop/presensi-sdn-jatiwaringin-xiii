(function () {

  "use strict";


  function getCurrentUser() {

    try {

      return JSON.parse(
        localStorage.getItem(
          "presensiUser"
        ) || "null"
      );

    } catch (error) {

      return null;
    }
  }


  function getRole(user) {

    return user
      ? String(
          user.role || ""
        ).toUpperCase()
      : "";
  }


  function logout() {

    localStorage.removeItem(
      "presensiUser"
    );

    location.href =
      "index.html";
  }


  function goDashboard() {

    location.href =
      "dashboard.html";
  }


  function requireLogin() {

    const user =
      getCurrentUser();


    if (!user) {

      location.href =
        "index.html";

      return null;
    }


    return user;
  }


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
              ).toUpperCase();
            }
          )

        : [
            String(
              allowedRoles
            ).toUpperCase()
          ];


    if (
      !allowed.includes(role)
    ) {

      alert(
        "Anda tidak memiliki akses ke halaman ini."
      );

      goDashboard();

      return null;
    }


    return user;
  }


  function displayUser(
    elementId
  ) {

    const element =
      document.getElementById(
        elementId
      );

    const user =
      getCurrentUser();


    if (element) {

      element.textContent =
        user
          ? (
              user.nama ||
              user.username
            )
          : "";
    }
  }


  function displayRole(
    elementId
  ) {

    const element =
      document.getElementById(
        elementId
      );

    const user =
      getCurrentUser();


    if (element) {

      element.textContent =
        user
          ? getRole(user)
          : "";
    }
  }


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
