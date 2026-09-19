const API_URL =
  "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";


/* =========================================================
   DATA USER LOGIN
========================================================= */

const user = JSON.parse(
  localStorage.getItem("presensiUser") || "null"
);

if (!user) {
  window.location.href = "index.html";
}

const idGuru = user?.idGuru || "";
const namaGuru = user?.nama || user?.namaGuru || "";
const role = String(user?.role || "").toUpperCase();


/* =========================================================
   DATA SISWA
========================================================= */

let daftarSiswa = [];
let statusPresensi = {};


/* =========================================================
   API
========================================================= */

async function callAPI(data) {

  try {

    const response = await fetch(API_URL, {
      method: "POST",

      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },

      body: JSON.stringify(data)
    });


    const text = await response.text();

    console.log("API Response:", text);

    let result;

    try {
      result = JSON.parse(text);
    } catch (error) {

      throw new Error(
        "Server tidak mengembalikan JSON."
      );

    }

    return result;

  } catch (error) {

    console.error("API Error:", error);

    throw error;

  }
}


/* =========================================================
   INIT
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

  console.log("User login:", user);
  console.log("ID Guru:", idGuru);

  tampilkanInfoGuru();

  setTanggalHariIni();

  pasangEvent();

  loadKelas();

});


/* =========================================================
   INFO GURU
========================================================= */

function tampilkanInfoGuru() {

  const element =
    document.getElementById("guruInfo");

  if (!element) return;


  if (!user) {

    element.innerHTML =
      "User tidak ditemukan.";

    return;

  }


  element.innerHTML = `
    <strong>${escapeHTML(namaGuru || "Guru")}</strong>
    <br>
    ID Guru: <strong>${escapeHTML(idGuru || "-")}</strong>
  `;

}


/* =========================================================
   TANGGAL
========================================================= */

function setTanggalHariIni() {

  const input =
    document.getElementById("tanggal");

  if (!input) return;


  const sekarang = new Date();

  const tahun =
    sekarang.getFullYear();

  const bulan =
    String(sekarang.getMonth() + 1)
      .padStart(2, "0");

  const tanggal =
    String(sekarang.getDate())
      .padStart(2, "0");


  input.value =
    `${tahun}-${bulan}-${tanggal}`;

}


/* =========================================================
   EVENT
========================================================= */

function pasangEvent() {

  const kelas =
    document.getElementById("kelas");

  const loadButton =
    document.getElementById("loadButton");

  const hadirSemuaButton =
    document.getElementById("hadirSemuaButton");

  const resetButton =
    document.getElementById("resetButton");

  const simpanButton =
    document.getElementById("simpanButton");


  if (kelas) {

    kelas.addEventListener(
      "change",
      function () {

        const value = this.value;

        if (value) {
          loadSiswa(value);
        }

      }
    );

  }


  if (loadButton) {

    loadButton.addEventListener(
      "click",
      function () {

        const kelasValue =
          document.getElementById("kelas").value;

        if (!kelasValue) {

          tampilkanPesan(
            "Silakan pilih kelas terlebih dahulu.",
            "error"
          );

          return;

        }

        loadSiswa(kelasValue);

      }
    );

  }


  if (hadirSemuaButton) {

    hadirSemuaButton.addEventListener(
      "click",
      hadirSemua
    );

  }


  if (resetButton) {

    resetButton.addEventListener(
      "click",
      resetPresensi
    );

  }


  if (simpanButton) {

    simpanButton.addEventListener(
      "click",
      simpanPresensi
    );

  }

}


/* =========================================================
   LOAD KELAS GURU
========================================================= */

