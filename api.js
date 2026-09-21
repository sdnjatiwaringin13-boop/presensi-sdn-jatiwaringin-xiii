"use strict";

/* =========================================================
   API PRESENSI SD NEGERI JATIWARINGIN XIII
   ========================================================= */

const API_URL =
  "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";


/*
 * Jangan terlalu pendek.
 *
 * Apps Script kadang membutuhkan beberapa detik
 * saat pertama kali aktif / cold start.
 */
const API_TIMEOUT = 60000;


/*
 * Percobaan ulang jika gagal karena timeout/network.
 */
const API_RETRY = 2;


/*
 * Cache frontend.
 */
const CACHE_TTL = 60000;


/*
 * Cache memory.
 */
const requestCache = new Map();


/*
 * Request yang sedang berjalan.
 *
 * Kalau 3 halaman meminta getSiswa bersamaan,
 * cukup 1 request yang dikirim.
 */
const pendingRequests = new Map();


/* =========================================================
   ACTION YANG BOLEH DI-CACHE
   ========================================================= */

const CACHEABLE_ACTIONS = new Set([

  "getSiswa",

  "getGuru",

  "getKelas",

  "getKelasGuru",

  "getPengaturan",

  "getRekap",

  "getRekapPresensi"

]);


/* =========================================================
   ACTION YANG MENGUBAH DATA
   ========================================================= */

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
  "simpanPresensiBatch",

  "simpanPengaturan"

]);


/* =========================================================
   CACHE KEY
   ========================================================= */

function cacheKey(payload) {

  return JSON.stringify(
    payload || {}
  );

}


/* =========================================================
   BERSIHKAN CACHE
   ========================================================= */

function clearAPICache() {

  requestCache.clear();

  pendingRequests.clear();

  try {

    Object.keys(
      localStorage
    )
      .filter(
        key =>
          key.startsWith(
            "presensi_cache_"
          )
      )
      .forEach(
        key =>
          localStorage.removeItem(
            key
          )
      );

  } catch (_) {}

}


/* =========================================================
   REQUEST KE GOOGLE APPS SCRIPT
   ========================================================= */

async function callAPI(
  payload = {}
) {

  const action =
    String(
      payload.action || ""
    ).trim();


  if (!action) {

    throw new Error(
      "Action API tidak ditemukan."
    );

  }


  const key =
    cacheKey(payload);


  const now =
    Date.now();


  /*
   * ==============================================
   * CACHE MEMORY
   * ==============================================
   */

  if (
    CACHEABLE_ACTIONS.has(
      action
    ) &&
    !payload.forceRefresh
  ) {

    const cached =
      requestCache.get(
        key
      );


    if (
      cached &&
      now - cached.time <
        CACHE_TTL
    ) {

      return cached.data;

    }


    /*
     * Request sedang berjalan.
     */
    if (
      pendingRequests.has(
        key
      )
    ) {

      return pendingRequests.get(
        key
      );

    }

  }


  /*
   * ==============================================
   * REQUEST
   * ==============================================
   */

  const promise =
    requestWithRetry(
      payload,
      API_RETRY
    )
      .then(
        function (result) {


          if (
            CACHEABLE_ACTIONS.has(
              action
            ) &&
            result.success !== false &&
            !payload.forceRefresh
          ) {

            requestCache.set(
              key,
              {
                time:
                  Date.now(),

                data:
                  result
              }
            );

          }


          /*
           * Kalau ada operasi tulis,
           * cache harus dibersihkan.
           */
          if (
            WRITE_ACTIONS.has(
              action
            )
          ) {

            clearAPICache();

          }


          return result;

        }
      )
      .finally(
        function () {

          pendingRequests.delete(
            key
          );

        }
      );


  if (
    CACHEABLE_ACTIONS.has(
      action
    ) &&
    !payload.forceRefresh
  ) {

    pendingRequests.set(
      key,
      promise
    );

  }


  return promise;

}


/* =========================================================
   REQUEST + RETRY
   ========================================================= */

async function requestWithRetry(
  payload,
  retryLeft
) {

  try {

    return await requestOnce(
      payload
    );

  } catch (error) {

    console.warn(
      "API ERROR:",
      error
    );


    if (
      retryLeft > 0
    ) {

      /*
       * Tunggu sebentar sebelum retry.
       */
      await sleep(
        1000
      );


      return requestWithRetry(
        payload,
        retryLeft - 1
      );

    }


    throw error;

  }

}


/* =========================================================
   REQUEST SEKALI
   ========================================================= */

async function requestOnce(
  payload
) {

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

          method:
            "POST",

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


    if (
      !response.ok
    ) {

      throw new Error(
        "Server mengembalikan HTTP " +
        response.status
      );

    }


    let result;


    try {

      result =
        JSON.parse(
          text
        );

    } catch (_) {

      console.error(
        "RESPON SERVER:",
        text
      );


      throw new Error(
        "Respons server bukan JSON. " +
        "Pastikan deployment Apps Script sudah benar."
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


    return result;


  } catch (error) {


    if (
      error.name ===
      "AbortError"
    ) {

      throw new Error(
        "Server terlalu lama merespons. " +
        "Google Apps Script mungkin sedang sibuk. " +
        "Silakan coba lagi."
      );

    }


    throw new Error(
      error.message ||
      "Tidak dapat terhubung ke server."
    );


  } finally {

    clearTimeout(
      timer
    );

  }

}


/* =========================================================
   SLEEP
   ========================================================= */

function sleep(
  ms
) {

  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        ms
      )
  );

}


/* =========================================================
   UTILITAS
   ========================================================= */

function escapeHTML(
  value
) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


function escapeAttr(
  value
) {

  return escapeHTML(
    value
  );

}


function normalizeText(
  value
) {

  return String(
    value ?? ""
  ).trim();

}


function upperText(
  value
) {

  return normalizeText(
    value
  ).toUpperCase();

}


/* =========================================================
   EXPORT
   ========================================================= */

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
