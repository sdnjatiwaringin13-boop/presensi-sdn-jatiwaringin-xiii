const API_URL =
  "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";


let currentUser = null;

let laporanData = null;


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

    console.log(
      "absen-bulanan.js berhasil dimuat."
    );


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

      console.error(error);

      localStorage.removeItem(
        "presensiUser"
      );

      location.href =
        "index.html";

      return;

    }


    console.log(
      "USER:",
      currentUser
    );


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


    /*
     * SET BULAN
     */

    document.getElementById(
      "bulan"
    ).value =
      sekarang.getMonth() + 1;


    /*
     * SET TAHUN
     */

    document.getElementById(
      "tahun"
    ).value =
      sekarang.getFullYear();


    /*
     * BUAT LAPORAN
     */

    buatLaporan();

  }
);


/* =====================================================
   API
===================================================== */

async function callAPI(
  payload
) {

  console.log(
    "REQUEST API:",
    payload
  );


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


  console.log(
    "RESPONSE API:",
    text
  );


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

    console.error(
      "Response bukan JSON:",
      text
    );

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

  const bulanElement =
    document.getElementById(
      "bulan"
    );


  const tahunElement =
    document.getElementById(
      "tahun"
    );


  if (
    !bulanElement ||
    !tahunElement
  ) {

    alert(
      "Elemen bulan/tahun tidak ditemukan."
    );

    return;

  }


  const bulan =
    Number(
      bulanElement.value
    );


  const tahun =
    Number(
      tahunElement.value
    );


  if (
    !bulan ||
    bulan < 1 ||
    bulan > 12
  ) {

    showMessage(
      "Bulan tidak valid.",
      "error"
    );

    return;

  }


  if (
    !tahun ||
    tahun < 2020
  ) {

    showMessage(
      "Tahun tidak valid.",
      "error"
    );

    return;

  }


  const loading =
    document.getElementById(
      "loading"
    );


  if (loading) {

    loading.style.display =
      "block";

  }


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
      !result ||
      result.success !== true
    ) {

      throw new Error(
        result &&
        result.message
          ? result.message
          : "Gagal membuat laporan."
      );

    }


    if (!result.data) {

      throw new Error(
        "Server tidak mengirim data laporan."
      );

    }


    /*
     * SIMPAN DATA
     */

    laporanData =
      result.data;


    /*
     * TAMPILKAN
     */

    renderLaporan(
      laporanData
    );


    showMessage(
      "Laporan berhasil dimuat.",
      "success"
    );

  } catch (error) {

    console.error(
      "ERROR LAPORAN:",
      error
    );


    showMessage(
      error.message,
      "error"
    );

  } finally {

    if (loading) {

      loading.style.display =
        "none";

    }

  }

}


/* =====================================================
   RENDER LAPORAN
===================================================== */

function renderLaporan(
  data
) {

  console.log(
    "RENDER DATA:",
    data
  );


  document.getElementById(
    "namaSekolah"
  ).textContent =
    data.sekolah &&
    data.sekolah.nama
      ? data.sekolah.nama
      : "SD NEGERI JATIWARINGIN XIII";


  document.getElementById(
    "kelas"
  ).textContent =
    data.kelas &&
    data.kelas.nama
      ? data.kelas.nama
      : "-";


  document.getElementById(
    "waliKelas"
  ).textContent =
    data.guru &&
    data.guru.nama
      ? data.guru.nama
      : "-";


  document.getElementById(
    "periode"
  ).textContent =
    namaBulan[
      Number(data.bulan)
    ] +
    " " +
    data.tahun;


  document.getElementById(
    "namaKepala"
  ).textContent =
    data.kepalaSekolah &&
    data.kepalaSekolah.nama
      ? data.kepalaSekolah.nama
      : "-";


  document.getElementById(
    "nipKepala"
  ).textContent =
    data.kepalaSekolah &&
    data.kepalaSekolah.nip
      ? data.kepalaSekolah.nip
      : "-";


  document.getElementById(
    "namaWali"
  ).textContent =
    data.guru &&
    data.guru.nama
      ? data.guru.nama
      : "-";


  document.getElementById(
    "nipWali"
  ).textContent =
    data.guru &&
    data.guru.nip
      ? data.guru.nip
      : "-";


  buatHeader(
    Number(data.jumlahHari)
  );


  buatBody(
    data.siswa || [],
    Number(data.jumlahHari)
  );

}


