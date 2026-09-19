const API_URL =
  "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";


/*
 * ==========================================
 * CEK LOGIN
 * ==========================================
 */

const userData =
  localStorage.getItem("presensiUser");


if (!userData) {

  window.location.href =
    "index.html";

}


/*
 * ==========================================
 * BACA DATA USER
 * ==========================================
 */

let user;

try {

  user =
    JSON.parse(userData);

}
catch (error) {

  console.error(
    "Data login tidak valid:",
    error
  );

  localStorage.removeItem(
    "presensiUser"
  );

  window.location.href =
    "index.html";

}


/*
 * ==========================================
 * CEK ROLE ADMIN
 * ==========================================
 */

if (!user || user.role !== "ADMIN") {

  alert(
    "Anda tidak mempunyai akses ke halaman Admin."
  );

  localStorage.removeItem(
    "presensiUser"
  );

  window.location.href =
    "index.html";

}


/*
 * ==========================================
 * TAMPILKAN NAMA ADMIN
 * ==========================================
 */

const adminName =
  document.getElementById(
    "adminName"
  );


if (adminName) {

  adminName.textContent =
    "Login sebagai: " +
    (user.username || "Admin");

}


/*
 * ==========================================
 * FUNGSI API
 * ==========================================
 */

async function callAPI(data) {

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
          JSON.stringify(data)

      }
    );


  if (!response.ok) {

    throw new Error(
      "HTTP Error: " +
      response.status
    );

  }


  const result =
    await response.json();


  return result;

}


/*
 * ==========================================
 * LOAD DASHBOARD
 * ==========================================
 */

async function loadDashboard() {

  try {

    /*
     * ==============================
     * TOTAL SISWA
     * ==============================
     */

    const siswaResult =
      await callAPI({

        action:
          "getSiswa"

      });


    console.log(
      "Hasil getSiswa:",
      siswaResult
    );


    if (
      siswaResult.success
    ) {

      const totalSiswa =
        document.getElementById(
          "totalSiswa"
        );


      if (totalSiswa) {

        totalSiswa.textContent =
          siswaResult.jumlah || 0;

      }

    }


    /*
     * ==============================
     * TOTAL KELAS
     * ==============================
     */

    const kelasResult =
      await callAPI({

        action:
          "getKelas"

      });


    console.log(
      "Hasil getKelas:",
      kelasResult
    );


    if (
      kelasResult.success
    ) {

      const totalKelas =
        document.getElementById(
          "totalKelas"
        );


      if (totalKelas) {

        totalKelas.textContent =
          kelasResult.jumlah || 0;

      }

    }


    /*
     * ==============================
     * TOTAL GURU
     * ==============================
     */

    const guruResult =
      await getGuru();


    const totalGuru =
      document.getElementById(
        "totalGuru"
      );


    if (totalGuru) {

      totalGuru.textContent =
        guruResult;

    }


    /*
     * ==============================
     * PRESENSI HARI INI
     * ==============================
     */

    await loadPresensiHariIni();


  }
  catch (error) {

    console.error(
      "ERROR DASHBOARD:",
      error
    );


    alert(
      "Gagal mengambil data dashboard.\n\n" +
      error.message
    );

  }

}


/*
 * ==========================================
 * HITUNG GURU
 * ==========================================
 */

async function getGuru() {

  try {

    const kelasResult =
      await callAPI({

        action:
          "getKelas"

      });


    if (
      !kelasResult.success ||
      !Array.isArray(
        kelasResult.data
      )
    ) {

      return 0;

    }


    const guruIds =
      kelasResult.data

        .map(
          kelas =>
            kelas.ID_GURU
        )

        .filter(
          id =>
            id !== "" &&
            id !== null &&
            id !== undefined
        );


    const guruUnik =
      [
        ...new Set(guruIds)
      ];


    return guruUnik.length;


  }
  catch (error) {

    console.error(
      "Gagal menghitung guru:",
      error
    );

    return 0;

  }

}


/*
 * ==========================================
 * PRESENSI HARI INI
 * ==========================================
 */

async function loadPresensiHariIni() {

  try {

    const today =
      new Date()
        .toLocaleDateString(
          "en-CA",
          {
            timeZone:
              "Asia/Jakarta"
          }
        );


    console.log(
      "Tanggal presensi:",
      today
    );


    const result =
      await callAPI({

        action:
          "getRekap",

        tanggal:
          today

      });


    console.log(
      "Hasil getRekap:",
      result
    );


    if (!result.success) {

      console.warn(
        "getRekap gagal:",
        result.message
      );

      return;

    }


    /*
     * TOTAL PRESENSI
     */

    const totalPresensi =
      document.getElementById(
        "totalPresensi"
      );


    if (totalPresensi) {

      totalPresensi.textContent =
        result.jumlah || 0;

    }


    /*
     * TABEL PRESENSI
     */

    const table =
      document.getElementById(
        "presensiTable"
      );


    if (!table) {

      return;

    }


    table.innerHTML = "";


    /*
     * BELUM ADA DATA
     */

    if (
      !Array.isArray(
        result.data
      ) ||
      result.data.length === 0
    ) {

      table.innerHTML = `

        <tr>

          <td
            colspan="5"
            class="empty"
          >

            Belum ada presensi hari ini.

          </td>

        </tr>

      `;

      return;

    }


    /*
     * TAMPILKAN DATA
     */

    result.data.forEach(
      (item, index) => {

        const row =
          document.createElement(
            "tr"
          );


        row.innerHTML = `

          <td>
            ${index + 1}
          </td>

          <td>
            ${item.NAMA || "-"}
          </td>

          <td>
            ${item.KELAS || "-"}
          </td>

          <td>
            ${item.JAM || "-"}
          </td>

          <td>

            <span class="status-badge">

              ${item.STATUS || "-"}

            </span>

          </td>

        `;


        table.appendChild(
          row
        );

      }
    );


  }
  catch (error) {

    console.error(
      "ERROR PRESENSI:",
      error
    );

  }

}


/*
 * ==========================================
 * LOGOUT
 * ==========================================
 */

const logoutButton =
  document.getElementById(
    "logoutButton"
  );


if (logoutButton) {

  logoutButton.addEventListener(
    "click",
    function () {

      localStorage.removeItem(
        "presensiUser"
      );


      window.location.href =
        "index.html";

    }
  );

}


/*
 * ==========================================
 * JALANKAN DASHBOARD
 * ==========================================
 */

loadDashboard();
