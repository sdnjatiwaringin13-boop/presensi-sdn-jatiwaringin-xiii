const API_URL =
  "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";


let currentUser = null;
let siswaList = [];
let kelasList = [];


/* =====================================================
   API
===================================================== */

async function callAPI(payload) {

  console.log("API REQUEST:", payload);

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(payload)
  });


  const text = await response.text();

  console.log("API RESPONSE:", text);


  if (!text) {

    throw new Error(
      "Server tidak mengirim response."
    );

  }


  let result;

  try {

    result = JSON.parse(text);

  } catch (error) {

    console.error(
      "RESPONSE BUKAN JSON:",
      text
    );

    throw new Error(
      "Server mengirim response yang bukan JSON."
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

    try {

      await initPresensi();

    } catch (error) {

      console.error(
        "INIT ERROR:",
        error
      );

      showMessage(
        "Gagal memuat halaman: " +
        error.message,
        "error"
      );

    }

  }
);


/* =====================================================
   INIT PRESENSI
===================================================== */

async function initPresensi() {

  const savedUser =
    localStorage.getItem(
      "presensiUser"
    );


  /* -----------------------------------------------------
     CEK LOGIN
  ----------------------------------------------------- */

  if (!savedUser) {

    window.location.href =
      "index.html";

    return;

  }


  /* -----------------------------------------------------
     BACA USER
  ----------------------------------------------------- */

  try {

    currentUser =
      JSON.parse(savedUser);

  } catch (error) {

    console.error(
      "DATA USER RUSAK:",
      error
    );

    localStorage.removeItem(
      "presensiUser"
    );

    window.location.href =
      "index.html";

    return;

  }


  console.log(
    "CURRENT USER:",
    currentUser
  );


  /* -----------------------------------------------------
     VALIDASI ROLE
  ----------------------------------------------------- */

  const role =
    String(
      currentUser.role || ""
    )
      .trim()
      .toUpperCase();


  if (role !== "GURU") {

    alert(
      "Halaman ini hanya untuk akun GURU."
    );

    window.location.href =
      "index.html";

    return;

  }


  /* -----------------------------------------------------
     VALIDASI ID GURU
  ----------------------------------------------------- */

  if (!currentUser.idGuru) {

    showMessage(
      "ID Guru tidak ditemukan pada akun login.",
      "error"
    );

    console.error(
      "USER TANPA ID GURU:",
      currentUser
    );

    return;

  }


  /* -----------------------------------------------------
     TAMPILKAN INFORMASI GURU
  ----------------------------------------------------- */

  tampilkanInfoGuru();


  /* -----------------------------------------------------
     SET TANGGAL
  ----------------------------------------------------- */

  setTanggalHariIni();


  /* -----------------------------------------------------
     PASANG EVENT
  ----------------------------------------------------- */

  pasangEvent();


  /* -----------------------------------------------------
     LOAD KELAS GURU
  ----------------------------------------------------- */

  await loadKelasGuru();

}


/* =====================================================
   TAMPILKAN INFORMASI GURU
===================================================== */

function tampilkanInfoGuru() {

  const guruInfo =
    document.getElementById(
      "guruInfo"
    );


  if (!guruInfo) {
    return;
  }


  const nama =
    currentUser.nama ||
    currentUser.namaGuru ||
    currentUser.namaGuruKelas ||
    currentUser.username ||
    "Guru";


  const idGuru =
    currentUser.idGuru ||
    "-";


  guruInfo.innerHTML = `
    <strong>
      ${escapeHTML(nama)}
    </strong>
    <br>
    ID Guru:
    ${escapeHTML(idGuru)}
  `;

}


/* =====================================================
   SET TANGGAL HARI INI
===================================================== */

function setTanggalHariIni() {

  const input =
    document.getElementById(
      "tanggal"
    );


  if (!input) {
    return;
  }


  const now =
    new Date();


  const year =
    now.getFullYear();


  const month =
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    );


  input.value =
    `${year}-${month}-${day}`;

}


/* =====================================================
   EVENT
===================================================== */

function pasangEvent() {

  const loadButton =
    document.getElementById(
      "loadButton"
    );


  const hadirSemuaButton =
    document.getElementById(
      "hadirSemuaButton"
    );


  const resetButton =
    document.getElementById(
      "resetButton"
    );


  const simpanButton =
    document.getElementById(
      "simpanButton"
    );


  if (loadButton) {

    loadButton.addEventListener(
      "click",
      loadSiswa
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
      simpanSemuaPresensi
    );

  }

}


