"use strict";

if (
  "serviceWorker" in navigator
) {

  window.addEventListener(
    "load",
    async function () {

      try {

        const registration =
          await navigator
            .serviceWorker
            .register(
              "./sw.js"
            );

        console.log(
          "Service Worker aktif:",
          registration.scope
        );

      } catch (error) {

        console.error(
          "Service Worker gagal:",
          error
        );
      }
    }
  );
}
