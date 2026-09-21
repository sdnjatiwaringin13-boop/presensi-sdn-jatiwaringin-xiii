(function () {

  "use strict";


  if (
    "serviceWorker" in navigator
  ) {

    window.addEventListener(
      "load",
      function () {

        navigator.serviceWorker
          .register("./sw.js")
          .then(
            function (registration) {

              console.log(
                "Service Worker aktif:",
                registration.scope
              );

            }
          )
          .catch(
            function (error) {

              console.error(
                "Service Worker gagal:",
                error
              );

            }
          );

      }
    );

  }

})();
