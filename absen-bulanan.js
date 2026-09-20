const API_URL =
  "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";


let currentUser = null;


const namaBulan = [
  "",
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember"
];


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


    if (
      String(
        currentUser.role || ""
      )
        .toUpperCase()
        !== "GURU"
    ) {

      alert(
        "Halaman ini khusus Guru."
      );

      location.href =
        "index.html";

      return;

    }


    if (!currentUser.idGuru) {

      alert(
        "ID Guru tidak ditemukan."
      );

      return;

    }


    const sekarang =
      new Date();


    document.getElementById(
      "bulan"
    ).value =
      sekarang.getMonth() + 1;


    document.getElementById(
      "tahun"
    ).value =
      sekarang.getFullYear();


    buatLaporan();

  }
);


/* =====================================================
   API
===================================================== */

async function callAPI(payload) {

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


  let result;


  try {

    result =
      JSON.parse(text);

  } catch (error) {

    console.error(text);

    throw new Error(
      "Response server bukan JSON."
    );

  }


  return result;

}


/* =====================================================
   BUAT LAPORAN
===================================================== */

async function buatLaporan() {

  const bulan =
    Number(
      document.getElementById(
        "bulan"
      ).value
    );


  const tahun =
    Number(
      document.getElementById(
        "tahun"
      ).value
    );


  if (
    !bulan ||
    !tahun
  ) {

    showMessage(
      "Bulan dan tahun wajib dipilih.",
      "error"
    );

    return;

  }


  document.getElementById(
    "loading"
  ).style.display =
    "block";


  try {

    const result =
      await callAPI({

        action:
          "getAbsenBulanan",

        idGuru:
          currentUser.idGuru,

        bulan:
          bulan,

        tahun:
          tahun

      });


    console.log(
      "HASIL LAPORAN:",
      result
    );


    if (
      !result.success
    ) {

      throw new Error(
        result.message ||
        "Gagal membuat laporan."
      );

    }


    renderLaporan(
      result.data
    );


  } catch (error) {

    console.error(error);


    showMessage(
      error.message,
      "error"
    );

  } finally {

    document.getElementById(
      "loading"
    ).style.display =
      "none";

  }

}


/* =====================================================
   RENDER LAPORAN
===================================================== */

function renderLaporan(data) {

  document.getElementById(
    "namaSekolah"
  ).textContent =
    data.sekolah.nama;


  document.getElementById(
    "kelas"
  ).textContent =
    data.kelas.nama;


  document.getElementById(
    "waliKelas"
  ).textContent =
    data.guru.nama;


  document.getElementById(
    "periode"
  ).textContent =
    namaBulan[data.bulan] +
    " " +
    data.tahun;


  document.getElementById(
    "namaKepala"
  ).textContent =
    data.kepalaSekolah.nama ||
    "-";


  document.getElementById(
    "nipKepala"
  ).textContent =
    data.kepalaSekolah.nip ||
    "-";


  document.getElementById(
    "namaWali"
  ).textContent =
    data.guru.nama ||
    "-";


  document.getElementById(
    "nipWali"
  ).textContent =
    data.guru.nip ||
    "-";


  buatHeader(
    data.jumlahHari
  );


  buatBody(
    data.siswa,
    data.jumlahHari
  );

}


/* =====================================================
   HEADER
===================================================== */

function buatHeader(
  jumlahHari
) {

  const head =
    document.getElementById(
      "tableHead"
    );


  let html = `
    <tr>

      <th
        class="no"
        rowspan="2"
      >
        No
      </th>

      <th
        class="nama"
        rowspan="2"
      >
        Nama Siswa
      </th>

  `;


  for (
    let d = 1;
    d <= jumlahHari;
    d++
  ) {

    html += `
      <th>${d}</th>
    `;

  }


  html += `
    </tr>
  `;


  head.innerHTML =
    html;

}


/* =====================================================
   BODY
===================================================== */

function buatBody(
  siswa,
  jumlahHari
) {

  const body =
    document.getElementById(
      "tableBody"
    );


  body.innerHTML = "";


  if (
    !siswa ||
    siswa.length === 0
  ) {

    body.innerHTML = `
      <tr>
        <td
          colspan="${jumlahHari + 2}"
        >
          Tidak ada siswa.
        </td>
      </tr>
    `;

    return;

  }


  siswa.forEach(
    function (item, index) {

      let html = `
        <tr>

          <td class="no">
            ${index + 1}
          </td>

          <td class="nama">
            ${escapeHTML(
              item.nama
            )}
          </td>
      `;


      for (
        let d = 1;
        d <= jumlahHari;
        d++
      ) {

        const kode =
          item.hari[d] || "";


        html += `
          <td>
            ${kode}
          </td>
        `;

      }


      html += `
        </tr>
      `;


      body.insertAdjacentHTML(
        "beforeend",
        html
      );

    }
  );

}


/* =====================================================
   MESSAGE
===================================================== */

function showMessage(
  message,
  type
) {

  const element =
    document.getElementById(
      "message"
    );


  element.className =
    "message " +
    type;


  element.textContent =
    message;

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {

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
