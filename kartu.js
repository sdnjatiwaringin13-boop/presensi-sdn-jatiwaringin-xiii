const API_URL =
  "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";


let semuaSiswa = [];


async function callAPI(payload) {

  const response = await fetch(API_URL, {

    method: "POST",

    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },

    body: JSON.stringify(payload)

  });


  const text =
    await response.text();


  let result;

  try {

    result = JSON.parse(text);

  } catch (error) {

    throw new Error(
      "Response server bukan JSON."
    );

  }


  if (!result.success) {

    throw new Error(
      result.message ||
      "Terjadi kesalahan."
    );

  }


  return result;

}


// ==========================================
// LOAD SISWA
// ==========================================

async function loadSiswa() {

  const status =
    document.getElementById("status");

  status.innerHTML =
    "⏳ Memuat data siswa...";


  try {

    const result =
      await callAPI({
        action: "getSiswa"
      });


    semuaSiswa =
      result.data || [];


    isiFilterKelas();

    renderCards();


    status.innerHTML =
      `✓ ${semuaSiswa.length} siswa berhasil dimuat.`;

  } catch (error) {

    console.error(error);

    status.innerHTML =
      "❌ Gagal memuat siswa: " +
      error.message;

  }

}


// ==========================================
// FILTER KELAS
// ==========================================

function isiFilterKelas() {

  const select =
    document.getElementById("kelasFilter");


  const kelasSet =
    new Set();


  semuaSiswa.forEach(siswa => {

    if (siswa.KELAS) {

      kelasSet.add(
        String(siswa.KELAS).trim()
      );

    }

  });


  const kelas =
    Array.from(kelasSet).sort();


  select.innerHTML =
    '<option value="">Semua Kelas</option>';


  kelas.forEach(namaKelas => {

    const option =
      document.createElement("option");

    option.value =
      namaKelas;

    option.textContent =
      namaKelas;

    select.appendChild(option);

  });

}


// ==========================================
// RENDER KARTU
// ==========================================

function renderCards() {

  const container =
    document.getElementById("cards");


  container.innerHTML = "";


  const filter =
    document.getElementById(
      "kelasFilter"
    ).value;


  const siswa =
    semuaSiswa.filter(s => {

      if (!filter) {
        return true;
      }

      return String(s.KELAS).trim() ===
        filter;

    });


  if (siswa.length === 0) {

    container.innerHTML =
      "<p>Tidak ada siswa.</p>";

    return;

  }


  siswa.forEach(s => {

    const card =
      document.createElement("div");

    card.className =
      "student-card";


    const qrId =
      "qr-" + s.ID;


    card.innerHTML = `

      <div class="school-name">
        SD NEGERI JATIWARINGIN XIII
      </div>

      <div class="school-subtitle">
        KARTU IDENTITAS SISWA
      </div>

      <div
        class="qr"
        id="${qrId}">
      </div>

      <div class="student-name">
        ${escapeHTML(s.NAMA)}
      </div>

      <div class="student-info">
        Kelas: ${escapeHTML(s.KELAS)}
      </div>

      <div class="student-info">
        NISN: ${escapeHTML(s.NISN)}
      </div>

      <div class="student-id">
        ${escapeHTML(s.ID)}
      </div>

    `;


    container.appendChild(card);


    // QR hanya berisi ID siswa
    new QRCode(
      document.getElementById(qrId),
      {
        text: String(s.ID),
        width: 150,
        height: 150,
        correctLevel:
          QRCode.CorrectLevel.H
      }
    );

  });

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


// ==========================================
// KEMBALI
// ==========================================

function kembali() {

  window.location.href =
    "admin.html";

}


// ==========================================
// EVENT
// ==========================================

document
  .getElementById("kelasFilter")
  .addEventListener(
    "change",
    renderCards
  );


loadSiswa();
