const API_URL =
  "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";


let currentUser = null;


/* =====================================================
   INIT
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    const saved =
      localStorage.getItem(
        "presensiUser"
      );


    if (!saved) {

      location.href =
        "index.html";

      return;

    }


    try {

      currentUser =
        JSON.parse(saved);

    } catch (error) {

      localStorage.removeItem(
        "presensiUser"
      );

      location.href =
        "index.html";

      return;

    }


    tampilkanUser();

    buatMenu();

    loadDashboard();

  }
);


/* =====================================================
   USER
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
    ).toUpperCase();


  if (role === "ADMIN") {

    document.getElementById(
      "welcomeRole"
    ).textContent =
      "Administrator Sistem";

  } else {

    document.getElementById(
      "welcomeRole"
    ).textContent =
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
    ).toUpperCase();


  let html = "";


  if (role === "ADMIN") {

    html += `

      <div
        class="menu-card"
        onclick="location.href='admin.html'"
      >

        <h3>
          👨‍💼 Administrasi
        </h3>

        <p>
          Kelola data siswa, guru dan kelas.
        </p>

      </div>


      <div
        class="menu-card"
        onclick="location.href='kartu.html'"
      >

        <h3>
          🪪 Kartu QR Siswa
        </h3>

        <p>
          Buat dan cetak kartu QR siswa.
        </p>

      </div>


      <div
        class="menu-card"
        onclick="location.href='scan.html'"
      >

        <h3>
          📷 Scan QR
        </h3>

        <p>
          Scan QR Code siswa.
        </p>

      </div>


      <div
        class="menu-card"
        onclick="location.href='absen-bulanan.html'"
      >

        <h3>
          📊 Laporan Bulanan
        </h3>

        <p>
          Lihat dan cetak laporan absensi.
        </p>

      </div>


      <div
        class="menu-card"
        onclick="location.href='pengaturan.html'"
      >

        <h3>
          ⚙️ Pengaturan Sekolah
        </h3>

        <p>
          Atur kepala sekolah dan informasi sekolah.
        </p>

      </div>

    `;

  }


  if (role === "GURU") {

    html += `

      <div
        class="menu-card"
        onclick="location.href='presensi.html'"
      >

        <h3>
          📝 Presensi Siswa
        </h3>

        <p>
          Melakukan presensi siswa.
        </p>

      </div>


      <div
        class="menu-card"
        onclick="location.href='scan.html'"
      >

        <h3>
          📷 Scan QR
        </h3>

        <p>
          Presensi menggunakan QR Code.
        </p>

      </div>


      <div
        class="menu-card"
        onclick="location.href='absen-bulanan.html'"
      >

        <h3>
          📊 Laporan Bulanan
        </h3>

        <p>
          Lihat dan cetak absensi bulanan.
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

    /*
     * DATA SISWA
     */

    const siswa =
      await callAPI({
        action: "getSiswa"
      });


    if (
      siswa &&
      siswa.success
    ) {

      document.getElementById(
        "totalSiswa"
      ).textContent =
        Array.isArray(
          siswa.data
        )
          ? siswa.data.filter(
              s =>
                String(
                  s.STATUS || ""
                ).toUpperCase()
                !== "NONAKTIF"
            ).length
          : 0;

    }


    /*
     * DATA GURU
     */

    const guru =
      await callAPI({
        action: "getGuru"
      });


    if (
      guru &&
      guru.success
    ) {

      document.getElementById(
        "totalGuru"
      ).textContent =
        Array.isArray(
          guru.data
        )
          ? guru.data.length
          : 0;

    }


    /*
     * DATA KELAS
     */

    const kelas =
      await callAPI({
        action: "getKelas"
      });


    if (
      kelas &&
      kelas.success
    ) {

      document.getElementById(
        "totalKelas"
      ).textContent =
        Array.isArray(
          kelas.data
        )
          ? kelas.data.length
          : 0;

    }


    /*
     * REKAP HARI INI
     */

    await loadPresensiHariIni();


  } catch (error) {

    console.error(
      "Dashboard error:",
      error
    );

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
    ).padStart(2, "0") +
    "-" +
    String(
      sekarang.getDate()
    ).padStart(2, "0");


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
      !result.success
    ) {

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
          ).toUpperCase();


        if (
          status === "HADIR"
        ) {

          hadir++;

        } else if (
          status === "IZIN"
        ) {

          izin++;

        } else if (
          status === "SAKIT"
        ) {

          sakit++;

        } else if (
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
      "Rekap error:",
      error
    );

  }

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
        method: "POST",

        headers: {
          "Content-Type":
            "text/plain;charset=utf-8"
        },

        body:
          JSON.stringify(payload)
      }
    );


  const text =
    await response.text();


  if (!text) {

    throw new Error(
      "Server tidak memberikan response."
    );

  }


  return JSON.parse(
    text
  );

}


/* =====================================================
   LOGOUT
===================================================== */

function logout() {

  localStorage.removeItem(
    "presensiUser"
  );


  location.href =
    "index.html";

}
