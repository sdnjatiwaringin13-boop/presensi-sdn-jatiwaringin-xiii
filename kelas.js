const API_URL =
  "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";

let semuaKelas = [];
let semuaGuru = [];


// ==========================================
// CEK LOGIN ADMIN
// ==========================================

const userData = localStorage.getItem("presensiUser");

if (!userData) {
  window.location.href = "index.html";
}

let user;

try {
  user = JSON.parse(userData);
} catch (error) {
  localStorage.removeItem("presensiUser");
  window.location.href = "index.html";
}

if (!user || user.role !== "ADMIN") {
  alert("Halaman ini hanya dapat diakses oleh ADMIN.");
  window.location.href = "index.html";
}


// ==========================================
// TAMPILKAN NAMA ADMIN
// ==========================================

document.getElementById("adminName").textContent =
  `Login sebagai: ${user.nama || user.username || "ADMIN"}`;


// ==========================================
// CALL API
// ==========================================

async function callAPI(action, data = {}) {

  const response = await fetch(API_URL, {
    method: "POST",

    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },

    body: JSON.stringify({
      action,
      ...data
    })
  });

  const text = await response.text();

  let result;

  try {
    result = JSON.parse(text);
  } catch (error) {

    console.error("Response bukan JSON:", text);

    throw new Error(
      "Server mengembalikan response yang tidak valid."
    );
  }

  if (!result.success) {
    throw new Error(
      result.message || "Terjadi kesalahan."
    );
  }

  return result;
}


// ==========================================
// LOAD GURU
// ==========================================

async function loadGuru() {

  const select = document.getElementById("idGuru");

  select.innerHTML =
    `<option value="">Memuat guru...</option>`;

  try {

    const result = await callAPI("getGuru");

    console.log("HASIL getGuru:", result);

    semuaGuru = result.data || [];

    console.log("DATA GURU:", semuaGuru);

    select.innerHTML =
      `<option value="">-- Pilih Wali Kelas --</option>`;

    if (semuaGuru.length === 0) {

      select.innerHTML =
        `<option value="">Belum ada data guru</option>`;

      return;
    }

    semuaGuru.forEach(guru => {

      const idGuru =
        String(guru.ID_GURU || "").trim();

      const namaGuru =
        String(guru.NAMA || "").trim();

      const option =
        document.createElement("option");

      option.value = idGuru;

      option.textContent =
        `${namaGuru} (${idGuru})`;

      select.appendChild(option);

    });

  } catch (error) {

    console.error(
      "ERROR LOAD GURU:",
      error
    );

    select.innerHTML =
      `<option value="">Gagal memuat guru</option>`;
  }
}


// ==========================================
// LOAD KELAS
// ==========================================