/* =====================================================
   LOAD KELAS GURU
===================================================== */

async function loadKelasGuru() {

  const select =
    document.getElementById(
      "kelas"
    );


  if (!select) {
    return;
  }


  select.innerHTML = `
    <option value="">
      ⏳ Memuat kelas...
    </option>
  `;


  try {

    const result =
      await callAPI({

        action:
          "getKelasGuru",

        idGuru:
          currentUser.idGuru

      });


    console.log(
      "HASIL KELAS GURU:",
      result
    );


    if (!result.success) {

      throw new Error(
        result.message ||
        "Gagal mengambil kelas guru."
      );

    }


    kelasList =
      Array.isArray(result.data)
        ? result.data
        : [];


    select.innerHTML = `
      <option value="">
        Pilih Kelas
      </option>
    `;


    /* ---------------------------------------------------
       TIDAK ADA KELAS
    --------------------------------------------------- */

    if (
      kelasList.length === 0
    ) {

      select.innerHTML = `
        <option value="">
          Belum ada kelas
        </option>
      `;


      showMessage(
        "Belum ada kelas yang ditugaskan kepada guru ini.",
        "error"
      );


      return;

    }


    /* ---------------------------------------------------
       MASUKKAN KELAS KE SELECT
    --------------------------------------------------- */

    kelasList.forEach(
      function (kelas) {

        const namaKelas =
          kelas.NAMA_KELAS ||
          kelas.namaKelas ||
          "";


        if (!namaKelas) {
          return;
        }


        const option =
          document.createElement(
            "option"
          );


        option.value =
          namaKelas;


        option.textContent =
          namaKelas;


        select.appendChild(
          option
        );

      }
    );


    /* ---------------------------------------------------
       JIKA HANYA SATU KELAS
    --------------------------------------------------- */

    if (
      kelasList.length === 1
    ) {

      select.value =
        kelasList[0].NAMA_KELAS;


      await loadSiswa();

    }


  } catch (error) {

    console.error(
      "GAGAL LOAD KELAS:",
      error
    );


    select.innerHTML = `
      <option value="">
        Gagal memuat kelas
      </option>
    `;


    showMessage(
      "Gagal mengambil data kelas: " +
      error.message,
      "error"
    );

  }

}


/* =====================================================
   LOAD SISWA
===================================================== */

async function loadSiswa() {

  const kelasSelect =
    document.getElementById(
      "kelas"
    );


  const kelas =
    kelasSelect
      ? kelasSelect.value
      : "";


  if (!kelas) {

    showMessage(
      "Silakan pilih kelas terlebih dahulu.",
      "error"
    );

    return;

  }


  tampilkanLoading();


  try {

    const result =
      await callAPI({

        action:
          "getSiswa",

        kelas:
          kelas

      });


    console.log(
      "HASIL SISWA:",
      result
    );


    if (!result.success) {

      throw new Error(
        result.message ||
        "Gagal mengambil data siswa."
      );

    }


    siswaList =
      Array.isArray(result.data)
        ? result.data
        : [];


    /* ---------------------------------------------------
       HANYA SISWA AKTIF
    --------------------------------------------------- */

    siswaList =
      siswaList.filter(
        function (siswa) {

          return String(
            siswa.STATUS ||
            "AKTIF"
          )
            .trim()
            .toUpperCase()
            === "AKTIF";

        }
      );


    tampilkanSiswa();


    updateSummary();


    showMessage(
      siswaList.length +
      " siswa berhasil dimuat.",
      "success"
    );


  } catch (error) {

    console.error(
      "GAGAL LOAD SISWA:",
      error
    );


    tampilkanErrorTable(
      error.message
    );


    showMessage(
      "Gagal memuat siswa: " +
      error.message,
      "error"
    );

  }

}


/* =====================================================
   TAMPILKAN LOADING
===================================================== */

function tampilkanLoading() {

  const loading =
    document.getElementById(
      "tableLoading"
    );


  const table =
    document.getElementById(
      "presensiTable"
    );


  if (loading) {

    loading.style.display =
      "block";


    loading.innerHTML = `
      <div class="loading-spinner"></div>
      <div>
        Memuat data siswa...
      </div>
    `;

  }


  if (table) {

    table.style.display =
      "none";

  }

}


