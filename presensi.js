const API_URL =
  "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";


let user = null;
let kelasData = [];
let siswaData = [];
let presensiData = {};


// =====================================================
// AMBIL USER YANG LOGIN
// =====================================================

function getUser() {

  try {

    return JSON.parse(
      localStorage.getItem("presensiUser") || "null"
    );

  } catch (error) {

    return null;

  }

}


// =====================================================
// CEK LOGIN GURU
// =====================================================

function ensureGuru() {

  user = getUser();

  if (!user) {

    alert("Silakan login terlebih dahulu.");

    location.href = "index.html";

    return false;

  }


  if (user.role !== "GURU") {

    alert("Halaman ini hanya dapat diakses oleh GURU.");

    location.href = "index.html";

    return false;

  }


  return true;

}


// =====================================================
// PANGGIL API GOOGLE APPS SCRIPT
// =====================================================

async function callAPI(payload) {

  const response = await fetch(
    API_URL,
    {
      method: "POST",

      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },

      body: JSON.stringify(payload)
    }
  );


  const text = await response.text();


  let result;

  try {

    result = JSON.parse(text);

  } catch (error) {

    throw new Error(
      "Respons API bukan JSON: " +
      text.substring(0, 300)
    );

  }


  return result;

}


// =====================================================
// TAMPILKAN INFORMASI GURU
// =====================================================

function renderGuruInfo() {

  const guruInfo =
    document.getElementById("guruInfo");


  if (!guruInfo) return;


  const nama =
    user.nama ||
    user.NAMA ||
    user.name ||
    "Guru";


  const idGuru =
    user.idGuru ||
    user.ID_GURU ||
    "-";


  const nip =
    user.nip ||
    user.NIP ||
    "";


  guruInfo.innerHTML = `
    <strong>${escapeHtml(nama)}</strong>
    <br>
    ID Guru: ${escapeHtml(idGuru)}
    ${nip ? ` | NIP: ${escapeHtml(nip)}` : ""}
  `;

}


// =====================================================
// TANGGAL HARI INI
// =====================================================

function setTanggalHariIni() {

  const tanggal =
    document.getElementById("tanggal");


  if (!tanggal) return;


  const now = new Date();


  const year =
    now.getFullYear();


  const month =
    String(now.getMonth() + 1)
      .padStart(2, "0");


  const day =
    String(now.getDate())
      .padStart(2, "0");


  tanggal.value =
    `${year}-${month}-${day}`;

}


// =====================================================
// LOAD KELAS GURU
// =====================================================

async function loadKelasGuru() {

  const kelasSelect =
    document.getElementById("kelasSelect");


  kelasSelect.innerHTML = `
    <option value="">
      Memuat kelas...
    </option>
  `;


  try {

    const idGuru =
      user.idGuru ||
      user.ID_GURU ||
      user.id ||
      user.ID;


    if (!idGuru) {

      throw new Error(
        "ID Guru tidak ditemukan pada data login."
      );

    }


    const result =
      await callAPI({

        action: "getKelasGuru",

        idGuru: idGuru

      });


    console.log(
      "Data kelas guru:",
      result
    );


    if (!result.success) {

      throw new Error(
        result.message ||
        "Gagal mengambil data kelas."
      );

    }


    kelasData =
      result.data || [];


    kelasSelect.innerHTML = `
      <option value="">
        -- Pilih Kelas --
      </option>
    `;


    if (!kelasData.length) {

      kelasSelect.innerHTML = `
        <option value="">
          Tidak ada kelas
        </option>
      `;

      showMessage(
        "Guru ini belum memiliki kelas.",
        "warning"
      );

      return;

    }


    kelasData.forEach(kelas => {

      const option =
        document.createElement("option");


      const idKelas =
        kelas.ID_KELAS ||
        kelas.idKelas ||
        kelas.ID ||
        "";


      const namaKelas =
        kelas.NAMA_KELAS ||
        kelas.namaKelas ||
        kelas.KELAS ||
        "";


      option.value =
        idKelas;


      option.textContent =
        namaKelas;


      /*
       * Simpan nama kelas pada dataset
       * supaya mudah digunakan nanti.
       */

      option.dataset.namaKelas =
        namaKelas;


      kelasSelect.appendChild(option);

    });


  } catch (error) {

    console.error(
      "LOAD KELAS ERROR:",
      error
    );


    kelasSelect.innerHTML = `
      <option value="">
        Gagal memuat kelas
      </option>
    `;


    showMessage(
      "Gagal memuat kelas: " +
      error.message,
      "error"
    );

  }

}


