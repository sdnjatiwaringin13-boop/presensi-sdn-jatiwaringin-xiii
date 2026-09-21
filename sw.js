"use strict";

const CACHE_NAME =
  "presensi-sdn-jatiwaringin-xiii-v3";

const APP_FILES = [
  "./",
  "./index.html",

  "./api.js",
  "./auth.js",
  "./script.js",
  "./layout.js",
  "./style.css",

  "./dashboard.html",
  "./dashboard.js",

  "./admin.html",
  "./admin.js",

  "./siswa.html",
  "./siswa.js",

  "./guru.html",
  "./guru.js",

  "./kelas.html",
  "./kelas.js",

  "./presensi.html",
  "./presensi.js",

  "./scan.html",
  "./scan.js",

  "./kartu.html",
  "./kartu.js",

  "./absen-bulanan.html",
  "./absen-bulanan.js",

  "./pengaturan.html",
  "./pengaturan.js",

  "./manifest.json",
  "./pwa.js"
];

self.addEventListener(
  "install",
  function (event) {

    event.waitUntil(
      caches
        .open(CACHE_NAME)
        .then(function (cache) {

          return cache.addAll(
            APP_FILES
          );
        })
    );

    self.skipWaiting();
  }
);

self.addEventListener(
  "activate",
  function (event) {

    event.waitUntil(
      caches
        .keys()
        .then(function (keys) {

          return Promise.all(
            keys
              .filter(
                key =>
                  key !==
                  CACHE_NAME
              )
              .map(
                key =>
                  caches.delete(
                    key
                  )
              )
          );
        })
    );

    self.clients.claim();
  }
);

self.addEventListener(
  "fetch",
  function (event) {

    const request =
      event.request;

    if (
      request.method !==
      "GET"
    ) {
      return;
    }

    const url =
      new URL(
        request.url
      );

    if (
      url.hostname.includes(
        "script.google.com"
      ) ||
      url.hostname.includes(
        "script.googleusercontent.com"
      )
    ) {
      return;
    }

    if (
      url.origin !==
      self.location.origin
    ) {
      return;
    }

    event.respondWith(
      fetch(request)
        .then(
          function (response) {

            if (
              response &&
              response.ok
            ) {

              const copy =
                response.clone();

              caches
                .open(
                  CACHE_NAME
                )
                .then(
                  cache =>
                    cache.put(
                      request,
                      copy
                    )
                );
            }

            return response;
          }
        )
        .catch(
          function () {

            return caches
              .match(request)
              .then(
                function (
                  cached
                ) {

                  return (
                    cached ||
                    caches.match(
                      "./index.html"
                    )
                  );
                }
              );
          }
        )
    );
  }
);