/* =====================================================
   TAMPILKAN SISWA
===================================================== */

function tampilkanSiswa() {

  const loading =
    document.getElementById(
      "tableLoading"
    );


  const table =
    document.getElementById(
      "presensiTable"
    );


  const body =
    document.getElementById(
      "presensiBody"
    );


  if (!body) {
    return;
  }


  body.innerHTML = "";


  /* ---------------------------------------------------
     TIDAK ADA SISWA
  --------------------------------------------------- */

  if (
    siswaList.length === 0
  ) {

    if (loading) {

      loading.style.display =
        "block";


      loading.innerHTML =
        "Tidak ada siswa pada kelas ini.";

    }


    if (table) {

      table.style.display =
        "none";

    }


    updateSummary();

    return;

  }


  /* ---------------------------------------------------
     TAMPILKAN SISWA
  --------------------------------------------------- */

  siswaList.forEach(
    function (siswa, index) {

      const tr =
        document.createElement(
          "tr"
        );


      tr.innerHTML = `

        <td>
          ${index + 1}
        </td>

        <td>
          ${escapeHTML(
            siswa.NISN
          )}
        </td>

        <td>
          <strong>
            ${escapeHTML(
              siswa.NAMA
            )}
          </strong>
        </td>

        <td>
          ${escapeHTML(
            siswa.KELAS
          )}
        </td>

        <td>
          ${escapeHTML(
            siswa.JK
          )}
        </td>

        <td>

          <select
            class="status-select"
            data-id="${escapeHTML(
              siswa.ID
            )}"
          >

            <option value="HADIR">
              HADIR
            </option>

            <option value="IZIN">
              IZIN
            </option>

            <option value="SAKIT">
              SAKIT
            </option>

            <option value="ALPA">
              ALPA
            </option>

          </select>

        </td>

      `;


      body.appendChild(
        tr
      );

    }
  );


  if (loading) {

    loading.style.display =
      "none";

  }


  if (table) {

    table.style.display =
      "table";

  }


  /* ---------------------------------------------------
     EVENT PERUBAHAN STATUS
  --------------------------------------------------- */

  const selects =
    document.querySelectorAll(
      ".status-select"
    );


  selects.forEach(
    function (select) {

      select.addEventListener(
        "change",
        updateSummary
      );

    }
  );


  updateSummary();

}


/* =====================================================
   HADIR SEMUA
===================================================== */

function hadirSemua() {

  const selects =
    document.querySelectorAll(
      ".status-select"
    );


  if (
    selects.length === 0
  ) {

    showMessage(
      "Belum ada siswa yang ditampilkan.",
      "error"
    );

    return;

  }


  selects.forEach(
    function (select) {

      select.value =
        "HADIR";

    }
  );


  updateSummary();


  showMessage(
    "Semua siswa diubah menjadi HADIR.",
    "success"
  );

}


/* =====================================================
   RESET
===================================================== */

function resetPresensi() {

  const selects =
    document.querySelectorAll(
      ".status-select"
    );


  if (
    selects.length === 0
  ) {

    showMessage(
      "Belum ada data presensi.",
      "error"
    );

    return;

  }


  selects.forEach(
    function (select) {

      select.value =
        "HADIR";

    }
  );


  updateSummary();


  showMessage(
    "Presensi berhasil di-reset.",
    "info"
  );

}


/* =====================================================
   UPDATE SUMMARY
===================================================== */

