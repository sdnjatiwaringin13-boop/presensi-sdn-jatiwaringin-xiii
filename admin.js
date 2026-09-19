const API_URL =
  "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";


/*
 * ============================
 * CEK LOGIN
 * ============================
 */

const userData =
  localStorage.getItem("presensiUser");


const userData =
  localStorage.getItem("presensiUser");


if (!userData) {

  window.location.href =
    "index.html";

} else {

  try {

    const user =
      JSON.parse(userData);

    if (user.role !== "ADMIN") {

      alert(
        "Anda tidak mempunyai akses ke halaman Admin."
      );

      localStorage.removeItem(
        "presensiUser"
      );

      window.location.href =
        "index.html";

    } else {

      document.getElementById(
        "adminName"
      ).textContent =
        "Login sebagai: " +
        (user.username || "Admin");

      loadDashboard();

    }

  } catch (error) {

    console.error(error);

    localStorage.removeItem(
      "presensiUser"
    );

    window.location.href =
      "index.html";

  }

}


/*
 * Pastikan yang masuk adalah ADMIN
 */

if (user.role !== "ADMIN") {

  alert(
    "Anda tidak mempunyai akses ke halaman Admin."
  );

  window.location.href =
    "index.html";

}


/*
 * Tampilkan nama admin
 */

document.getElementById(
  "adminName"
).textContent =
  "Login sebagai: " + user.username;


/*
 * ============================
 * AMBIL DATA API
 * ============================
 */

async function callAPI(data) {

  const response =
    await fetch(API_URL, {

      method: "POST",

      headers: {
        "Content-Type":
          "text/plain;charset=utf-8"
      },

      body: JSON.stringify(data)

    });


  return await response.json();

}


/*
 * ============================
 * LOAD DATA
 * ============================
 */

async function loadDashboard() {

  try {

    /*
     * Ambil siswa
     */

    const siswaResult =
      await callAPI({

        action: "getSiswa"

      });


    if (siswaResult.success) {

      document.getElementById(
        "totalSiswa"
      ).textContent =
        siswaResult.jumlah;

    }


    /*
     * Ambil kelas
     */

    const kelasResult =
      await callAPI({

        action: "getKelas"

      });


    if (kelasResult.success) {

      document.getElementById(
        "totalKelas"
      ).textContent =
        kelasResult.jumlah;

    }


    /*
     * Guru dihitung dari data
     * kelas / nanti kita buat API guru.
     *
     * Untuk sementara:
     * ambil data guru langsung
     */

    const guruResult =
      await getGuru();


    document.getElementById(
      "totalGuru"
    ).textContent =
      guruResult;


    /*
     * Ambil presensi hari ini
     */

    await loadPresensiHariIni();


  }

  catch (error) {

    console.error(error);

    alert(
      "Gagal mengambil data dashboard."
    );

  }

}


/*
 * ============================
 * GET GURU
 * ============================
 */

async function getGuru() {

  /*
   * Versi sementara menggunakan
   * jumlah ID_GURU unik dari kelas.
   *
   * Nanti kita buat API guru
   * khusus untuk halaman Guru.
   */

  const kelasResult =
    await callAPI({

      action: "getKelas"

    });


  if (
    !kelasResult.success
  ) {

    return 0;

  }


  const guruIds =
    kelasResult.data

      .map(
        kelas => kelas.ID_GURU
      )

      .filter(
        id => id
      );


  return [
    ...new Set(guruIds)
  ].length;

}


/*
 * ============================
 * PRESENSI HARI INI
 * ============================
 */

async function loadPresensiHariIni() {

  const today =
    new Date()
      .toLocaleDateString(
        "en-CA",
        {
          timeZone:
            "Asia/Jakarta"
        }
      );


  const result =
    await callAPI({

      action: "getRekap",

      tanggal: today

    });


  if (!result.success) {

    return;

  }


  document.getElementById(
    "totalPresensi"
  ).textContent =
    result.jumlah;


  const table =
    document.getElementById(
      "presensiTable"
    );


  table.innerHTML = "";


  if (result.data.length === 0) {

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


  result.data.forEach(
    (item, index) => {

      const row =
        document.createElement("tr");


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


      table.appendChild(row);

    }
  );

}


/*
 * ============================
 * LOGOUT
 * ============================
 */

document.getElementById(
  "logoutButton"
).addEventListener(
  "click",
  function () {

    localStorage.removeItem(
      "presensiUser"
    );

    window.location.href =
      "index.html";

  }
);


/*
 * ============================
 * JALANKAN DASHBOARD
 * ============================
 */

loadDashboard();
