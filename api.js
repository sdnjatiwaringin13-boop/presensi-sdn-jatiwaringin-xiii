"use strict";

const API_URL =
  "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";

const API_TIMEOUT = 15000;
const CACHE_TTL = 30000;

const requestCache = new Map();
const pendingRequests = new Map();

const CACHEABLE_ACTIONS = new Set([
  "getRekap",
  "getSiswa",
  "getGuru",
  "getKelas",
  "getKelasGuru",
  "getPengaturan"
]);

const WRITE_ACTIONS = new Set([
  "tambahSiswa",
  "updateSiswa",
  "hapusSiswa",

  "tambahGuru",
  "updateGuru",
  "hapusGuru",

  "tambahKelas",
  "updateKelas",
  "hapusKelas",

  "simpanPresensi",
  "simpanPengaturan"
]);

function cacheKey(payload) {
  return JSON.stringify(payload || {});
}

function clearAPICache() {

  requestCache.clear();
  pendingRequests.clear();

  try {

    Object.keys(sessionStorage)
      .filter(key =>
        key.startsWith("presensi_cache_")
      )
      .forEach(key =>
        sessionStorage.removeItem(key)
      );

  } catch (error) {}

}

async function callAPI(payload = {}) {

  const action =
    String(
      payload.action || ""
    ).trim();

  const key =
    cacheKey(payload);

  const now =
    Date.now();


  /* =========================================
     CACHE
  ========================================== */

  if (
    CACHEABLE_ACTIONS.has(action) &&
    !payload.forceRefresh
  ) {

    const cached =
      requestCache.get(key);

    if (
      cached &&
      now - cached.time < CACHE_TTL
    ) {

      return cached.data;

    }


    if (
      pendingRequests.has(key)
    ) {

      return pendingRequests.get(key);

    }

  }


  /* =========================================
     REQUEST
  ========================================== */

  const promise =
    (async function () {

      const controller =
        new AbortController();

      const timer =
        setTimeout(
          function () {
            controller.abort();
          },
          API_TIMEOUT
        );


      try {

        const response =
          await fetch(
            API_URL,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "text/plain;charset=utf-8"
              },

              body:
                JSON.stringify(
                  payload
                ),

              cache:
                "no-store",

              signal:
                controller.signal
            }
          );


        const text =
          await response.text();


        if (!response.ok) {

          throw new Error(
            `Server mengembalikan HTTP ${response.status}.`
          );

        }


        let result;


        try {

          result =
            JSON.parse(text);

        } catch (error) {

          throw new Error(
            "Respons server bukan JSON. Periksa deployment Apps Script."
          );

        }


        if (
          !result ||
          typeof result !== "object"
        ) {

          throw new Error(
            "Server tidak mengembalikan data yang valid."
          );

        }


        if (
          CACHEABLE_ACTIONS.has(action) &&
          result.success !== false &&
          !payload.forceRefresh
        ) {

          requestCache.set(
            key,
            {
              time: Date.now(),
              data: result
            }
          );

        }


        if (
          WRITE_ACTIONS.has(action)
        ) {

          clearAPICache();

        }


        return result;

      } catch (error) {

        if (
          error.name === "AbortError"
        ) {

          throw new Error(
            "Server terlalu lama merespons. Coba lagi."
          );

        }


        throw new Error(
          error.message ||
          "Tidak dapat terhubung ke server."
        );

      } finally {

        clearTimeout(timer);

        pendingRequests.delete(
          key
        );

      }

    })();


  if (
    CACHEABLE_ACTIONS.has(action) &&
    !payload.forceRefresh
  ) {

    pendingRequests.set(
      key,
      promise
    );

  }


  return promise;
}


/* =========================================
   UTILITIES
========================================== */

function escapeHTML(value) {

  return String(
    value ?? ""
  ).replace(
    /[&<>"']/g,
    function (char) {

      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[char];

    }
  );

}

function escapeAttr(value) {
  return escapeHTML(value);
}

function normalizeText(value) {
  return String(
    value ?? ""
  ).trim();
}

function upperText(value) {
  return normalizeText(
    value
  ).toUpperCase();
}


window.API_URL =
  API_URL;

window.callAPI =
  callAPI;

window.clearAPICache =
  clearAPICache;

window.escapeHTML =
  escapeHTML;

window.escapeAttr =
  escapeAttr;

window.normalizeText =
  normalizeText;

window.upperText =
  upperText;