async function loadKelas() {

  const tbody =
    document.getElementById("kelasTable");

  tbody.innerHTML = `
    <tr>
      <td colspan="7" class="loading">
        Memuat data...
      </td>
    </tr>
  `;

  try {

    const result =
      await callAPI("getKelas");

    semuaKelas =
      result.data || [];

    renderKelas(semuaKelas);

  } catch (error) {

    console.error(error);

    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          Gagal memuat data kelas.
        </td>
      </tr>
    `;

  }
}


// ==========================================
// NAMA GURU
// ==========================================

function getNamaGuru(idGuru) {

  const id =
    String(idGuru || "")
      .trim()
      .toUpperCase();

  const guru =
    semuaGuru.find(item => {

      const idGuruData =
        String(item.ID_GURU || "")
          .trim()
          .toUpperCase();

      return idGuruData === id;
    });

  if (guru) {
    return guru.NAMA || guru.ID_GURU;
  }

  return idGuru || "-";
}


// ==========================================
// RENDER KELAS
// ==========================================

function renderKelas(data) {

  const tbody =
    document.getElementById("kelasTable");

  if (!data.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          Belum ada data kelas.
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML = "";

  data.forEach((kelas, index) => {

    const tr =
      document.createElement("tr");

    tr.innerHTML = `

      <td>${index + 1}</td>

      <td>${escapeHtml(kelas.ID_KELAS)}</td>

      <td>${escapeHtml(kelas.NAMA_KELAS)}</td>

      <td>
        ${escapeHtml(
          getNamaGuru(kelas.ID_GURU)
        )}
      </td>

      <td>
        ${escapeHtml(kelas.TAHUN_AJARAN)}
      </td>

      <td>
        ${escapeHtml(kelas.STATUS)}
      </td>

      <td>

        <button
          type="button"
          onclick="editKelas('${escapeAttr(kelas.ID_KELAS)}')">
          Edit
        </button>

        <button
          type="button"
          onclick="hapusKelas('${escapeAttr(kelas.ID_KELAS)}')">
          Hapus
        </button>

      </td>

    `;

    tbody.appendChild(tr);

  });
}


// ==========================================
// TAMBAH / EDIT KELAS
// ==========================================

document
  .getElementById("kelasForm")
  .addEventListener("submit", async function(event) {

    event.preventDefault();

    const mode =
      document.getElementById("mode").value;

    const idKelas =
      document.getElementById("idKelas").value.trim();

    const namaKelas =
      document.getElementById("namaKelas").value.trim();

    const idGuru =
      document.getElementById("idGuru").value;

    const tahunAjaran =
      document.getElementById("tahunAjaran").value.trim();

    const status =
      document.getElementById("status").value;

    const message =
      document.getElementById("formMessage");

    const saveButton =
      document.getElementById("saveButton");

    message.textContent = "";

    if (
      !idKelas ||
      !namaKelas ||
      !idGuru ||
      !tahunAjaran
    ) {

      message.textContent =
        "Semua data wajib diisi.";

      return;
    }

    saveButton.disabled = true;
    saveButton.textContent = "Menyimpan...";

    try {

      let result;

      if (mode === "tambah") {

        result = await callAPI(
          "tambahKelas",
          {
            ID_KELAS: idKelas,
            NAMA_KELAS: namaKelas,
            ID_GURU: idGuru,
            TAHUN_AJARAN: tahunAjaran,
            STATUS: status
          }
        );

      } else {

        result = await callAPI(
          "updateKelas",
          {
            ID_KELAS: idKelas,
            NAMA_KELAS: namaKelas,
            ID_GURU: idGuru,
            TAHUN_AJARAN: tahunAjaran,
            STATUS: status
          }
        );

      }

      message.textContent =
        result.message || "Data berhasil disimpan.";

      resetForm();

      await loadKelas();

    } catch (error) {

      console.error(error);

      message.textContent =
        error.message;

    } finally {

      saveButton.disabled = false;
      saveButton.textContent = "Simpan";

    }

  });


// ==========================================
// EDIT KELAS
// ==========================================

function editKelas(idKelas) {

  const kelas =
    semuaKelas.find(
      item =>
        String(item.ID_KELAS) === String(idKelas)
    );

  if (!kelas) {

    alert("Data kelas tidak ditemukan.");

    return;
  }

  document.getElementById("mode").value =
    "edit";

  document.getElementById("formTitle").textContent =
    "Edit Kelas";

  document.getElementById("idKelas").value =
    kelas.ID_KELAS;

  document.getElementById("idKelas").disabled =
    true;

  document.getElementById("namaKelas").value =
    kelas.NAMA_KELAS || "";

  document.getElementById("idGuru").value =
    kelas.ID_GURU || "";

  document.getElementById("tahunAjaran").value =
    kelas.TAHUN_AJARAN || "";

  document.getElementById("status").value =
    kelas.STATUS || "AKTIF";

  document.getElementById("formMessage").textContent =
    "";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


// ==========================================
// HAPUS KELAS
// ==========================================

async function hapusKelas(idKelas) {

  const kelas =
    semuaKelas.find(
      item =>
        String(item.ID_KELAS) === String(idKelas)
    );

  if (!kelas) {
    alert("Data kelas tidak ditemukan.");
    return;
  }

  const yakin =
    confirm(
      `Hapus kelas "${kelas.NAMA_KELAS}"?`
    );

  if (!yakin) return;

  try {

    const result =
      await callAPI(
        "hapusKelas",
        {
          ID_KELAS: idKelas
        }
      );

    alert(
      result.message ||
      "Data kelas berhasil dihapus."
    );

    await loadKelas();

  } catch (error) {

    console.error(error);

    alert(
      error.message ||
      "Gagal menghapus kelas."
    );

  }
}


// ==========================================
// RESET FORM
// ==========================================

function resetForm() {

  document.getElementById("kelasForm").reset();

  document.getElementById("mode").value =
    "tambah";

  document.getElementById("formTitle").textContent =
    "Tambah Kelas";

  document.getElementById("idKelas").disabled =
    false;

  document.getElementById("formMessage").textContent =
    "";

}


// ==========================================
// BATAL
// ==========================================

document
  .getElementById("cancelButton")
  .addEventListener(
    "click",
    resetForm
  );


// ==========================================
// SEARCH
// ==========================================

document
  .getElementById("searchInput")
  .addEventListener(
    "input",
    function() {

      const keyword =
        this.value
          .toLowerCase()
          .trim();

      if (!keyword) {

        renderKelas(semuaKelas);

        return;
      }

      const hasil =
        semuaKelas.filter(kelas => {

          const namaGuru =
            getNamaGuru(kelas.ID_GURU);

          return (

            String(kelas.ID_KELAS)
              .toLowerCase()
              .includes(keyword)

            ||

            String(kelas.NAMA_KELAS)
              .toLowerCase()
              .includes(keyword)

            ||

            String(namaGuru)
              .toLowerCase()
              .includes(keyword)

            ||

            String(kelas.TAHUN_AJARAN)
              .toLowerCase()
              .includes(keyword)

          );

        });

      renderKelas(hasil);

    }
  );


// ==========================================
// REFRESH
// ==========================================

document
  .getElementById("refreshButton")
  .addEventListener(
    "click",
    async function() {

      await loadGuru();
      await loadKelas();

    }
  );


// ==========================================
// LOGOUT
// ==========================================

document
  .getElementById("logoutButton")
  .addEventListener(
    "click",
    function() {

      localStorage.removeItem(
        "presensiUser"
      );

      window.location.href =
        "index.html";

    }
  );


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHtml(value) {

  if (value === null ||
      value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function escapeAttr(value) {

  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'");

}


// ==========================================
// START
// ==========================================

document.addEventListener(
  "DOMContentLoaded",
  async function() {

    await loadGuru();

    await loadKelas();

  }
);