async function loadKelas() {

  const select =
    document.getElementById("kelas");

  if (!select) return;


  select.innerHTML = `
    <option value="">
      Memuat kelas...
    </option>
  `;


  try {

    if (!idGuru) {

      throw new Error(
        "ID Guru tidak ditemukan pada data login."
      );

    }


    console.log(
      "Mengambil kelas untuk ID Guru:",
      idGuru
    );


    const result = await callAPI({

      action: "getKelasGuru",

      idGuru: idGuru

    });


    console.log(
      "Hasil getKelasGuru:",
      result
    );


    if (!result.success) {

      throw new Error(
        result.message ||
        "Gagal mengambil data kelas."
      );

    }


    const data =
      Array.isArray(result.data)
        ? result.data
        : [];


    select.innerHTML = `
      <option value="">
        Pilih Kelas
      </option>
    `;


    if (data.length === 0) {

      select.innerHTML = `
        <option value="">
          Tidak ada kelas
        </option>
      `;

      tampilkanPesan(
        "Belum ada kelas yang ditugaskan kepada guru ini.",
        "error"
      );

      return;

    }


    data.forEach(function (kelas) {

      const option =
        document.createElement("option");


      option.value =
        kelas.NAMA_KELAS ||
        kelas.nama_kelas ||
        kelas.namaKelas ||
        "";


      option.textContent =
        kelas.NAMA_KELAS ||
        kelas.nama_kelas ||
        kelas.namaKelas ||
        "Kelas";


      select.appendChild(option);

    });


    console.log(
      "Kelas berhasil dimuat:",
      data
    );


  } catch (error) {

    console.error(
      "Gagal load kelas:",
      error
    );


    select.innerHTML = `
      <option value="">
        Gagal memuat kelas
      </option>
    `;


    tampilkanPesan(
      "Gagal memuat kelas: " +
      error.message,
      "error"
    );

  }

}


/* =========================================================
   LOAD SISWA
========================================================= */

async function loadSiswa(namaKelas) {

  const table =
    document.getElementById("presensiTable");

  const body =
    document.getElementById("presensiBody");

  const loading =
    document.getElementById("tableLoading");


  if (!namaKelas) return;


  loading.style.display = "block";

  loading.innerHTML =
    "⏳ Memuat data siswa...";


  table.style.display = "none";

  body.innerHTML = "";


  try {

    const result =
      await callAPI({

        action: "getSiswa",

        kelas: namaKelas

      });


    console.log(
      "Data siswa:",
      result
    );


    if (!result.success) {

      throw new Error(
        result.message ||
        "Gagal mengambil data siswa."
      );

    }


    daftarSiswa =
      Array.isArray(result.data)
        ? result.data
        : [];


    statusPresensi = {};


    daftarSiswa.forEach(function (siswa) {

      statusPresensi[
        String(siswa.ID)
      ] = "HADIR";

    });


    renderTabelSiswa();


    loading.style.display =
      daftarSiswa.length === 0
        ? "block"
        : "none";


    if (daftarSiswa.length === 0) {

      loading.innerHTML =
        "Tidak ada siswa pada kelas ini.";

      table.style.display = "none";

    } else {

      table.style.display = "table";

    }


    updateSummary();


  } catch (error) {

    console.error(
      "Gagal load siswa:",
      error
    );


    loading.style.display = "block";

    loading.innerHTML =
      "❌ Gagal memuat siswa: " +
      escapeHTML(error.message);


  }

}


/* =========================================================
   TABEL SISWA
========================================================= */

function renderTabelSiswa() {

  const body =
    document.getElementById("presensiBody");

  body.innerHTML = "";


  daftarSiswa.forEach(function (siswa, index) {

    const id =
      String(siswa.ID);


    const status =
      statusPresensi[id] ||
      "HADIR";


    const row =
      document.createElement("tr");


    row.innerHTML = `

      <td>
        ${index + 1}
      </td>

      <td>
        ${escapeHTML(siswa.NISN || "-")}
      </td>

      <td>
        <strong>
          ${escapeHTML(siswa.NAMA || "-")}
        </strong>
      </td>

      <td>
        ${escapeHTML(siswa.KELAS || "-")}
      </td>

      <td>
        ${escapeHTML(siswa.JK || "-")}
      </td>

      <td>

        <select
          class="status-select"
          data-id="${escapeHTML(id)}"
          onchange="ubahStatus('${escapeJS(id)}', this.value)"
        >

          <option
            value="HADIR"
            ${status === "HADIR" ? "selected" : ""}
          >
            HADIR
          </option>

          <option
            value="IZIN"
            ${status === "IZIN" ? "selected" : ""}
          >
            IZIN
          </option>

          <option
            value="SAKIT"
            ${status === "SAKIT" ? "selected" : ""}
          >
            SAKIT
          </option>

          <option
            value="ALPA"
            ${status === "ALPA" ? "selected" : ""}
          >
            ALPA
          </option>

        </select>

      </td>

    `;


    body.appendChild(row);

  });

}


/* =========================================================
   UBAH STATUS
========================================================= */