// =====================================================
// LOAD SISWA BERDASARKAN KELAS
// =====================================================

async function loadSiswa() {

  const kelasSelect =
    document.getElementById("kelasSelect");


  const selectedOption =
    kelasSelect.options[
      kelasSelect.selectedIndex
    ];


  const idKelas =
    kelasSelect.value;


  const namaKelas =
    selectedOption
      ? selectedOption.dataset.namaKelas ||
        selectedOption.textContent
      : "";


  if (!idKelas) {

    siswaData = [];

    presensiData = {};

    renderSiswa();

    return;

  }


  showMessage(
    "Memuat daftar siswa...",
    "info"
  );


  try {

    /*
     * Ambil seluruh data siswa.
     * Kemudian filter berdasarkan kelas.
     */

    const result =
      await callAPI({

        action: "getSiswa"

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


    const semuaSiswa =
      result.data || [];


    siswaData =
      semuaSiswa.filter(siswa => {

        const kelasSiswa =
          String(
            siswa.KELAS ||
            siswa.kelas ||
            ""
          )
          .trim()
          .toUpperCase();


        return (
          kelasSiswa ===
          String(namaKelas)
            .trim()
            .toUpperCase()
        );

      });


    /*
     * Urutkan berdasarkan nama.
     */

    siswaData.sort((a, b) => {

      const namaA =
        String(a.NAMA || "")
          .toLowerCase();

      const namaB =
        String(b.NAMA || "")
          .toLowerCase();

      return namaA.localeCompare(namaB);

    });


    /*
     * Default semua siswa = HADIR
     */

    presensiData = {};


    siswaData.forEach(siswa => {

      const idSiswa =
        String(
          siswa.ID ||
          siswa.ID_SISWA ||
          siswa.id ||
          ""
        ).trim();


      if (idSiswa) {

        presensiData[idSiswa] =
          "HADIR";

      }

    });


    renderSiswa();

    hideMessage();


  } catch (error) {

    console.error(
      "LOAD SISWA ERROR:",
      error
    );


    siswaData = [];

    presensiData = {};

    renderSiswa();


    showMessage(
      "Gagal memuat siswa: " +
      error.message,
      "error"
    );

  }

}


// =====================================================
// RENDER TABEL SISWA
// =====================================================

function renderSiswa() {

  const tbody =
    document.getElementById("siswaTable");


  const summary =
    document.getElementById("summary");


  if (!tbody) return;


  if (!siswaData.length) {

    tbody.innerHTML = `
      <tr>
        <td
          colspan="5"
          class="loading">

          Tidak ada siswa pada kelas ini.

        </td>
      </tr>
    `;


    if (summary) {

      summary.style.display =
        "none";

    }


    return;

  }


  tbody.innerHTML =
    siswaData.map((siswa, index) => {

      const idSiswa =
        String(
          siswa.ID ||
          siswa.ID_SISWA ||
          siswa.id ||
          ""
        ).trim();


      const nisn =
        siswa.NISN ||
        "";


      const nama =
        siswa.NAMA ||
        "";


      const kelas =
        siswa.KELAS ||
        "";


      const status =
        presensiData[idSiswa] ||
        "HADIR";


      return `

        <tr>

          <td>
            ${index + 1}
          </td>

          <td>
            ${escapeHtml(nisn)}
          </td>

          <td>
            <strong>
              ${escapeHtml(nama)}
            </strong>
          </td>

          <td>
            ${escapeHtml(kelas)}
          </td>

          <td>

            <select
              class="status-presensi"
              data-id-siswa="${escapeAttr(idSiswa)}"
              onchange="changeStatus(this)"
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

        </tr>

      `;

    }).join("");


  if (summary) {

    summary.style.display =
      "flex";

  }


  updateSummary();

}


// =====================================================
// UBAH STATUS SISWA
// =====================================================

function changeStatus(select) {

  const idSiswa =
    select.dataset.idSiswa;


  const status =
    select.value;


  presensiData[idSiswa] =
    status;


  updateSummary();

}


// =====================================================
// HADIR SEMUA
// =====================================================

function hadirSemua() {

  siswaData.forEach(siswa => {

    const idSiswa =
      String(
        siswa.ID ||
        siswa.ID_SISWA ||
        siswa.id ||
        ""
      ).trim();


    if (idSiswa) {

      presensiData[idSiswa] =
        "HADIR";

    }

  });


  renderSiswa();

}


// =====================================================
// RESET
// =====================================================

function resetPresensi() {

  if (!siswaData.length) {

    return;

  }


  const yakin =
    confirm(
      "Reset semua status presensi menjadi HADIR?"
    );


  if (!yakin) return;


  hadirSemua();

}


// =====================================================
// UPDATE RINGKASAN
// =====================================================

function updateSummary() {

  let hadir = 0;
  let izin = 0;
  let sakit = 0;
  let alpa = 0;


  Object.values(
    presensiData
  ).forEach(status => {

    switch (
      String(status).toUpperCase()
    ) {

      case "HADIR":
        hadir++;
        break;

      case "IZIN":
        izin++;
        break;

      case "SAKIT":
        sakit++;
        break;

      case "ALPA":
        alpa++;
        break;

    }

  });


  const total =
    siswaData.length;


  setText(
    "totalSiswa",
    total
  );

  setText(
    "totalHadir",
    hadir
  );

  setText(
    "totalIzin",
    izin
  );

  setText(
    "totalSakit",
    sakit
  );

  setText(
    "totalAlpa",
    alpa
  );

}


// =====================================================
// SIMPAN PRESENSI
// =====================================================

async function simpanPresensi() {

  const tanggal =
    document.getElementById(
      "tanggal"
    ).value;


  const kelasSelect =
    document.getElementById(
      "kelasSelect"
    );


  const idKelas =
    kelasSelect.value;


  const selectedOption =
    kelasSelect.options[
      kelasSelect.selectedIndex
    ];


  const namaKelas =
    selectedOption
      ? selectedOption.dataset.namaKelas ||
        selectedOption.textContent
      : "";


  const idGuru =
    user.idGuru ||
    user.ID_GURU ||
    user.id ||
    user.ID;


  if (!tanggal) {

    alert(
      "Tanggal presensi harus dipilih."
    );

    return;

  }


  if (!idKelas) {

    alert(
      "Silakan pilih kelas terlebih dahulu."
    );

    return;

  }


  if (!siswaData.length) {

    alert(
      "Tidak ada siswa untuk disimpan."
    );

    return;

  }


  if (!idGuru) {

    alert(
      "ID Guru tidak ditemukan."
    );

    return;

  }


  const simpanButton =
    document.getElementById(
      "simpanButton"
    );


  const oldText =
    simpanButton.textContent;


  simpanButton.disabled =
    true;


  simpanButton.textContent =
    "MENYIMPAN...";


  try {

    /*
     * Bentuk data presensi.
     */

    const dataPresensi =
      siswaData.map(siswa => {

        const idSiswa =
          String(
            siswa.ID ||
            siswa.ID_SISWA ||
            siswa.id ||
            ""
          ).trim();


        return {

          ID_SISWA: idSiswa,

          NISN:
            siswa.NISN || "",

          NAMA:
            siswa.NAMA || "",

          KELAS:
            namaKelas,

          ID_GURU:
            idGuru,

          STATUS:
            presensiData[idSiswa] ||
            "HADIR"

        };

      });


    console.log(
      "Data yang dikirim:",
      {
        action: "simpanPresensi",
        tanggal: tanggal,
        idGuru: idGuru,
        idKelas: idKelas,
        namaKelas: namaKelas,
        data: dataPresensi
      }
    );


    /*
     * Kirim ke Apps Script.
     */

    const result =
      await callAPI({

        action: "simpanPresensi",

        tanggal: tanggal,

        idGuru: idGuru,

        idKelas: idKelas,

        namaKelas: namaKelas,

        data: dataPresensi

      });


    console.log(
      "Hasil simpan:",
      result
    );


    if (!result.success) {

      throw new Error(
        result.message ||
        "Presensi gagal disimpan."
      );

    }


    alert(
      result.message ||
      "Presensi berhasil disimpan."
    );


    showMessage(
      "Presensi berhasil disimpan.",
      "success"
    );


  } catch (error) {

    console.error(
      "SIMPAN PRESENSI ERROR:",
      error
    );


    alert(
      "Gagal menyimpan presensi: " +
      error.message
    );


    showMessage(
      "Gagal menyimpan presensi: " +
      error.message,
      "error"
    );

  } finally {

    simpanButton.disabled =
      false;


    simpanButton.textContent =
      oldText;

  }

}


// =====================================================
// PESAN
// =====================================================

function showMessage(
  message,
  type = "info"
) {

  const element =
    document.getElementById(
      "statusMessage"
    );


  if (!element) return;


  element.textContent =
    message;


  element.style.display =
    "block";


  element.className =
    "message " + type;

}


function hideMessage() {

  const element =
    document.getElementById(
      "statusMessage"
    );


  if (!element) return;


  element.style.display =
    "none";

}


// =====================================================
// HELPER TEXT
// =====================================================

function setText(
  id,
  value
) {

  const element =
    document.getElementById(id);


  if (element) {

    element.textContent =
      value;

  }

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {

  return String(
    value ?? ""
  ).replace(
    /[&<>"']/g,
    character => {

      return {

        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"

      }[character];

    }
  );

}


function escapeAttr(value) {

  return escapeHtml(value);

}


// =====================================================
// EVENT: PILIH KELAS
// =====================================================

document
  .getElementById("kelasSelect")
  .addEventListener(
    "change",
    loadSiswa
  );


// =====================================================
// EVENT: HADIR SEMUA
// =====================================================

document
  .getElementById("hadirSemuaButton")
  .addEventListener(
    "click",
    hadirSemua
  );


// =====================================================
// EVENT: RESET
// =====================================================

document
  .getElementById("resetButton")
  .addEventListener(
    "click",
    resetPresensi
  );


// =====================================================
// EVENT: SIMPAN
// =====================================================

document
  .getElementById("simpanButton")
  .addEventListener(
    "click",
    simpanPresensi
  );


// =====================================================
// EVENT: REFRESH
// =====================================================

document
  .getElementById("refreshButton")
  .addEventListener(
    "click",
    async function () {

      try {

        await loadKelasGuru();

        const kelasSelect =
          document.getElementById(
            "kelasSelect"
          );


        if (kelasSelect.value) {

          await loadSiswa();

        }

      } catch (error) {

        alert(
          "Gagal refresh: " +
          error.message
        );

      }

    }
  );


// =====================================================
// EVENT: LOGOUT
// =====================================================

document
  .getElementById("logoutButton")
  .addEventListener(
    "click",
    function () {

      localStorage.removeItem(
        "presensiUser"
      );

      location.href =
        "index.html";

    }
  );


// =====================================================
// MULAI APLIKASI
// =====================================================

async function init() {

  if (!ensureGuru()) {

    return;

  }


  renderGuruInfo();

  setTanggalHariIni();


  try {

    await loadKelasGuru();

  } catch (error) {

    console.error(
      "INIT ERROR:",
      error
    );

  }

}


init();
