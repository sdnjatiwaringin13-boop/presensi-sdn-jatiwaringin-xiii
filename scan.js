"use strict";

(function () {

  let scanner = null;
  let scanning = false;
  let processing = false;

  let user = null;
  let idGuru = "";

  let lastQR = "";
  let lastScanTime = 0;

  const DUPLICATE_DELAY = 5000;

  // =========================================================
  // HELPER
  // =========================================================

  function $(id) {
    return document.getElementById(id);
  }

  function setStatus(text, type) {
    const el = $("scanStatus");

    if (!el) return;

    el.textContent = text;

    el.className = "scan-status";

    if (type) {
      el.classList.add(type);
    }
  }

  function showResult(html, type) {
    const el = $("result");

    if (!el) return;

    el.innerHTML = html;
    el.className = "scan-result";

    if (type) {
      el.classList.add(type);
    }
  }

  function getCurrentUserSafe() {

    try {

      if (typeof getCurrentUser === "function") {
        return getCurrentUser();
      }

    } catch (e) {
      console.warn("getCurrentUser error:", e);
    }

    try {

      if (window.Auth && typeof window.Auth.getCurrentUser === "function") {
        return window.Auth.getCurrentUser();
      }

    } catch (e) {
      console.warn("Auth.getCurrentUser error:", e);
    }

    try {

      const data = localStorage.getItem("presensiUser");

      if (data) {
        return JSON.parse(data);
      }

    } catch (e) {
      console.warn("localStorage user error:", e);
    }

    return null;
  }


  // =========================================================
  // TAMPILKAN USER
  // =========================================================

  function tampilkanUser() {

    const namaEl = $("guruNama");
    const roleEl = $("guruRole");

    if (!user) return;

    if (namaEl) {
      namaEl.textContent =
        user.nama ||
        user.namaGuru ||
        user.username ||
        "Pengguna";
    }

    if (roleEl) {
      roleEl.textContent =
        user.role ||
        "GURU";
    }
  }


  // =========================================================
  // CEK LOGIN
  // =========================================================

  function cekLogin() {

    user = getCurrentUserSafe();

    if (!user) {

      alert("Silakan login terlebih dahulu.");

      window.location.href = "index.html";

      return false;
    }

    const role = String(user.role || "").toUpperCase();

    if (role !== "ADMIN" && role !== "GURU") {

      alert("Anda tidak mempunyai akses ke halaman Scan QR.");

      window.location.href = "index.html";

      return false;
    }

    idGuru =
      user.idGuru ||
      user.ID_GURU ||
      "";

    tampilkanUser();

    return true;
  }


  // =========================================================
  // CEK BROWSER
  // =========================================================

  function cekBrowser() {

    if (!window.isSecureContext) {

      setStatus(
        "Kamera membutuhkan HTTPS.",
        "error"
      );

      showResult(
        `
        <div class="error-box">
          <strong>HTTPS diperlukan</strong><br>
          Buka website melalui HTTPS agar kamera dapat digunakan.
        </div>
        `,
        "error"
      );

      return false;
    }

    if (!navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia) {

      setStatus(
        "Browser tidak mendukung kamera.",
        "error"
      );

      showResult(
        `
        <div class="error-box">
          Browser ini tidak mendukung akses kamera.
          Silakan gunakan Google Chrome.
        </div>
        `,
        "error"
      );

      return false;
    }

    if (typeof window.Html5Qrcode === "undefined") {

      setStatus(
        "Library scanner belum dimuat.",
        "error"
      );

      showResult(
        `
        <div class="error-box">
          Library QR Scanner belum berhasil dimuat.
          Pastikan koneksi internet aktif.
        </div>
        `,
        "error"
      );

      return false;
    }

    return true;
  }


  // =========================================================
  // MULAI SCANNER
  // =========================================================

  async function startCamera() {

    if (scanning) {
      return;
    }

    if (!cekBrowser()) {
      return;
    }

    const reader = $("reader");

    if (!reader) {

      console.error(
        "Element #reader tidak ditemukan."
      );

      return;
    }

    try {

      processing = false;

      lastQR = "";
      lastScanTime = 0;

      reader.innerHTML = "";

      scanner = new Html5Qrcode("reader");

      const config = {

        fps: 12,

        qrbox: function (
          viewfinderWidth,
          viewfinderHeight
        ) {

          const size = Math.floor(
            Math.min(
              viewfinderWidth,
              viewfinderHeight
            ) * 0.70
          );

          return {
            width: size,
            height: size
          };
        },

        aspectRatio: 1.0,

        disableFlip: false

      };


      setStatus(
        "Meminta izin kamera...",
        "loading"
      );


      // =====================================================
      // COBA KAMERA BELAKANG
      // =====================================================

      try {

        await scanner.start(

          {
            facingMode: {
              exact: "environment"
            }
          },

          config,

          onScanSuccess,

          onScanFailure

        );

        scanning = true;

        setStatus(
          "Kamera aktif — arahkan QR ke kotak scanner.",
          "success"
        );

        return;

      } catch (firstError) {

        console.warn(
          "Kamera environment gagal:",
          firstError
        );

      }


      // =====================================================
      // FALLBACK PILIH KAMERA
      // =====================================================

      let cameras = [];

      try {

        cameras =
          await Html5Qrcode.getCameras();

      } catch (cameraError) {

        console.error(
          "Gagal mendapatkan kamera:",
          cameraError
        );

      }


      if (!cameras || cameras.length === 0) {

        throw new Error(
          "Kamera tidak ditemukan."
        );
      }


      let selectedCamera =
        cameras.find(function (camera) {

          const label =
            String(camera.label || "")
              .toLowerCase();

          return (
            label.includes("back") ||
            label.includes("rear") ||
            label.includes("environment") ||
            label.includes("belakang")
          );

        });


      if (!selectedCamera) {
        selectedCamera = cameras[0];
      }


      await scanner.start(

        selectedCamera.id,

        config,

        onScanSuccess,

        onScanFailure

      );


      scanning = true;

      setStatus(
        "Kamera aktif — arahkan QR ke kotak scanner.",
        "success"
      );


    } catch (error) {

      console.error(
        "Gagal menjalankan kamera:",
        error
      );

      scanning = false;

      let message =
        error && error.message
          ? error.message
          : String(error);


      if (
        message.toLowerCase().includes("permission") ||
        message.toLowerCase().includes("denied") ||
        message.toLowerCase().includes("notallowed")
      ) {

        message =
          "Izin kamera ditolak. Silakan izinkan kamera pada browser.";

      } else if (
        message.toLowerCase().includes("notfound") ||
        message.toLowerCase().includes("camera")
      ) {

        message =
          "Kamera tidak ditemukan atau sedang digunakan aplikasi lain.";

      }


      setStatus(
        "Kamera gagal dijalankan.",
        "error"
      );


      showResult(
        `
        <div class="error-box">

          <strong>Kamera tidak dapat digunakan</strong>

          <p>${escapeHTML(message)}</p>

          <p>
            Pastikan:
          </p>

          <ol>
            <li>Website menggunakan HTTPS.</li>
            <li>Browser mendapat izin menggunakan kamera.</li>
            <li>Kamera tidak sedang digunakan aplikasi lain.</li>
            <li>Gunakan Google Chrome.</li>
          </ol>

        </div>
        `,
        "error"
      );

    }

  }


  // =========================================================
  // HASIL SCAN
  // =========================================================

  async function onScanSuccess(decodedText) {

    if (processing) {
      return;
    }

    const raw =
      String(decodedText || "").trim();


    if (!raw) {
      return;
    }


    const now =
      Date.now();


    // Hindari QR yang sama diproses berulang kali
    if (
      raw === lastQR &&
      now - lastScanTime < DUPLICATE_DELAY
    ) {
      return;
    }


    lastQR = raw;
    lastScanTime = now;

    processing = true;


    setStatus(
      "QR berhasil dibaca. Memproses...",
      "loading"
    );


    showResult(
      `
      <div class="loading-box">
        <strong>QR terbaca</strong><br>
        Memeriksa data siswa...
      </div>
      `,
      "loading"
    );


    try {

      if (
        typeof callAPI !== "function"
      ) {

        throw new Error(
          "Fungsi callAPI tidak ditemukan. Pastikan api.js sudah dimuat."
        );

      }


      const payload = {

        action: "scanPresensi",

        qr: raw,

        idGuru: idGuru

      };


      console.log(
        "Mengirim data scan:",
        payload
      );


      const response =
        await callAPI(payload);


      console.log(
        "Response scan:",
        response
      );


      if (
        !response ||
        response.success !== true
      ) {

        throw new Error(
          response &&
          (
            response.message ||
            response.error
          )
            ? (
                response.message ||
                response.error
              )
            : "Presensi gagal disimpan."
        );

      }


      const data =
        response.data || response;


      const nama =
        data.nama ||
        data.NAMA ||
        "-";


      const nisn =
        data.nisn ||
        data.NISN ||
        "-";


      const kelas =
        data.kelas ||
        data.KELAS ||
        "-";


      const status =
        data.status ||
        data.STATUS ||
        "HADIR";


      const jam =
        data.jam ||
        data.JAM ||
        "";


      setStatus(
        "Presensi berhasil.",
        "success"
      );


      showResult(

        `
        <div class="success-box">

          <div class="success-title">
            ✓ PRESENSI BERHASIL
          </div>

          <div class="student-info">

            <div>
              <strong>Nama</strong>
              <span>${escapeHTML(nama)}</span>
            </div>

            <div>
              <strong>NISN</strong>
              <span>${escapeHTML(nisn)}</span>
            </div>

            <div>
              <strong>Kelas</strong>
              <span>${escapeHTML(kelas)}</span>
            </div>

            <div>
              <strong>Status</strong>
              <span>${escapeHTML(status)}</span>
            </div>

            ${
              jam
                ? `
                  <div>
                    <strong>Jam</strong>
                    <span>${escapeHTML(jam)}</span>
                  </div>
                `
                : ""
            }

          </div>

        </div>
        `,

        "success"

      );


    } catch (error) {

      console.error(
        "Gagal menyimpan presensi:",
        error
      );


      setStatus(
        "Presensi gagal.",
        "error"
      );


      showResult(

        `
        <div class="error-box">

          <div class="error-title">
            ✕ PRESENSI GAGAL
          </div>

          <p>
            ${escapeHTML(
              error && error.message
                ? error.message
                : String(error)
            )}
          </p>

        </div>
        `,

        "error"

      );

    } finally {

      // Beri jeda supaya QR yang sama
      // tidak langsung diproses berkali-kali.

      setTimeout(function () {

        processing = false;

      }, 1200);

    }

  }


  // =========================================================
  // SCAN FAILURE
  // =========================================================

  function onScanFailure(errorMessage) {

    // Jangan tampilkan error setiap frame.
    // html5-qrcode memang mengirim banyak
    // callback ketika QR belum ditemukan.

  }


  // =========================================================
  // STOP CAMERA
  // =========================================================

  async function stopCamera() {

    if (!scanner) {
      return;
    }


    try {

      if (scanning) {

        await scanner.stop();

      }

    } catch (error) {

      console.warn(
        "Gagal stop scanner:",
        error
      );

    }


    try {

      await scanner.clear();

    } catch (error) {

      console.warn(
        "Gagal clear scanner:",
        error
      );

    }


    scanner = null;

    scanning = false;

    processing = false;


    setStatus(
      "Kamera berhenti.",
      ""
    );


    const reader = $("reader");

    if (reader) {
      reader.innerHTML = "";
    }

  }


  // =========================================================
  // ESCAPE HTML
  // =========================================================

  function escapeHTML(value) {

    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }


  // =========================================================
  // TOMBOL
  // =========================================================

  function pasangEvent() {

    const startButton =
      $("startCamera");

    const stopButton =
      $("stopCamera");


    if (startButton) {

      startButton.addEventListener(
        "click",
        function () {

          startCamera();

        }
      );

    }


    if (stopButton) {

      stopButton.addEventListener(
        "click",
        function () {

          stopCamera();

        }
      );

    }

  }


  // =========================================================
  // INIT
  // =========================================================

  async function init() {

    console.log(
      "SCAN.JS dimulai..."
    );


    if (!cekLogin()) {
      return;
    }


    pasangEvent();


    if (!cekBrowser()) {
      return;
    }


    setStatus(
      "Menyiapkan kamera...",
      "loading"
    );


    // Beri sedikit waktu agar
    // library html5-qrcode siap.

    setTimeout(
      function () {

        startCamera();

      },
      500
    );

  }


  // =========================================================
  // PENTING
  // =========================================================
  // Ini menangani dua kondisi:
  //
  // 1. scan.js dimuat sebelum DOM selesai
  // 2. scan.js dimuat setelah DOM selesai
  //
  // Jadi scanner tidak lagi gagal hanya karena
  // DOMContentLoaded sudah lewat.
  // =========================================================

  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      init
    );

  } else {

    init();

  }


  // =========================================================
  // GLOBAL
  // =========================================================

  window.startScanCamera =
    startCamera;

  window.stopScanCamera =
    stopCamera;

})();
