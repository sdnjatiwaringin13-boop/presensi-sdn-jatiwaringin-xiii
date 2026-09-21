(function () {

  "use strict";


  const API_URL =
    "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";


  const currentUser =
    Auth.requireRole([
      "ADMIN",
      "GURU"
    ]);


  let scanner = null;

  let scannerRunning = false;

  let siswaList = [];

  let kelasList = [];

  let processing = false;


  document.addEventListener(
    "DOMContentLoaded",
    init
  );


  async function init() {

    await loadData();


    document
      .getElementById(
        "btnStartScan"
      )
      .addEventListener(
        "click",
        startScanner
      );


    document
      .getElementById(
        "btnStopScan"
      )
      .addEventListener(
        "click",
        stopScanner
      );

  }


  async function loadData() {

    try {

      let kelasResult;


      if (currentUser.role === "GURU") {

        kelasResult =
          await callAPI({

            action:
              "getKelasGuru",

            idGuru:
              currentUser.idGuru

          });

      } else {

        kelasResult =
          await callAPI({
            action:
              "getKelas"
          });

      }


      if (!kelasResult.success) {
        throw new Error(
          kelasResult.message
        );
      }


      kelasList =
        kelasResult.data || [];


      const select =
        document.getElementById(
          "scanKelas"
        );


      select.innerHTML = `
        <option value="">
          Pilih kelas
        </option>
      `;


      kelasList.forEach(
        kelas => {

          const option =
            document.createElement(
              "option"
            );


          option.value =
            kelas.NAMA_KELAS;


          option.textContent =
            kelas.NAMA_KELAS;


          select.appendChild(
            option
          );

        }
      );


      if (
        currentUser.role === "GURU" &&
        kelasList.length === 1
      ) {

        select.value =
          kelasList[0].NAMA_KELAS;

      }


      const siswaResult =
        await callAPI({

          action:
            "getSiswa",

          aktifOnly:
            true

        });


      if (!siswaResult.success) {
        throw new Error(
          siswaResult.message
        );
      }


      siswaList =
        siswaResult.data || [];


    } catch (error) {

      tampilkanPesan(
        error.message,
        "error"
      );

    }

  }


  async function startScanner() {

    const kelas =
      document.getElementById(
        "scanKelas"
      ).value;


    if (!kelas) {

      tampilkanPesan(
        "Pilih kelas terlebih dahulu.",
        "error"
      );

      return;

    }


    if (scannerRunning) {
      return;
    }


    scanner =
      new Html5Qrcode(
        "reader"
      );


    try {

      await scanner.start(

        {
          facingMode: "environment"
        },

        {
          fps: 10,

          qrbox: {
            width: 250,
            height: 250
          }

        },

        onScanSuccess,

        onScanError

      );


      scannerRunning = true;


      document.getElementById(
        "scanResult"
      ).textContent =
        "Kamera aktif. Arahkan QR siswa ke kamera.";


    } catch (error) {

      console.error(error);


      tampilkanPesan(
        "Kamera tidak dapat digunakan. Pastikan browser memiliki izin kamera dan halaman menggunakan HTTPS.",
        "error"
      );

    }

  }


  async function stopScanner() {

    if (!scanner || !scannerRunning) {
      return;
    }


    try {

      await scanner.stop();

      await scanner.clear();

    } catch (error) {

      console.error(error);

    }


    scannerRunning = false;


    document.getElementById(
      "scanResult"
    ).textContent =
      "Kamera dihentikan.";

  }


  async function onScanSuccess(decodedText) {

    if (processing) {
      return;
    }


    processing = true;


    try {

      await prosesQR(
        decodedText
      );

    } finally {

      setTimeout(() => {

        processing = false;

      }, 1500);

    }

  }


  function onScanError(errorMessage) {
    // Error scanning normal diabaikan.
  }


  async function prosesQR(qrValue) {

    const studentId =
      String(qrValue || "")
        .trim();


    const kelas =
      document.getElementById(
        "scanKelas"
      ).value;


    const siswa =
      siswaList.find(
        item =>
          String(item.ID) ===
          studentId
      );


    if (!siswa) {

      tampilkanPesan(
        "QR tidak dikenali sebagai ID siswa.",
        "error"
      );

      return;

    }


    if (
      String(siswa.KELAS) !==
      String(kelas)
    ) {

      tampilkanPesan(

        `Siswa ${siswa.NAMA} terdaftar di kelas ${siswa.KELAS}, bukan kelas ${kelas}.`,

        "error"

      );

      return;

    }


    document.getElementById(
      "scanResult"
    ).textContent =
      "Menyimpan presensi " +
      siswa.NAMA +
      "...";


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

        idGuru:
          currentUser.idGuru || "",

        sumber:
          "QR",

        tanggal:
          getToday()

      });


    if (!result.success) {

      tampilkanPesan(
        result.message ||
        "Presensi gagal disimpan.",
        "error"
      );

      return;

    }


    document.getElementById(
      "scanResult"
    ).textContent =
      "Presensi berhasil.";


    document.getElementById(
      "lastStudent"
    ).innerHTML = `

      <div class="last-student-name">
        ${escapeHTML(siswa.NAMA)}
      </div>

      <div>
        NISN:
        ${escapeHTML(siswa.NISN)}
      </div>

      <div>
        Kelas:
        ${escapeHTML(siswa.KELAS)}
      </div>

      <div>
        Status:
        <strong>HADIR</strong>
      </div>

      <div>
        Waktu:
        ${new Date().toLocaleTimeString("id-ID")}
      </div>

    `;


    tampilkanPesan(
      "Presensi " +
      siswa.NAMA +
      " berhasil dicatat.",
      "success"
    );

  }


  async function callAPI(payload) {

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
            JSON.stringify(payload)

        }
      );


    return await response.json();

  }


  function getToday() {

    const now =
      new Date();


    return [

      now.getFullYear(),

      String(
        now.getMonth() + 1
      ).padStart(2, "0"),

      String(
        now.getDate()
      ).padStart(2, "0")

    ].join("-");

  }


  function tampilkanPesan(
    message,
    type
  ) {

    const element =
      document.getElementById(
        "scanMessage"
      );


    element.textContent =
      message;


    element.className =
      "message " +
      (
        type === "success"
          ? "message-success"
          : "message-error"
      );


    element.style.display =
      "block";


    setTimeout(() => {

      element.style.display =
        "none";

    }, 4000);

  }


  function escapeHTML(value) {

    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }

})();
