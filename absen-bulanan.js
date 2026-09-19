const API_URL =
  "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";


const user =
  JSON.parse(
    localStorage.getItem(
      "presensiUser"
    ) || "null"
  );


if (
  !user ||
  String(
    user.role || ""
  ).toUpperCase()
  !== "GURU"
) {

  window.location.href =
    "index.html";

}


const idGuru =
  String(
    user.idGuru || ""
  ).trim();


let kelasGuru = "";


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


  const text =
    await response.text();


  let result;


  try {

    result =
      JSON.parse(text);

  } catch (error) {

    throw new Error(
      "Response server bukan JSON."
    );

  }


  return result;

}


document.addEventListener(
  "DOMContentLoaded",
  async function() {

    isiTahun();

    document.getElementById(
      "bulan"
    ).value =
      new Date()
        .getMonth() + 1;


    await loadKelasGuru();

  }
);


function isiTahun() {

  const select =
    document.getElementById(
      "tahun"
    );


  const tahun =
    new Date()
      .getFullYear();


  for (
    let i = tahun - 3;
    i <= tahun + 1;
    i++
  ) {

    const option =
      document.createElement(
        "option"
      );


    option.value =
      i;

    option.textContent =
      i;


    if (
      i === tahun
    ) {

      option.selected =
        true;

    }


    select.appendChild(
      option
    );

  }

}


async function loadKelasGuru() {

  try {

    if (!idGuru) {

      throw new Error(
        "ID Guru tidak ditemukan."
      );

    }


    const result =
      await callAPI({

        action:
          "getKelasGuru",

        idGuru:
          idGuru

      });


    if (!result.success) {

      throw new Error(
        result.message
      );

    }


    if (
      !result.data ||
      result.data.length === 0
    ) {

      throw new Error(
        "Guru belum memiliki kelas."
      );

    }


    kelasGuru =
      result.data[0]
        .NAMA_KELAS;


    document.getElementById(
      "kelasGuru"
    ).textContent =
      kelasGuru;


    document.getElementById(
      "kelasTtd"
    ).textContent =
      " " +
      kelasGuru;


    await tampilkanAbsen();


  } catch (error) {

    tampilkanError(
      error.message
    );

  }

}


async function tampilkanAbsen() {

  try {

    tampilkanLoading();


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


    if (!result.success) {

      throw new Error(
        result.message
      );

    }


    renderHeader(
      result.data
    );


    renderTabel(
      result.data
    );


  } catch (error) {

    tampilkanError(
      error.message
    );

  }

}


function renderHeader(data) {

  const guru =
    data.guru || {};


  const sekolah =
    data.sekolah || {};


  document.getElementById(
    "namaSekolah"
  ).textContent =
    sekolah.namaSekolah ||
    "SD Negeri Jatiwaringin XIII";


  document.getElementById(
    "namaGuru"
  ).textContent =
    guru.nama || "-";


  document.getElementById(
    "namaGuruTtd"
  ).textContent =
    guru.nama || "________________";


  document.getElementById(
    "nipGuru"
  ).textContent =
    guru.nip ||
    "________________";


  document.getElementById(
    "namaKepala"
  ).textContent =
    sekolah.namaKepala ||
    "________________";


  document.getElementById(
    "nipKepala"
  ).textContent =
    sekolah.nipKepala ||
    "________________";


  document.getElementById(
    "periode"
  ).textContent =
    namaBulan[
      data.bulan
    ] +
    " " +
    data.tahun;


  document.getElementById(
    "tanggalCetak"
  ).textContent =
    buatTanggalCetak(
      data.bulan,
      data.tahun
    );

}


function buatTanggalCetak(
  bulan,
  tahun
) {

  const hariTerakhir =
    new Date(
      tahun,
      bulan,
      0
    ).getDate();


  return (
    "Jakarta, " +
    hariTerakhir +
    " " +
    namaBulan[bulan] +
    " " +
    tahun
  );

}


function renderTabel(data) {

  const siswa =
    data.siswa || [];


  const presensi =
    data.presensi || {};


  const jumlahHari =
    data.jumlahHari;


  let header = `

    <tr>

      <th class="no">
        No
      </th>

      <th class="nama">
        Nama Siswa
      </th>

  `;


  for (
    let hari = 1;
    hari <= jumlahHari;
    hari++
  ) {

    header += `

      <th class="hari">
        ${hari}
      </th>

    `;

  }


  header += `

      <th class="total">
        H
      </th>

      <th class="total">
        I
      </th>

      <th class="total">
        S
      </th>

      <th class="total">
        A
      </th>

    </tr>

  `;


  document.getElementById(
    "tableHead"
  ).innerHTML =
    header;


  let body = "";


  siswa.forEach(
    function(s, index) {

      const id =
        String(
          s.ID || ""
        );


      const absen =
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
            ${escapeHTML(s.NAMA)}
          </td>

      `;


      for (
        let hari = 1;
        hari <= jumlahHari;
        hari++
      ) {

        const status =
          String(
            absen[hari] || ""
          ).toUpperCase();


        let simbol = "";
        let cls = "";


        if (
          status === "HADIR"
        ) {

          simbol = "H";
          cls = "hadir";
          hadir++;

        }


        if (
          status === "IZIN"
        ) {

          simbol = "I";
          cls = "izin";
          izin++;

        }


        if (
          status === "SAKIT"
        ) {

          simbol = "S";
          cls = "sakit";
          sakit++;

        }


        if (
          status === "ALPA"
        ) {

          simbol = "A";
          cls = "alpa";
          alpa++;

        }


        body += `

          <td class="${cls}">
            ${simbol}
          </td>

        `;

      }


      body += `

          <td>
            ${hadir}
          </td>

          <td>
            ${izin}
          </td>

          <td>
            ${sakit}
          </td>

          <td>
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
    "hasil"
  ).style.display =
    "none";


  document.getElementById(
    "error"
  ).style.display =
    "none";

}


function tampilkanError(
  message
) {

  document.getElementById(
    "loading"
  ).style.display =
    "none";


  document.getElementById(
    "hasil"
  ).style.display =
    "none";


  const el =
    document.getElementById(
      "error"
    );


  el.style.display =
    "block";


  el.textContent =
    "❌ " +
    message;

}


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
