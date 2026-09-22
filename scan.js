"use strict";


(function () {


  let stream = null;

  let scanning = false;

  let processing = false;

  let user = null;

  let idGuru = "";

  let lastQR = "";

  let lastScanTime = 0;


  const $ = id =>
    document.getElementById(id);


  /* ========================================================
     INIT
  ======================================================== */

  document.addEventListener(
    "DOMContentLoaded",
    init
  );


  async function init() {


    user =
      typeof getCurrentUser === "function"
        ? getCurrentUser()
        : (
            typeof Auth !== "undefined" &&
            Auth.getCurrentUser
              ? Auth.getCurrentUser()
              : null
          );


    if (!user) {

      location.href =
        "index.html";

      return;

    }


    const role =
      String(
        user.role || ""
      )
      .toUpperCase();


    if (
      role !== "ADMIN" &&
      role !== "GURU"
    ) {

      location.href =
        "dashboard.html";

      return;

    }


    idGuru =
      String(
        user.idGuru || ""
      );


    tampilkanUser();


    $("startCamera")
      ?.addEventListener(
        "click",
        startCamera
      );


    $("stopCamera")
      ?.addEventListener(
        "click",
        stopCamera
      );


    /*
     * KAMERA OTOMATIS
     */

    setTimeout(
      startCamera,
      300
    );

  }


  /* ========================================================
     USER
  ======================================================== */

  function tampilkanUser() {


    if ($("guruNama")) {

      $("guruNama").textContent =
        user.nama ||
        user.username ||
        "Pengguna";

    }


    if ($("guruRole")) {

      $("guruRole").textContent =
        String(
          user.role || ""
        ).toUpperCase() === "GURU"

          ? "Guru / Wali Kelas"

          : "Administrator";

    }

  }


  /* ========================================================
     START CAMERA
  ======================================================== */

  async function startCamera() {


    if (scanning) {

      return;

    }


    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {

      showError(
        "Browser tidak mendukung akses kamera."
      );

      return;

    }


    if (
      typeof jsQR === "undefined"
    ) {

      showError(
        "Library pembaca QR gagal dimuat."
      );

      return;

    }


    setStatus(
      "Membuka kamera...",
      "info"
    );


    try {


      /*
       * Stop stream lama
       */

      stopTracks();


      /*
       * Request kamera.
       *
       * facingMode ideal bukan exact,
       * supaya desktop webcam tetap bisa.
       */

      stream =
        await navigator.mediaDevices
          .getUserMedia({

            audio: false,

            video: {

              facingMode: {
                ideal: "environment"
              },

              width: {
                ideal: 1280
              },

              height: {
                ideal: 720
              }

            }

          });


      const video =
        $("video");


      if (!video) {

        throw new Error(
          "Elemen video tidak ditemukan."
        );

      }


      video.srcObject =
        stream;


      video.setAttribute(
        "playsinline",
        true
      );


      video.muted =
        true;


      await video.play();


      scanning =
        true;


      processing =
        false;


      setStatus(
        "Kamera aktif. Arahkan QR kartu siswa ke kotak scanner.",
        "info"
      );


      /*
       * Mulai membaca setiap frame.
       */

      requestAnimationFrame(
        scanFrame
      );


    } catch (error) {


      console.error(
        "CAMERA ERROR:",
        error
      );


      scanning =
        false;


      let pesan =
        error.message ||
        "Kamera tidak dapat dibuka.";


      if (
        error.name ===
        "NotAllowedError"
      ) {

        pesan =
          "Izin kamera ditolak. " +
          "Klik ikon kamera di address bar lalu pilih Allow.";

      }


      if (
        error.name ===
        "NotFoundError"
      ) {

        pesan =
          "Kamera tidak ditemukan pada perangkat.";

      }


      showError(
        pesan
      );

    }

  }


  /* ========================================================
     SCAN FRAME
  ======================================================== */

  function scanFrame() {


    if (!scanning) {

      return;

    }


    const video =
      $("video");


    const canvas =
      $("scanCanvas");


    if (
      !video ||
      !canvas
    ) {

      requestAnimationFrame(
        scanFrame
      );

      return;

    }


    /*
     * Video belum siap.
     */

    if (
      video.readyState !==
      video.HAVE_ENOUGH_DATA
    ) {

      requestAnimationFrame(
        scanFrame
      );

      return;

    }


    /*
     * Jangan membaca QR saat
     * request sebelumnya sedang diproses.
     */

    if (processing) {

      requestAnimationFrame(
        scanFrame
      );

      return;

    }


    const width =
      video.videoWidth;


    const height =
      video.videoHeight;


    if (
      !width ||
      !height
    ) {

      requestAnimationFrame(
        scanFrame
      );

      return;

    }


    canvas.width =
      width;


    canvas.height =
      height;


    const ctx =
      canvas.getContext(
        "2d",
        {
          willReadFrequently: true
        }
      );


    ctx.drawImage(
      video,
      0,
      0,
      width,
      height
    );


    const image =
      ctx.getImageData(
        0,
        0,
        width,
        height
      );


    const qr =
      jsQR(

        image.data,

        image.width,

        image.height,

        {

          inversionAttempts:
            "attemptBoth"

        }

      );


    if (
      qr &&
      qr.data
    ) {

      const raw =
        String(
          qr.data
        ).trim();


      if (raw) {

        const now =
          Date.now();


        /*
         * Cegah QR sama diproses
         * berkali-kali dalam 4 detik.
         */

        if (
          raw !== lastQR ||
          now - lastScanTime > 4000
        ) {

          lastQR =
            raw;


          lastScanTime =
            now;


          prosesQR(
            raw
          );

        }

      }

    }


    requestAnimationFrame(
      scanFrame
    );

  }


  /* ========================================================
     PROSES QR
  ======================================================== */

  async function prosesQR(raw) {


    if (processing) {

      return;

    }


    processing =
      true;


    console.log(
      "QR TERBACA:",
      raw
    );


    setStatus(
      "QR terbaca. Menyimpan presensi...",
      "info"
    );


    try {


      /*
       * Kirim isi QR mentah
       * ke Apps Script.
       *
       * Server yang mencari siswa.
       */

      const result =
        await callAPI({

          action:
            "scanPresensi",

          qr:
            raw,

          idGuru:
            idGuru

        });


      console.log(
        "HASIL SCAN:",
        result
      );


      if (
        !result ||
        result.success !== true
      ) {

        throw new Error(

          result?.message ||

          "Presensi gagal."

        );

      }


      tampilkanBerhasil(
        result.data || {}
      );


      setStatus(

        result.message ||

        "Presensi berhasil dicatat.",

        "success"

      );


    } catch (error) {


      console.error(
        "SCAN ERROR:",
        error
      );


      showError(
        error.message ||
        "QR gagal diproses."
      );


    } finally {


      /*
       * Setelah 1,5 detik
       * scanner siap untuk siswa berikutnya.
       */

      setTimeout(
        function () {

          processing =
            false;

        },
        1500
      );

    }

  }


  /* ========================================================
     HASIL BERHASIL
  ======================================================== */

  function tampilkanBerhasil(
    data
  ) {


    const box =
      $("result");


    if (!box) {

      return;

    }


    box.innerHTML = `

      <div class="result-success">

        <div class="result-success-head">

          <small>

            <i class="fa-solid fa-circle-check"></i>

            PRESENSI BERHASIL

          </small>

          <h3>

            ${escapeHTML(
              data.nama || "-"
            )}

          </h3>

        </div>


        <div class="result-data">


          <div class="result-row">

            <div class="result-label">
              NISN
            </div>

            <div>:</div>

            <div>
              ${escapeHTML(
                data.nisn || "-"
              )}
            </div>

          </div>


          <div class="result-row">

            <div class="result-label">
              Kelas
            </div>

            <div>:</div>

            <div>
              ${escapeHTML(
                data.kelas || "-"
              )}
            </div>

          </div>


          <div class="result-row">

            <div class="result-label">
              Status
            </div>

            <div>:</div>

            <div style="color:#16803c;font-weight:800">

              ${escapeHTML(
                data.status || "HADIR"
              )}

            </div>

          </div>


          <div class="result-row">

            <div class="result-label">
              Jam
            </div>

            <div>:</div>

            <div>
              ${escapeHTML(
                data.jam || "-"
              )}
            </div>

          </div>


        </div>

      </div>

    `;

  }


  /* ========================================================
     STOP CAMERA
  ======================================================== */

  function stopCamera() {


    scanning =
      false;


    processing =
      false;


    stopTracks();


    const video =
      $("video");


    if (video) {

      video.srcObject =
        null;

    }


    setStatus(
      "Kamera dihentikan.",
      "warning"
    );

  }


  function stopTracks() {


    if (!stream) {

      return;

    }


    stream
      .getTracks()
      .forEach(

        track =>
          track.stop()

      );


    stream =
      null;

  }


  /* ========================================================
     STATUS
  ======================================================== */

  function setStatus(
    message,
    type
  ) {


    const el =
      $("scanStatus");


    if (!el) {

      return;

    }


    el.className =
      "scan-status";


    if (
      type === "success"
    ) {

      el.classList.add(
        "success"
      );

    }


    if (
      type === "error"
    ) {

      el.classList.add(
        "error"
      );

    }


    if (
      type === "warning"
    ) {

      el.classList.add(
        "warning"
      );

    }


    el.textContent =
      message;

  }


  function showError(
    message
  ) {


    setStatus(
      message,
      "error"
    );


    const box =
      $("result");


    if (box) {

      box.innerHTML = `

        <div
          style="
            padding:25px 15px;
            text-align:center;
            color:#b42318;
          "
        >

          <i
            class="fa-solid fa-circle-exclamation"
            style="
              font-size:38px;
              margin-bottom:12px;
            "
          ></i>

          <br>

          <strong>
            Presensi Gagal
          </strong>

          <br><br>

          ${escapeHTML(message)}

        </div>

      `;

    }

  }


  /* ========================================================
     ESCAPE
  ======================================================== */

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


  /*
   * Stop kamera saat pindah halaman.
   */

  window.addEventListener(
    "beforeunload",
    stopTracks
  );


})();
