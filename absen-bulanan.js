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


    laporanData =
  result.data;

renderLaporan(
  result.data
);


    /*
     * SIMPAN DATA LAPORAN
     * supaya bisa digunakan
     * untuk Download Excel
     */

    laporanData =
      result.data;


    renderLaporan(
      result.data
    );


    showMessage(
      "Laporan berhasil dibuat.",
      "success"
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
   DOWNLOAD EXCEL
   TANPA LIBRARY XLSX
===================================================== */

function downloadExcel() {

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
    data.sekolah.nama ||
    "SD NEGERI JATIWARINGIN XIII";


  const namaKelas =
    data.kelas.nama ||
    "-";


  const namaWali =
    data.guru.nama ||
    "-";


  const nipWali =
    data.guru.nip ||
    "-";


  const namaKepala =
    data.kepalaSekolah.nama ||
    "-";


  const nipKepala =
    data.kepalaSekolah.nip ||
    "-";


  const periode =
    namaBulan[data.bulan] +
    " " +
    data.tahun;


  /* =================================================
     BUAT HTML UNTUK EXCEL
  ================================================= */

  let html = `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<style>

body {
  font-family: Arial, sans-serif;
}

.title {
  font-size: 18pt;
  font-weight: bold;
  text-align: center;
}

.school {
  font-size: 15pt;
  font-weight: bold;
  text-align: center;
}

.info {
  font-size: 11pt;
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
  vertical-align: middle;
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

.ttd {
  border: none !important;
}

.ttd td {
  border: none !important;
  text-align: center;
  height: 80px;
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

<td colspan="${jumlahHari + 2}">
  &nbsp;
</td>

</tr>


<tr>

<td class="info">
  <b>Kelas</b>
</td>

<td
  colspan="${jumlahHari + 1}"
  class="info"
>
  ${escapeExcelHTML(
    namaKelas
  )}
</td>

</tr>


<tr>

<td class="info">
  <b>Wali Kelas</b>
</td>

<td
  colspan="${jumlahHari + 1}"
  class="info"
>
  ${escapeExcelHTML(
    namaWali
  )}
</td>

</tr>


<tr>

<td class="info">
  <b>NIP Wali Kelas</b>
</td>

<td
  colspan="${jumlahHari + 1}"
  class="info"
>
  ${escapeExcelHTML(
    nipWali
  )}
</td>

</tr>


<tr>

<td class="info">
  <b>Bulan</b>
</td>

<td
  colspan="${jumlahHari + 1}"
  class="info"
>
  ${escapeExcelHTML(
    periode
  )}
</td>

</tr>


<tr>

<td colspan="${jumlahHari + 2}">
  &nbsp;
</td>

</tr>


<!-- HEADER ABSENSI -->

<tr>

<th class="no">
  No
</th>

<th>
  Nama Siswa
</th>
`;


  /* =================================================
     HEADER TANGGAL
  ================================================= */

  for (
    let d = 1;
    d <= jumlahHari;
    d++
  ) {

    html += `
<th>
  ${d}
</th>
`;

  }


  html += `
</tr>
`;


  /* =================================================
     DATA SISWA
  ================================================= */

  if (
    data.siswa &&
    data.siswa.length > 0
  ) {

    data.siswa.forEach(
      function (
        siswa,
        index
      ) {

        html += `
<tr>

<td class="no">
  ${index + 1}
</td>

<td class="nama">
  ${escapeExcelHTML(
    siswa.nama || ""
  )}
</td>
`;


        for (
          let d = 1;
          d <= jumlahHari;
          d++
        ) {

          const kode =
            siswa.hari[d] || "";


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

  } else {

    html += `
<tr>

<td
  colspan="${jumlahHari + 2}"
>
  Tidak ada siswa
</td>

</tr>
`;

  }


  /* =================================================
     KETERANGAN
  ================================================= */

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


<!-- TANDA TANGAN -->

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
</td>


<td
  colspan="${Math.floor(
    (jumlahHari + 2) / 2
  )}"
>
  <br><br><br>
</td>

</tr>


<tr class="ttd">

<td
  colspan="${Math.ceil(
    (jumlahHari + 2) / 2
  )}"
>

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


  /* =================================================
     BUAT FILE EXCEL
  ================================================= */

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
      data.bulan
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
   ESCAPE HTML UNTUK EXCEL
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


  /*
   * ================================================
   * DATA EXCEL
   * ================================================
   */

  const rows = [];


  rows.push([
    "DAFTAR ABSENSI SISWA"
  ]);


  rows.push([
    namaSekolah
  ]);


  rows.push([]);


  rows.push([
    "Kelas",
    namaKelas
  ]);


  rows.push([
    "Wali Kelas",
    namaWali
  ]);


  rows.push([
    "NIP Wali Kelas",
    nipWali
  ]);


  rows.push([
    "Bulan",
    periode
  ]);


  rows.push([]);


  /*
   * HEADER TABEL
   */

  const header = [
    "No",
    "Nama Siswa"
  ];


  for (
    let d = 1;
    d <= jumlahHari;
    d++
  ) {

    header.push(
      String(d)
    );

  }


  rows.push(header);


  /*
   * DATA SISWA
   */

  if (
    data.siswa &&
    data.siswa.length > 0
  ) {

    data.siswa.forEach(
      function (
        siswa,
        index
      ) {

        const row = [
          index + 1,
          siswa.nama || ""
        ];


        for (
          let d = 1;
          d <= jumlahHari;
          d++
        ) {

          row.push(
            siswa.hari[d] || ""
          );

        }


        rows.push(row);

      }
    );

  } else {

    const row = [
      "",
      "Tidak ada siswa"
    ];


    for (
      let d = 1;
      d <= jumlahHari;
      d++
    ) {

      row.push("");

    }


    rows.push(row);

  }


  /*
   * KETERANGAN
   */

  rows.push([]);

  rows.push([
    "Keterangan",
    "H = Hadir, I = Izin, S = Sakit, A = Alpa"
  ]);


  rows.push([]);


  /*
   * TANDA TANGAN
   */

  rows.push([
    "Kepala Sekolah",
    "",
    "",
    "Wali Kelas"
  ]);


  rows.push([]);


  rows.push([
    namaKepala,
    "",
    "",
    namaWali
  ]);


  rows.push([
    "NIP. " + nipKepala,
    "",
    "",
    "NIP. " + nipWali
  ]);


  /*
   * ================================================
   * BUAT WORKSHEET
   * ================================================
   */

  const worksheet =
    XLSX.utils.aoa_to_sheet(
      rows
    );


  /*
   * ================================================
   * LEBAR KOLOM
   * ================================================
   */

  const widths = [];


  widths.push({
    wch: 6
  });


  widths.push({
    wch: 30
  });


  for (
    let d = 1;
    d <= jumlahHari;
    d++
  ) {

    widths.push({
      wch: 5
    });

  }


  worksheet["!cols"] =
    widths;


  /*
   * ================================================
   * MERGE JUDUL
   * ================================================
   */

  worksheet["!merges"] = [

    {
      s: {
        r: 0,
        c: 0
      },

      e: {
        r: 0,
        c: jumlahHari + 1
      }
    },

    {
      s: {
        r: 1,
        c: 0
      },

      e: {
        r: 1,
        c: jumlahHari + 1
      }
    }

  ];


  /*
   * ================================================
   * FORMAT HEADER
   * ================================================
   */

  const headerRow =
    8;


  for (
    let c = 0;
    c <= jumlahHari + 1;
    c++
  ) {

    const cell =
      XLSX.utils.encode_cell({
        r: headerRow,
        c: c
      });


    if (
      worksheet[cell]
    ) {

      worksheet[cell].s = {

        font: {
          bold: true
        },

        alignment: {
          horizontal:
            "center",
          vertical:
            "center"
        },

        border: {

          top: {
            style: "thin"
          },

          bottom: {
            style: "thin"
          },

          left: {
            style: "thin"
          },

          right: {
            style: "thin"
          }

        }

      };

    }

  }


  /*
   * ================================================
   * BORDER DATA
   * ================================================
   */

  for (
    let r = headerRow + 1;
    r < rows.length;
    r++
  ) {

    for (
      let c = 0;
      c <= jumlahHari + 1;
      c++
    ) {

      const cell =
        XLSX.utils.encode_cell({
          r: r,
          c: c
        });


      if (
        worksheet[cell]
      ) {

        worksheet[cell].s = {

          border: {

            top: {
              style: "thin"
            },

            bottom: {
              style: "thin"
            },

            left: {
              style: "thin"
            },

            right: {
              style: "thin"
            }

          },

          alignment: {

            horizontal:
              c === 1
                ? "left"
                : "center",

            vertical:
              "center"

          }

        };

      }

    }

  }


  /*
   * ================================================
   * BUAT WORKBOOK
   * ================================================
   */

  const workbook =
    XLSX.utils.book_new();


  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Absensi Bulanan"
  );


  /*
   * ================================================
   * NAMA FILE
   * ================================================
   */

  const namaFile =
    "Absensi_" +
    sanitasiNamaFile(
      namaKelas
    ) +
    "_" +
    namaBulan[data.bulan] +
    "_" +
    data.tahun +
    ".xlsx";


  /*
   * ================================================
   * DOWNLOAD
   * ================================================
   */

  XLSX.writeFile(
    workbook,
    namaFile
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
