const API_URL =
  "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";


/* =====================================================
   USER LOGIN
===================================================== */

const user = JSON.parse(
  localStorage.getItem("presensiUser") || "null"
);


if (!user) {
  window.location.href = "index.html";
}


const idGuru =
  String(user?.idGuru || "").trim();


const namaGuru =
  user?.nama ||
  user?.namaGuru ||
  "Guru";


let kelasGuru = "";
let nipGuru = "";


/* =====================================================
   BULAN
===================================================== */

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
   API
===================================================== */

async function callAPI(data) {

  const response = await fetch(
    API_URL,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "text/plain;charset=utf-8"
      },

      body: JSON.stringify(data)
    }
  );


  const text =
    await response.text();


  console.log(
    "API:",
    text
  );


  let result;

  try {

    result =
      JSON.parse(text);

  } catch (error) {

    throw new Error(
      "Server tidak mengembalikan JSON."
    );

  }


  return result;

}


/* =====================================================
   INIT
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  async function () {

    isiTahun();

    isiBulan();

    tampilkanIdentitas();

    await loadKelasGuru();

  }
);


/* =====================================================
   TAHUN
===================================================== */

function isiTahun() {

  const select =
    document.getElementById("tahun");


  const tahunSekarang =
    new Date().getFullYear();


  for (
    let tahun = tahunSekarang - 2;
    tahun <= tahunSekarang + 1;
    tahun++
  ) {

    const option =
      document.createElement("option");


    option.value =
      tahun;


    option.textContent =
      tahun;


    if (
      tahun === tahunSekarang
    ) {

      option.selected = true;

    }


    select.appendChild(option);

  }

}


/* =====================================================
   BULAN SEKARANG
===================================================== */

function isiBulan() {

  const bulan =
    new Date().getMonth() + 1;


  document.getElementById(
    "bulan"
  ).value =
    bulan;

}


/* =====================================================
   IDENTITAS
===================================================== */

function tampilkanIdentitas() {

  document.getElementById(
    "namaGuru"
  ).textContent =
    namaGuru;


  document.getElementById(
    "namaGuruSignature"
  ).textContent =
    "( " + namaGuru + " )";


  document.getElementById(
    "nipGuru"
  ).textContent =
    nipGuru ||
    "__________________________";


  const sekarang =
    new Date();


  const tanggal =
    sekarang.getDate();


  const bulan =
    namaBulan[
      sekarang.getMonth() + 1
    ];


  const tahun =
    sekarang.getFullYear();


  document.getElementById(
    "tanggalCetak"
  ).textContent =
    "Jakarta, " +
    tanggal +
    " " +
    bulan +
    " " +
    tahun;

}


/* =====================================================
   KELAS GURU
===================================================== */

async function loadKelasGuru() {

  try {

    if (!idGuru) {

      throw new Error(
        "ID Guru tidak ditemukan pada data login."
      );

    }


    const result =
      await callAPI({

        action:
          "getKelasGuru",

        idGuru:
          idGuru

      });


    console.log(
      "Kelas Guru:",
      result
    );


    if (!result.success) {

      throw new Error(
        result.message ||
        "Gagal mengambil kelas guru."
      );

    }


    const data =
      Array.isArray(result.data)
        ? result.data
        : [];


    if (data.length === 0) {

      throw new Error(
        "Guru belum memiliki kelas."
      );

    }


    /*
      Guru bisa mempunyai lebih dari
      satu kelas, tetapi untuk wali kelas
      kita ambil kelas aktif pertama.
    */

    const kelas =
      data[0];


    kelasGuru =
      kelas.NAMA_KELAS ||
      kelas.nama_kelas ||
      kelas.namaKelas ||
      "";


    nipGuru =
      kelas.NIP ||
      kelas.nip ||
      "";


    document.getElementById(
      "kelasGuru"
    ).textContent =
      kelasGuru;


    document.getElementById(
      "kelasSignature"
    ).textContent =
      " " + kelasGuru;


    document.getElementById(
      "nipGuru"
    ).textContent =
      nipGuru ||
      "__________________________";


    await tampilkanAbsen();


  } catch (error) {

    console.error(error);

    tampilkanError(
      error.message
    );

  }

}


/* =====================================================
   TAMPILKAN ABSEN
===================================================== */

