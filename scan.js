"use strict";

(function () {

  let semuaSiswa = [];
  let scanner = null;
  let sedangMemproses = false;
  let kameraAktif = false;

  let userLogin = null;
  let idGuruLogin = "";

  const $ = (id) =>
    document.getElementById(id);

  function init() {

    userLogin =
      getCurrentUser();

    if (!userLogin) {
      location.href =
        "index.html";
      return;
    }

    const role =
      String(
        userLogin.role || ""
      ).toUpperCase();

    if (
      role !== "GURU" &&
      role !== "ADMIN"
    ) {
      location.href =
        "dashboard.html";
      return;
    }

    idGuruLogin =
      userLogin.idGuru || "";

    tampilkanGuru();

    loadSiswa();

    if (
      typeof Html5Qrcode !==
      "undefined"
    ) {
      mulaiScanner();
    } else {
      tampilkanError(
        "Library QR Scanner belum dimuat."
      );
    }
  }

  function tampilkanGuru() {

    const element =
      $("guruInfo");

    if (!element) return;

    element.innerHTML = `
      <strong>
        ${escapeHTML(
          userLogin.nama ||
          userLogin.username ||
          "-"
        )}
      </strong>

      <br>

      <small>
        ${escapeHTML(
          userLogin.role || ""
        )}
      </small>
    `;
  }

  async function loadSiswa() {

    try {

      const result =
        await callAPI({
          action: "getSiswa",
          aktifOnly: true
        });

      if (!result.success) {
        throw new Error(
          result.message ||
          "Gagal mengambil data siswa."
        );
      }

      semuaSiswa =
        Array.isArray(result.data)
          ? result.data
          : [];

    } catch (error) {

      console.error(error);

      tampilkanError(
        error.message
      );
    }
  }

  function mulaiScanner() {

    if (kameraAktif) return;

    const reader =
      $("reader");

    if (!reader) return;

    scanner =
      new Html5Qrcode("reader");

    const config = {
      fps: 10,
      qrbox: {
        width: 250,
        height: 250
      }
    };

    scanner.start(
      {
        facingMode: "environment"
      },
      config,
      onScanSuccess,
      function () {}
    )
    .then(() => {

      kameraAktif = true;

      tampilkanStatus(
        "Kamera aktif. Arahkan QR siswa ke kamera."
      );

    })
    .catch(error => {

      console.error(error);

      kameraAktif = false;

      tampilkanError(
        "Kamera tidak dapat digunakan. " +
        "Pastikan izin kamera diberikan."
      );
    });
  }

  async function stopScanner() {

    if (!scanner || !kameraAktif) {
      return;
    }

    try {

      await scanner.stop();

      kameraAktif = false;

    } catch (error) {

      console.error(error);

    }
  }

  async function onScanSuccess(decodedText) {

    if (sedangMemproses) return;

    sedangMemproses = true;

    const idSiswa =
      String(decodedText || "")
        .trim();

    try {

      await stopScanner();

      await prosesQR(idSiswa);

    } finally {

      setTimeout(() => {
        sedangMemproses = false;
      }, 2000);
    }
  }

  async function prosesQR(idSiswa) {

    const siswa =
      semuaSiswa.find(
        item =>
          String(item.ID) ===
          String(idSiswa)
      );

    if (!siswa) {

      prosesGagal(
        "QR tidak terdaftar sebagai siswa."
      );

      return;
    }

    try {

      const result =
        await callAPI({

          action:
            "simpanPresensi",

          id:
            siswa.ID,

          nisn:
            siswa.NISN,

          nama:
            siswa.NAMA,

          kelas:
            siswa.KELAS,

          status:
            "HADIR",

          sumber:
            "QR",

          idGuru:
            idGuruLogin

        });

      if (!result.success) {
        throw new Error(
          result.message ||
          "Gagal menyimpan presensi."
        );
      }

      tampilkanBerhasil(
        siswa
      );

    } catch (error) {

      console.error(error);

      prosesGagal(
        error.message
      );
    }
  }

  function tampilkanBerhasil(
    siswa
  ) {

    const result =
      $("result");

    if (!result) return;

    result.innerHTML = `
      <div class="alert alert-success">

        <h3>
          Presensi Berhasil
        </h3>

        <strong>
          ${escapeHTML(
            siswa.NAMA
          )}
        </strong>

        <br>

        NISN:
        ${escapeHTML(
          siswa.NISN || "-"
        )}

        <br>

        Kelas:
        ${escapeHTML(
          siswa.KELAS || "-"
        )}

        <br>

        Status:
        <strong>HADIR</strong>

      </div>
    `;

    tampilkanStatus(
      "Presensi berhasil dicatat."
    );

    setTimeout(() => {

      if (!kameraAktif) {
        mulaiScanner();
      }

    }, 1500);
  }

  function prosesGagal(
    message
  ) {

    const result =
      $("result");

    if (result) {

      result.innerHTML = `
        <div class="alert alert-danger">
          ${escapeHTML(
            message
          )}
        </div>
      `;
    }

    tampilkanStatus(
      "Presensi gagal."
    );

    setTimeout(() => {

      if (!kameraAktif) {
        mulaiScanner();
      }

    }, 2000);
  }

  function tampilkanStatus(
    message
  ) {

    const element =
      $("scanStatus");

    if (element) {
      element.textContent =
        message;
    }
  }

  function tampilkanError(
    message
  ) {

    const result =
      $("result");

    if (result) {

      result.innerHTML = `
        <div class="alert alert-danger">
          ${escapeHTML(
            message
          )}
        </div>
      `;
    }
  }

  function kembali() {

    location.href =
      "dashboard.html";
  }

  async function logoutScan() {

    await stopScanner();

    if (
      typeof Auth !==
      "undefined" &&
      Auth.logout
    ) {
      Auth.logout();
    } else {
      localStorage.removeItem(
        "presensiUser"
      );

      location.href =
        "index.html";
    }
  }

  window.mulaiScanner =
    mulaiScanner;

  window.stopScanner =
    stopScanner;

  window.kembali =
    kembali;

  window.logoutScan =
    logoutScan;

  document.addEventListener(
    "DOMContentLoaded",
    init
  );

})();
