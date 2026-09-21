(function () {

  "use strict";

  Auth.requireRole("ADMIN");

  document.addEventListener(
    "DOMContentLoaded",
    function () {

      console.log(
        "Halaman administrasi aktif."
      );

    }
  );

})();
