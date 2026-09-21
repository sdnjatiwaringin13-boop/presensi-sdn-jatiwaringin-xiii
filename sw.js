const CACHE_NAME =
  "presensi-sdn-jatiwaringin-v1";


const APP_FILES = [

  "./",

  "./index.html",

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

  "./auth.js",
  "./script.js",
  "./style.css",

  "./manifest.json",

  "./pwa.js"

];


self.addEventListener(
  "install",
  event => {

    event.waitUntil(

      caches
        .open(CACHE_NAME)
        .then(cache =>
          cache.addAll(
            APP_FILES
          )
        )

    );

    self.skipWaiting();

  }
);


self.addEventListener(
  "activate",
  event => {

    event.waitUntil(

      caches
        .keys()
        .then(keys =>
          Promise.all(

            keys
              .filter(
                key =>
                  key !== CACHE_NAME
              )
              .map(
                key =>
                  caches.delete(key)
              )

          )
        )

    );

    self.clients.claim();

  }
);


self.addEventListener(
  "fetch",
  event => {

    const request =
      event.request;


    if (
      request.method !== "GET"
    ) {
      return;
    }


    const url =
      new URL(
        request.url
      );


    /*
      API Apps Script tidak
      dicache oleh service worker.
    */

    if (
      url.hostname.includes(
        "script.google.com"
      )
    ) {
      return;
    }


    event.respondWith(

      fetch(request)
        .then(response => {

          if (
            response &&
            response.status === 200
          ) {

            const copy =
              response.clone();

            caches
              .open(CACHE_NAME)
              .then(cache =>
                cache.put(
                  request,
                  copy
                )
              );

          }

          return response;

        })
        .catch(() =>
          caches
            .match(request)
            .then(
              cached =>
                cached ||
                caches.match(
                  "./index.html"
                )
            )
        )

    );

  }
);
