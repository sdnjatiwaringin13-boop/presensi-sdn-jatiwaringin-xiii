const API_URL =
  "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";


let semuaSiswa = [];

let scanner = null;

let sudahScan = false;


// ==========================================
// API
// ==========================================

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


  let result;

  try {

    result =
      JSON.parse(text);

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

  try {

    const result =
      await callAPI({
        action: "getSiswa"
      });


    semuaSiswa =
      result.data || [];


    mulaiScanner();

  } catch (error) {

    tampilkanError(
      "Gagal memuat data siswa: " +
      error.message
    );

  }

}


// ==========================================
// MULAI SCANNER
// ==========================================

function mulaiScanner() {

  scanner =
    new Html5Qrcode("reader");


  const config = {

    fps: 10,

    qrbox: {
      width: 250,
      height: 250
    }

  };


  scanner.start(

    {
      facingMode: "environment"
    },

    config,

    onScanSuccess,

    onScanError

  ).catch(error => {

    console.error(error);

    tampilkanError(
      "Kamera tidak dapat digunakan. " +
      "Pastikan izin kamera diberikan."
    );

  });

}


// ==========================================
// HASIL SCAN
// ==========================================

async function onScanSuccess(
  decodedText,
  decodedResult
) {

  if (sudahScan) {
    return;
  }


  sudahScan = true;


  console.log(
    "QR terbaca:",
    decodedText
  );


  const idSiswa =
    String(decodedText).trim();


  const siswa =
    semuaSiswa.find(s => {

      return String(s.ID).trim() ===
        idSiswa;

    });


  if (!siswa) {

    tampilkanError(
      "QR tidak terdaftar: " +
      idSiswa
    );


    setTimeout(() => {

      sudahScan = false;

    }, 2000);


    return;

  }


  tampilkanSiswa(siswa);


  // Berhenti sementara
  try {

    await scanner.stop();

  } catch (error) {

    console.log(error);

  }


}


// ==========================================
// TAMPILKAN SISWA
// ==========================================

function tampilkanSiswa(siswa) {

  const result =
    document.getElementById(
      "result"
    );


  result.className =
    "result-box success";


  result.innerHTML = `

    <div>
      ✓ QR BERHASIL DIBACA
    </div>

    <div class="student-name">
      ${escapeHTML(siswa.NAMA)}
    </div>

    <div>
      Kelas:
      <strong>
        ${escapeHTML(siswa.KELAS)}
      </strong>
    </div>

    <div>
      NISN:
      ${escapeHTML(siswa.NISN)}
    </div>

    <div class="student-id">
      ID: ${escapeHTML(siswa.ID)}
    </div>

    <button onclick="scanLagi()">
      📷 Scan Siswa Berikutnya
    </button>

  `;

}


// ==========================================
// SCAN LAGI
// ==========================================

async function scanLagi() {

  sudahScan = false;


  const result =
    document.getElementById(
      "result"
    );


  result.className =
    "result-box";


  result.innerHTML =
    "Menunggu QR Code...";


  try {

    await scanner.start(

      {
        facingMode:
          "environment"
      },

      {
        fps: 10,

        qrbox: {
          width: 250,
          height: 250
        }

      },

      onScanSuccess,

      onScanError

    );

  } catch (error) {

    console.error(error);

    tampilkanError(
      "Kamera gagal dimulai kembali."
    );

  }

}


// ==========================================
// ERROR
// ==========================================

function onScanError(errorMessage) {

  // Tidak perlu menampilkan error
  // setiap frame kamera.
}


// ==========================================
// TAMPILKAN ERROR
// ==========================================

function tampilkanError(message) {

  const result =
    document.getElementById(
      "result"
    );


  result.className =
    "result-box error";


  result.innerHTML = `
    ❌ ${escapeHTML(message)}
  `;

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

  if (scanner) {

    scanner.stop()
      .catch(() => {});

  }


  window.location.href =
    "presensi.html";

}


// ==========================================
// START
// ==========================================

loadSiswa();
