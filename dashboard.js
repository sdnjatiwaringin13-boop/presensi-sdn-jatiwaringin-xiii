/*******************************************************
 * DASHBOARD
 * SD NEGERI JATIWARINGIN XIII
 *******************************************************/

const API_URL =
  "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";


let currentUser = null;


/* =====================================================
   INIT
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    initDashboard();

  }
);


/* =====================================================
   INIT DASHBOARD
===================================================== */

function initDashboard() {

  const saved =
    localStorage.getItem(
      "presensiUser"
    );


  /* ===================================================
     BELUM LOGIN
  =================================================== */

  if (!saved) {

    window.location.href =
      "index.html";

    return;

  }


  /* ===================================================
     BACA USER
  =================================================== */

  try {

    currentUser =
      JSON.parse(saved);

  } catch (error) {

    console.error(
      "USER ERROR:",
      error
    );


    localStorage.removeItem(
      "presensiUser"
    );


    window.location.href =
      "index.html";

    return;

  }


  /* ===================================================
     VALIDASI USER
  =================================================== */

  const role =
    String(
      currentUser.role || ""
    )
      .trim()
      .toUpperCase();


  if (
    role !== "ADMIN" &&
    role !== "GURU"
  ) {

    localStorage.removeItem(
      "presensiUser"
    );


    window.location.href =
      "index.html";

    return;

  }


  /* ===================================================
     TAMPILKAN USER
  =================================================== */

  tampilkanUser();


  /* ===================================================
     BUAT MENU
  =================================================== */

  buatMenu();


  /* ===================================================
     LOAD DATA
  =================================================== */

  loadDashboard();

}


/* =====================================================
   TAMPILKAN USER
===================================================== */

function tampilkanUser() {

  const nama =
    currentUser.nama ||
    currentUser.username ||
    "Pengguna";


  document.getElementById(
    "welcomeName"
  ).textContent =
    "Selamat Datang, " +
    nama;


  const role =
    String(
      currentUser.role || ""
    )
      .toUpperCase();


  const roleElement =
    document.getElementById(
      "welcomeRole"
    );


  if (
    role === "ADMIN"
  ) {

    roleElement.textContent =
      "Administrator Sistem";

  } else {

    roleElement.textContent =
      "Guru / Wali Kelas";

  }

}


/* =====================================================
   MENU
===================================================== */

function buatMenu() {

  const menu =
    document.getElementById(
      "menu"
    );


  const role =
    String(
      currentUser.role || ""
    )
      .trim()
      .toUpperCase();


  let html = "";


  /* ===================================================
     ADMIN
  =================================================== */

  if (
    role === "ADMIN"
  ) {

    html = `

      <div
        class="menu-card"
        onclick="
          location.href='admin.html'
        "
      >

        <div class="menu-icon">
          👨‍💼
        </div>

        <h3>
          Administrasi
        </h3>

        <p>
          Kelola data siswa, guru,
          kelas dan sistem presensi.
        </p>

      </div>


      <div
        class="menu-card"
        onclick="
          location.href='kartu.html'
        "
      >

        <div class="menu-icon">
          🪪
        </div>

        <h3>
          Kartu QR Siswa
        </h3>

        <p>
          Membuat dan mencetak
          kartu QR siswa.
        </p>

      </div>


      <div
        class="menu-card"
        onclick="
          location.href='scan.html'
        "
      >

        <div class="menu-icon">
          📷
        </div>

        <h3>
          Scan QR
        </h3>

        <p>
          Memindai QR Code
          siswa menggunakan kamera.
        </p>

      </div>


      <div
        class="menu-card"
        onclick="
          location.href='absen-bulanan.html'
        "
      >

        <div class="menu-icon">
          📊
        </div>

        <h3>
          Laporan Bulanan
        </h3>

        <p>
          Melihat, mencetak dan
          mengunduh laporan absensi.
        </p>

      </div>


      <div
        class="menu-card"
        onclick="
          location.href='pengaturan.html'
        "
      >

        <div class="menu-icon">
          ⚙️
        </div>

        <h3>
          Pengaturan Sekolah
        </h3>

        <p>
          Mengatur nama sekolah,
          kepala sekolah dan NIP.
        </p>

      </div>

    `;

  }


  /* ===================================================
     GURU
  =================================================== */

  if (
    role === "GURU"
  ) {

    html = `

      <div
        class="menu-card"
        onclick="
          location.href='presensi.html'
        "
      >

        <div class="menu-icon">
          📝
        </div>

        <h3>
          Presensi Siswa
        </h3>

        <p>
          Melakukan presensi siswa
          berdasarkan kelas.
        </p>

      </div>


      <div
        class="menu-card"
        onclick="
          location.href='scan.html'
        "
      >

        <div class="menu-icon">
          📷
        </div>

        <h3>
          Scan QR
        </h3>

        <p>
          Melakukan presensi siswa
          menggunakan QR Code.
        </p>

      </div>


      <div
        class="menu-card"
        onclick="
          location.href='absen-bulanan.html'
        "
      >

        <div class="menu-icon">
          📊
        </div>

        <h3>
          Laporan Bulanan
        </h3>

        <p>
          Melihat, mencetak dan
          mengunduh absensi bulanan.
        </p>

      </div>

    `;

  }


  menu.innerHTML =
    html;

}