function ubahStatus(id, status) {

  statusPresensi[id] =
    status;


  updateSummary();

}


/* =========================================================
   HADIR SEMUA
========================================================= */

function hadirSemua() {

  daftarSiswa.forEach(function (siswa) {

    statusPresensi[
      String(siswa.ID)
    ] = "HADIR";

  });


  renderTabelSiswa();

  updateSummary();

}


/* =========================================================
   RESET
========================================================= */

function resetPresensi() {

  daftarSiswa.forEach(function (siswa) {

    statusPresensi[
      String(siswa.ID)
    ] = "HADIR";

  });


  renderTabelSiswa();

  updateSummary();

}


/* =========================================================
   SUMMARY
========================================================= */

function updateSummary() {

  let hadir = 0;
  let izin = 0;
  let sakit = 0;
  let alpa = 0;


  Object.values(statusPresensi)
    .forEach(function (status) {

      if (status === "HADIR") hadir++;

      if (status === "IZIN") izin++;

      if (status === "SAKIT") sakit++;

      if (status === "ALPA") alpa++;

    });


  const total =
    daftarSiswa.length;


  setText(
    "totalCount",
    total
  );

  setText(
    "hadirCount",
    hadir
  );

  setText(
    "izinCount",
    izin
  );

  setText(
    "sakitCount",
    sakit
  );

  setText(
    "alpaCount",
    alpa
  );

}


/* =========================================================
   SIMPAN PRESENSI
========================================================= */

async function simpanPresensi() {

  if (daftarSiswa.length === 0) {

    tampilkanPesan(
      "Belum ada siswa yang ditampilkan.",
      "error"
    );

    return;

  }


  const tanggal =
    document.getElementById(
      "tanggal"
    ).value;


  const namaKelas =
    document.getElementById(
      "kelas"
    ).value;


  if (!tanggal) {

    tampilkanPesan(
      "Tanggal belum dipilih.",
      "error"
    );

    return;

  }


  if (!namaKelas) {

    tampilkanPesan(
      "Kelas belum dipilih.",
      "error"
    );

    return;

  }


  const button =
    document.getElementById(
      "simpanButton"
    );


  button.disabled = true;

  button.textContent =
    "⏳ Menyimpan...";


  try {

    let berhasil = 0;
    let gagal = 0;


    for (const siswa of daftarSiswa) {

      const status =
        statusPresensi[
          String(siswa.ID)
        ] || "HADIR";


      const result =
        await callAPI({

          action: "simpanPresensi",

          id: siswa.ID,

          nisn: siswa.NISN,

          nama: siswa.NAMA,

          kelas: siswa.KELAS,

          status: status,

          idGuru: idGuru,

          sumber: "WEB"

        });


      if (result.success) {

        berhasil++;

      } else {

        gagal++;

        console.warn(
          "Presensi gagal:",
          siswa.NAMA,
          result.message
        );

      }

    }


    if (gagal === 0) {

      tampilkanPesan(
        "✓ Presensi berhasil disimpan untuk " +
        berhasil +
        " siswa.",
        "success"
      );

    } else {

      tampilkanPesan(
        "Presensi selesai. Berhasil: " +
        berhasil +
        ", gagal: " +
        gagal +
        ".",
        "error"
      );

    }


  } catch (error) {

    console.error(
      "Gagal menyimpan:",
      error
    );


    tampilkanPesan(
      "Gagal menyimpan presensi: " +
      error.message,
      "error"
    );


  } finally {

    button.disabled = false;

    button.textContent =
      "💾 Simpan Presensi";

  }

}


/* =========================================================
   MESSAGE
========================================================= */

function tampilkanPesan(
  text,
  type
) {

  const element =
    document.getElementById(
      "message"
    );


  if (!element) return;


  element.className =
    "message " + type;


  element.innerHTML =
    text;


  element.style.display =
    "block";


  setTimeout(function () {

    element.style.display =
      "none";

  }, 5000);

}


/* =========================================================
   HELPER
========================================================= */

function setText(id, value) {

  const element =
    document.getElementById(id);

  if (element) {

    element.textContent =
      value;

  }

}


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


function escapeJS(value) {

  return String(
    value ?? ""
  )
    .replace(
      /\\/g,
      "\\\\"
    )
    .replace(
      /'/g,
      "\\'"
    );

}