async function tampilkanAbsen() {

  if (!kelasGuru) {

    tampilkanError(
      "Kelas wali kelas belum ditemukan."
    );

    return;

  }


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


  tampilkanLoading();


  try {

    const result =
      await callAPI({

        action:
          "getAbsenBulanan",

        idGuru:
          idGuru,

        kelas:
          kelasGuru,

        bulan:
          bulan,

        tahun:
          tahun

      });


    console.log(
      "Rekap:",
      result
    );


    if (!result.success) {

      throw new Error(
        result.message ||
        "Gagal mengambil data absensi."
      );

    }


    renderTabel(
      result.data
    );


  } catch (error) {

    console.error(error);

    tampilkanError(
      error.message
    );

  }

}


/* =====================================================
   RENDER TABEL
===================================================== */

function renderTabel(data) {

  const siswa =
    data.siswa || [];


  const presensi =
    data.presensi || {};


  const jumlahHari =
    Number(
      data.jumlahHari || 30
    );


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


  /*
    UPDATE PERIODE
  */

  document.getElementById(
    "periode"
  ).textContent =
    namaBulan[bulan] +
    " " +
    tahun;


  /*
    HEADER
  */

  let head = `

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
    let hari = 1;
    hari <= jumlahHari;
    hari++
  ) {

    head += `

      <th
        class="hari"
        rowspan="2"
      >
        ${hari}
      </th>

    `;

  }


  head += `

      <th
        class="total"
        rowspan="2"
      >
        H
      </th>

      <th
        class="total"
        rowspan="2"
      >
        I
      </th>

      <th
        class="total"
        rowspan="2"
      >
        S
      </th>

      <th
        class="total"
        rowspan="2"
      >
        A
      </th>

    </tr>

  `;


  document.getElementById(
    "tableHead"
  ).innerHTML =
    head;


  /*
    BODY
  */

  let body = "";


  siswa.forEach(
    function (siswaItem, index) {

      const id =
        String(
          siswaItem.ID || ""
        ).trim();


      const dataSiswa =
        presensi[id] || {};


      let hadir = 0;
      let izin = 0;
      let sakit = 0;
      let alpa = 0;


      body += `

        <tr>

          <td class="no">
            ${index + 1}
          </td>

          <td class="nama">
            ${escapeHTML(
              siswaItem.NAMA
            )}
          </td>

      `;


      for (
        let hari = 1;
        hari <= jumlahHari;
        hari++
      ) {

        const status =
          String(
            dataSiswa[hari] || ""
          ).toUpperCase();


        let simbol = "";
        let className = "";


        if (
          status === "HADIR"
        ) {

          simbol = "H";

          className =
            "status-HADIR";

          hadir++;

        }

        else if (
          status === "IZIN"
        ) {

          simbol = "I";

          className =
            "status-IZIN";

          izin++;

        }

        else if (
          status === "SAKIT"
        ) {

          simbol = "S";

          className =
            "status-SAKIT";

          sakit++;

        }

        else if (
          status === "ALPA"
        ) {

          simbol = "A";

          className =
            "status-ALPA";

          alpa++;

        }


        body += `

          <td class="${className}">
            ${simbol}
          </td>

        `;

      }


      body += `

          <td class="total">
            ${hadir}
          </td>

          <td class="total">
            ${izin}
          </td>

          <td class="total">
            ${sakit}
          </td>

          <td class="total">
            ${alpa}
          </td>

        </tr>

      `;

    }
  );


  document.getElementById(
    "tableBody"
  ).innerHTML =
    body;


  document.getElementById(
    "loading"
  ).style.display =
    "none";


  document.getElementById(
    "error"
  ).style.display =
    "none";


  document.getElementById(
    "hasil"
  ).style.display =
    "block";

}


/* =====================================================
   LOADING
===================================================== */

function tampilkanLoading() {

  document.getElementById(
    "loading"
  ).style.display =
    "block";


  document.getElementById(
    "loading"
  ).textContent =
    "⏳ Memuat data absensi...";


  document.getElementById(
    "error"
  ).style.display =
    "none";


  document.getElementById(
    "hasil"
  ).style.display =
    "none";

}


/* =====================================================
   ERROR
===================================================== */

function tampilkanError(message) {

  document.getElementById(
    "loading"
  ).style.display =
    "none";


  const error =
    document.getElementById(
      "error"
    );


  error.textContent =
    "❌ " + message;


  error.style.display =
    "block";


  document.getElementById(
    "hasil"
  ).style.display =
    "none";

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