/* =====================================================
   LOAD DASHBOARD
===================================================== */

async function loadDashboard() {

  try {

    const role =
      String(
        currentUser.role || ""
      )
        .trim()
        .toUpperCase();


    /* =================================================
       ADMIN
    ================================================= */

    if (
      role === "ADMIN"
    ) {

      document.getElementById(
        "adminSection"
      ).style.display =
        "block";


      await loadStatistikAdmin();

    }


    /* =================================================
       GURU
    ================================================= */

    if (
      role === "GURU"
    ) {

      await loadInfoGuru();

    }


    /* =================================================
       PRESENSI
    ================================================= */

    await loadPresensiHariIni();


  } catch (error) {

    console.error(
      "DASHBOARD ERROR:",
      error
    );


    showError(
      error.message
    );

  }

}


/* =====================================================
   STATISTIK ADMIN
===================================================== */

async function loadStatistikAdmin() {

  try {

    /* =================================================
       SISWA
    ================================================= */

    const siswaResult =
      await callAPI({

        action:
          "getSiswa"

      });


    if (
      siswaResult &&
      siswaResult.success
    ) {

      const siswa =
        Array.isArray(
          siswaResult.data
        )
          ? siswaResult.data
          : [];


      const aktif =
        siswa.filter(
          function (item) {

            const status =
              String(
                item.STATUS || ""
              )
                .trim()
                .toUpperCase();


            return (
              status !==
              "NONAKTIF"
            );

          }
        );


      document.getElementById(
        "totalSiswa"
      ).textContent =
        aktif.length;

    }


    /* =================================================
       GURU
    ================================================= */

    const guruResult =
      await callAPI({

        action:
          "getGuru"

      });


    if (
      guruResult &&
      guruResult.success
    ) {

      const guru =
        Array.isArray(
          guruResult.data
        )
          ? guruResult.data
          : [];


      const aktif =
        guru.filter(
          function (item) {

            const status =
              String(
                item.STATUS || ""
              )
                .trim()
                .toUpperCase();


            return (
              status !==
              "NONAKTIF"
            );

          }
        );


      document.getElementById(
        "totalGuru"
      ).textContent =
        aktif.length;

    }


    /* =================================================
       KELAS
    ================================================= */

    const kelasResult =
      await callAPI({

        action:
          "getKelas"

      });


    if (
      kelasResult &&
      kelasResult.success
    ) {

      const kelas =
        Array.isArray(
          kelasResult.data
        )
          ? kelasResult.data
          : [];


      const aktif =
        kelas.filter(
          function (item) {

            const status =
              String(
                item.STATUS || ""
              )
                .trim()
                .toUpperCase();


            return (
              status !==
              "NONAKTIF"
            );

          }
        );


      document.getElementById(
        "totalKelas"
      ).textContent =
        aktif.length;

    }


  } catch (error) {

    console.error(
      "STATISTIK ERROR:",
      error
    );

  }

}


/* =====================================================
   INFO GURU
===================================================== */