function updateSummary() {

  const selects =
    document.querySelectorAll(
      ".status-select"
    );


  let hadir = 0;
  let izin = 0;
  let sakit = 0;
  let alpa = 0;


  selects.forEach(
    function (select) {

      const status =
        String(
          select.value
        )
          .trim()
          .toUpperCase();


      switch (status) {

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

    }
  );


  setText(
    "totalCount",
    selects.length
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


/* =====================================================
   SIMPAN SEMUA PRESENSI
===================================================== */

async function simpanSemuaPresensi() {

  /* ---------------------------------------------------
     CEK SISWA
  --------------------------------------------------- */

  if (
    siswaList.length === 0
  ) {

    showMessage(
      "Tidak ada siswa untuk disimpan.",
      "error"
    );

    return;

  }


  /* ---------------------------------------------------
     AMBIL TANGGAL DAN KELAS
  --------------------------------------------------- */

  const tanggalInput =
    document.getElementById(
      "tanggal"
    );


  const kelasInput =
    document.getElementById(
      "kelas"
    );


  const tanggal =
    tanggalInput
      ? tanggalInput.value
      : "";


  const kelas =
    kelasInput
      ? kelasInput.value
      : "";


  if (!tanggal) {

    showMessage(
      "Tanggal belum dipilih.",
      "error"
    );

    return;

  }


  if (!kelas) {

    showMessage(
      "Kelas belum dipilih.",
      "error"
    );

    return;

  }


  /* ---------------------------------------------------
     CEK ID GURU
  --------------------------------------------------- */

  if (
    !currentUser ||
    !currentUser.idGuru
  ) {

    showMessage(
      "ID Guru tidak ditemukan.",
      "error"
    );

    return;

  }


  /* ---------------------------------------------------
     KONFIRMASI
  --------------------------------------------------- */

  const yakin =
    confirm(
      "Simpan presensi seluruh siswa kelas " +
      kelas +
      " tanggal " +
      tanggal +
      "?"
    );


  if (!yakin) {
    return;
  }


  /* ---------------------------------------------------
     BUTTON
  --------------------------------------------------- */

  const button =
    document.getElementById(
      "simpanButton"
    );


  if (button) {

    button.disabled =
      true;


    button.dataset.text =
      button.textContent;


    button.textContent =
      "⏳ Menyimpan...";

  }


  try {

    const selects =
      document.querySelectorAll(
        ".status-select"
      );


    let berhasil = 0;
    let gagal = 0;


    /* -------------------------------------------------
       SIMPAN SATU PER SATU
    ------------------------------------------------- */

    for (
      let i = 0;
      i < selects.length;
      i++
    ) {

      const select =
        selects[i];


      const id =
        select.dataset.id;


      const siswa =
        siswaList.find(
          function (item) {

            return String(
              item.ID
            ) === String(id);

          }
        );


      if (!siswa) {

        gagal++;

        continue;

      }


      try {

        const result =
          await callAPI({

            action:
              "simpanPresensi",

            id:
              siswa.ID,

            nisn:
              siswa.NISN,

            nama:
              siswa.NAMA,

            kelas:
              siswa.KELAS,

            status:
              select.value,

            idGuru:
              currentUser.idGuru,

            sumber:
              "WEB",

            tanggal:
              tanggal

          });


        console.log(
          "HASIL SIMPAN:",
          siswa.NAMA,
          result
        );


        if (
          result &&
          result.success
        ) {

          berhasil++;

        } else {

          gagal++;

          console.error(
            "GAGAL:",
            siswa.NAMA,
            result
          );

        }


      } catch (error) {

        gagal++;

        console.error(
          "ERROR SISWA:",
          siswa.NAMA,
          error
        );

      }

    }


    /* -------------------------------------------------
       HASIL
    ------------------------------------------------- */

    if (
      gagal === 0
    ) {

      showMessage(
        "Presensi berhasil disimpan untuk " +
        berhasil +
        " siswa.",
        "success"
      );

    } else {

      showMessage(
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
      "SIMPAN ERROR:",
      error
    );


    showMessage(
      "Gagal menyimpan presensi: " +
      error.message,
      "error"
    );


  } finally {

    if (button) {

      button.disabled =
        false;


      button.textContent =
        button.dataset.text ||
        "💾 Simpan Presensi";

    }

  }

}


/* =====================================================
   ERROR TABLE
===================================================== */

function tampilkanErrorTable(
  message
) {

  const loading =
    document.getElementById(
      "tableLoading"
    );


  const table =
    document.getElementById(
      "presensiTable"
    );


  if (table) {

    table.style.display =
      "none";

  }


  if (loading) {

    loading.style.display =
      "block";


    loading.innerHTML = `
      ❌ Gagal memuat data siswa.
      <br><br>
      ${escapeHTML(message)}
    `;

  }

}


/* =====================================================
   MESSAGE
===================================================== */

function showMessage(
  message,
  type = "info"
) {

  const element =
    document.getElementById(
      "message"
    );


  if (!element) {

    console.log(
      "[" +
      type +
      "] " +
      message
    );

    return;

  }


  element.className =
    "message " +
    type;


  element.textContent =
    message;


  setTimeout(
    function () {

      element.className =
        "message";


      element.textContent =
        "";

    },
    5000
  );

}


/* =====================================================
   SET TEXT
===================================================== */

function setText(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    );


  if (element) {

    element.textContent =
      value;

  }

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