/* =====================================================
   HEADER TABEL
===================================================== */

function buatHeader(
  jumlahHari
) {

  const head =
    document.getElementById(
      "tableHead"
    );


  if (!head) {

    return;

  }


  let html = `
    <tr>

      <th
        class="no"
      >
        No
      </th>

      <th
        class="nama"
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
   BODY TABEL
===================================================== */

function buatBody(
  siswa,
  jumlahHari
) {

  const body =
    document.getElementById(
      "tableBody"
    );


  if (!body) {

    return;

  }


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
          Tidak ada siswa pada kelas ini.
        </td>

      </tr>
    `;

    return;

  }


  siswa.forEach(
    function (
      item,
      index
    ) {

      let html = `
        <tr>

          <td class="no">
            ${index + 1}
          </td>

          <td class="nama">
            ${escapeHTML(
              item.nama || ""
            )}
          </td>
      `;


      for (
        let d = 1;
        d <= jumlahHari;
        d++
      ) {

        const kode =
          item.hari &&
          item.hari[d]
            ? item.hari[d]
            : "";


        html += `
          <td>
            ${escapeHTML(
              kode
            )}
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
   DOWNLOAD EXCEL
   TANPA LIBRARY
===================================================== */

function downloadExcel() {

  console.log(
    "DOWNLOAD EXCEL DIPANGGIL"
  );


  if (!laporanData) {

    alert(
      "Silakan tampilkan laporan terlebih dahulu."
    );

    return;

  }


  const data =
    laporanData;


  const jumlahHari =
    Number(
      data.jumlahHari
    );


  const namaSekolah =
    data.sekolah &&
    data.sekolah.nama
      ? data.sekolah.nama
      : "SD NEGERI JATIWARINGIN XIII";


  const namaKelas =
    data.kelas &&
    data.kelas.nama
      ? data.kelas.nama
      : "-";


  const namaWali =
    data.guru &&
    data.guru.nama
      ? data.guru.nama
      : "-";


  const nipWali =
    data.guru &&
    data.guru.nip
      ? data.guru.nip
      : "-";


  const namaKepala =
    data.kepalaSekolah &&
    data.kepalaSekolah.nama
      ? data.kepalaSekolah.nama
      : "-";


  const nipKepala =
    data.kepalaSekolah &&
    data.kepalaSekolah.nip
      ? data.kepalaSekolah.nip
      : "-";


  const periode =
    namaBulan[
      Number(data.bulan)
    ] +
    " " +
    data.tahun;


  let html = `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<style>

body {
  font-family: Arial;
}

.title {
  font-size: 18pt;
  font-weight: bold;
  text-align: center;
}

.school {
  font-size: 14pt;
  font-weight: bold;
  text-align: center;
}

table {
  border-collapse: collapse;
  width: 100%;
}

th {
  border: 1px solid #000;
  background: #d9eaf7;
  font-weight: bold;
  text-align: center;
  padding: 5px;
}

td {
  border: 1px solid #000;
  padding: 4px;
  text-align: center;
}

.nama {
  text-align: left;
}

.no {
  text-align: center;
}

.ttd td {
  border: none;
  text-align: center;
}

</style>

</head>

<body>

<table>

<tr>

<td
  colspan="${jumlahHari + 2}"
  class="title"
>
DAFTAR ABSENSI SISWA
</td>

</tr>


<tr>

<td
  colspan="${jumlahHari + 2}"
  class="school"
>
${escapeExcelHTML(
  namaSekolah
)}
</td>

</tr>


<tr>

<td
  colspan="${jumlahHari + 2}"
>
&nbsp;
</td>

</tr>


<tr>

<td>
<b>Kelas</b>
</td>

<td
  colspan="${jumlahHari + 1}"
>
${escapeExcelHTML(
  namaKelas
)}
</td>

</tr>


<tr>

<td>
<b>Wali Kelas</b>
</td>

<td
  colspan="${jumlahHari + 1}"
>
${escapeExcelHTML(
  namaWali
)}
</td>

</tr>


<tr>

<td>
<b>NIP Wali Kelas</b>
</td>

<td
  colspan="${jumlahHari + 1}"
>
${escapeExcelHTML(
  nipWali
)}
</td>

</tr>


<tr>

<td>
<b>Bulan</b>
</td>

<td
  colspan="${jumlahHari + 1}"
>
${escapeExcelHTML(
  periode
)}
</td>

</tr>


<tr>

<td
  colspan="${jumlahHari + 2}"
>
&nbsp;
</td>

</tr>


<tr>

<th>
No
</th>

<th>
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


  const siswa =
    data.siswa || [];


  siswa.forEach(
    function (
      item,
      index
    ) {

      html += `
        <tr>

          <td>
            ${index + 1}
          </td>

          <td class="nama">
            ${escapeExcelHTML(
              item.nama || ""
            )}
          </td>
      `;


      for (
        let d = 1;
        d <= jumlahHari;
        d++
      ) {

        const kode =
          item.hari &&
          item.hari[d]
            ? item.hari[d]
            : "";


        html += `
          <td>
            ${escapeExcelHTML(
              kode
            )}
          </td>
        `;

      }


      html += `
        </tr>
      `;

    }
  );


  html += `

<tr>

<td
  colspan="${jumlahHari + 2}"
>
&nbsp;
</td>

</tr>


<tr>

<td>
<b>Keterangan</b>
</td>

<td
  colspan="${jumlahHari + 1}"
>
H = Hadir,
I = Izin,
S = Sakit,
A = Alpa
</td>

</tr>


<tr>

<td
  colspan="${jumlahHari + 2}"
>
&nbsp;
</td>

</tr>


<tr class="ttd">

<td
  colspan="${Math.ceil(
    (jumlahHari + 2) / 2
  )}"
>
<b>Kepala Sekolah</b>
</td>

<td
  colspan="${Math.floor(
    (jumlahHari + 2) / 2
  )}"
>
<b>Wali Kelas</b>
</td>

</tr>


<tr class="ttd">

<td
  colspan="${Math.ceil(
    (jumlahHari + 2) / 2
  )}"
>
<br><br><br>
<b>
${escapeExcelHTML(
  namaKepala
)}
</b>
<br>
NIP.
${escapeExcelHTML(
  nipKepala
)}
</td>


<td
  colspan="${Math.floor(
    (jumlahHari + 2) / 2
  )}"
>
<br><br><br>
<b>
${escapeExcelHTML(
  namaWali
)}
</b>
<br>
NIP.
${escapeExcelHTML(
  nipWali
)}
</td>

</tr>

</table>

</body>

</html>
`;


  const blob =
    new Blob(
      [
        "\uFEFF",
        html
      ],
      {
        type:
          "application/vnd.ms-excel"
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  const link =
    document.createElement(
      "a"
    );


  const namaFile =
    "Absensi_" +
    sanitasiNamaFile(
      namaKelas
    ) +
    "_" +
    namaBulan[
      Number(data.bulan)
    ] +
    "_" +
    data.tahun +
    ".xls";


  link.href =
    url;


  link.download =
    namaFile;


  document.body.appendChild(
    link
  );


  link.click();


  document.body.removeChild(
    link
  );


  setTimeout(
    function () {

      URL.revokeObjectURL(
        url
      );

    },
    1000
  );

}


/* =====================================================
   SANITASI NAMA FILE
===================================================== */

function sanitasiNamaFile(
  nama
) {

  return String(
    nama || "Kelas"
  )
    .replace(
      /[\\/:*?"<>|]/g,
      "_"
    )
    .replace(
      /\s+/g,
      "_"
    );

}


/* =====================================================
   ESCAPE HTML
===================================================== */

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


/* =====================================================
   ESCAPE EXCEL HTML
===================================================== */

function escapeExcelHTML(
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


  if (!element) {

    alert(message);

    return;

  }


  element.className =
    "message " +
    type;


  element.textContent =
    message;

}
