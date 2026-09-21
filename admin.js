"use strict";

document.addEventListener(
  "DOMContentLoaded",
  function () {

    Auth.requireRole(
      "ADMIN"
    );

  }
);