async function loadInfoGuru() {

  const guruInfo =
    document.getElementById(
      "guruInfo"
    );


  guruInfo.style.display =
    "block";


  document.getElementById(
    "guruNama"
  ).textContent =
    currentUser.nama ||
    currentUser.username ||
    "-";


  document.getElementById(
    "guruId"
  ).textContent =
    currentUser.idGuru ||
    "-";


  try {

    const result =
      await callAPI({

        action:
          "getKelasGuru",

        idGuru:
          currentUser.idGuru

      });


    if (
      result &&
      result.success
    ) {

      const kelas =
        Array.isArray(
          result.data
        )
          ? result.data
          : [];


      const namaKelas =
        kelas
          .map(
            function (item) {

              return (
                item.NAMA_KELAS ||
                item.namaKelas ||
                "-"
              );

            }
          )
          .filter(
            function (item) {

              return item !== "-";

            }
          );


      document.getElementById(
        "guruKelas"
      ).textContent =
        namaKelas.length
          ? namaKelas.join(", ")
          : "Belum ada kelas";

    } else {

      document.getElementById(
        "guruKelas"
      ).textContent =
        "Belum ada kelas";

    }


  } catch (error) {

    console.error(
      "KELAS GURU ERROR:",
      error
    );


    document.getElementById(
      "guruKelas"
    ).textContent =
      "Tidak dapat memuat";

  }

}


/* =====================================================
   PRESENSI HARI INI
===================================================== */

async function loadPresensiHariIni() {

  const sekarang =
    new Date();


  const tanggal =
    sekarang.getFullYear() +
    "-" +
    String(
      sekarang.getMonth() + 1
    ).padStart(
      2,
      "0"
    ) +
    "-" +
    String(
      sekarang.getDate()
    ).padStart(
      2,
      "0"
    );


  try {

    const result =
      await callAPI({

        action:
          "getRekap",

        tanggal:
          tanggal

      });


    if (
      !result ||
      result.success !== true
    ) {

      setPresensiNol();

      return;

    }


    const data =
      Array.isArray(
        result.data
      )
        ? result.data
        : [];


    let hadir = 0;

    let izin = 0;

    let sakit = 0;

    let alpa = 0;


    data.forEach(
      function (item) {

        const status =
          String(
            item.STATUS || ""
          )
            .trim()
            .toUpperCase();


        if (
          status === "HADIR"
        ) {

          hadir++;

        }


        else if (
          status === "IZIN"
        ) {

          izin++;

        }


        else if (
          status === "SAKIT"
        ) {

          sakit++;

        }


        else if (
          status === "ALPA"
        ) {

          alpa++;

        }

      }
    );


    document.getElementById(
      "hadir"
    ).textContent =
      hadir;


    document.getElementById(
      "izin"
    ).textContent =
      izin;


    document.getElementById(
      "sakit"
    ).textContent =
      sakit;


    document.getElementById(
      "alpa"
    ).textContent =
      alpa;


  } catch (error) {

    console.error(
      "REKAP ERROR:",
      error
    );


    setPresensiNol();

  }

}


/* =====================================================
   PRESENSI NOL
===================================================== */

function setPresensiNol() {

  document.getElementById(
    "hadir"
  ).textContent =
    "0";


  document.getElementById(
    "izin"
  ).textContent =
    "0";


  document.getElementById(
    "sakit"
  ).textContent =
    "0";


  document.getElementById(
    "alpa"
  ).textContent =
    "0";

}


/* =====================================================
   API
===================================================== */

async function callAPI(
  payload
) {

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
          )

      }
    );


  if (!response.ok) {

    throw new Error(
      "HTTP Error " +
      response.status
    );

  }


  const text =
    await response.text();


  if (!text) {

    throw new Error(
      "Server tidak memberikan response."
    );

  }


  let result;


  try {

    result =
      JSON.parse(
        text
      );

  } catch (error) {

    console.error(
      "RESPONSE SERVER:",
      text
    );


    throw new Error(
      "Response server bukan JSON."
    );

  }


  return result;

}


/* =====================================================
   ERROR
===================================================== */

function showError(
  message
) {

  const element =
    document.getElementById(
      "errorBox"
    );


  if (!element) {
    return;
  }


  element.textContent =
    message ||
    "Terjadi kesalahan.";


  element.style.display =
    "block";

}


/* =====================================================
   LOGOUT
===================================================== */

function logout() {

  localStorage.removeItem(
    "presensiUser"
  );


  window.location.href =
    "index.html";

}
