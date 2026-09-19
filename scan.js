const API_URL =
  "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";


let semuaSiswa = [];

let scanner = null;

let sedangMemproses = false;

let kameraAktif = false;


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


  return result;

}


// ==========================================
// VOICE
// ==========================================

function speak(text) {

  if (!("speechSynthesis" in window)) {
    return;
  }


  // Hentikan suara sebelumnya
  window.speechSynthesis.cancel();


  const voice =
    new SpeechSynthesisUtterance(text);


  voice.lang = "id-ID";

  voice.rate = 0.9;

  voice.pitch = 1;

  voice.volume = 1;


  window.speechSynthesis.speak(
    voice
  );

}


// ==========================================
// LOAD SISWA
// ==========================================

async function loadSiswa() {

  tampilkanStatus(
    "Memuat data siswa...",
    ""
  );


  try {

    const result =
      await callAPI({
        action: "getSiswa"
      });


    if (!result.success) {

      throw new Error(
        result.message ||
        "Gagal mengambil data siswa."
      );

    }


    semuaSiswa =
      result.data || [];


    tampilkanStatus(
      "Silakan scan QR siswa.",
      ""
    );


    mulaiScanner();

  } catch (error) {

    console.error(error);


    tampilkanError(
      "Gagal memuat data siswa: " +
      error.message
    );


    speak(
      "Gagal memuat data siswa."
    );

  }

}


// ==========================================
// MULAI KAMERA
// ==========================================

async function mulaiScanner() {

  if (kameraAktif) {
    return;
  }


  if (!scanner) {

    scanner =
      new Html5Qrcode("reader");

  }


  try {

    await scanner.start(

      {
        facingMode: "environment"
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


    kameraAktif = true;


    tampilkanStatus(
      "📷 Kamera aktif — silakan scan QR siswa.",
      ""
    );


  } catch (error) {

    console.error(
      "Kamera gagal:",
      error
    );


    kameraAktif = false;


    tampilkanError(
      "Kamera tidak dapat digunakan. " +
      "Pastikan izin kamera diberikan."
    );

  }

}


// ==========================================
// STOP KAMERA
// ==========================================

async function stopScanner() {

  if (!scanner || !kameraAktif) {
    return;
  }


  try {

    await scanner.stop();

  } catch (error) {

    console.log(
      "Stop scanner:",
      error
    );

  }


  kameraAktif = false;

}


// ==========================================
// QR BERHASIL TERBACA
// ==========================================

async function onScanSuccess(
  decodedText,
  decodedResult
) {

  // Cegah scanner membaca QR yang sama
  // berkali-kali secara bersamaan.
  if (sedangMemproses) {
    return;
  }


  sedangMemproses = true;


  const idSiswa =
    String(decodedText).trim();


  console.log(
    "QR terbaca:",
    idSiswa
  );


  // ========================================
  // CARI SISWA
  // ========================================

  const siswa =
    semuaSiswa.find(s => {

      return String(s.ID).trim() ===
        idSiswa;

    });


  if (!siswa) {

    await prosesGagal(
      "QR siswa tidak terdaftar."
    );


    sedangMemproses = false;

    return;

  }


  // ========================================
  // TAMPILKAN PROSES
  // ========================================

  tampilkanStatus(
    "⏳ Menyimpan presensi " +
    siswa.NAMA +
    "...",
    ""
  );


  // ========================================
  // SIMPAN PRESENSI
  // ========================================

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
          "HADIR",

        idGuru:
          ""

      });


    // ======================================
    // BERHASIL
    // ======================================

    if (result.success) {

      tampilkanBerhasil(
        siswa,
        result
      );


      speak(
        "Terima kasih, " +
        siswa.NAMA
      );


      // Tunggu sebentar agar hasil
      // terlihat oleh operator
      await tunggu(1800);


      // Bersihkan status
      tampilkanStatus(
        "📷 Silakan scan siswa berikutnya.",
        ""
      );


      sedangMemproses = false;


      return;

    }


    // ======================================
    // GAGAL
    // ======================================

    await prosesGagal(
      result.message ||
      "Presensi gagal."
    );


  } catch (error) {

    console.error(error);


    await prosesGagal(
      "Gagal terhubung ke server."
    );

  }


  sedangMemproses = false;

}


// ==========================================
// PRESENSI BERHASIL
// ==========================================

function tampilkanBerhasil(
  siswa,
  result
) {

  const resultBox =
    document.getElementById(
      "result"
    );


  resultBox.className =
    "result-box success";


  const jam =
    result.data &&
    result.data.jam
      ? result.data.jam
      : "";


  resultBox.innerHTML = `

    <div style="font-size:40px;">
      ✓
    </div>

    <div style="font-size:20px;">
      PRESENSI BERHASIL
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
      Status:
      <strong>
        HADIR
      </strong>
    </div>

    ${
      jam
        ? `<div>Jam: ${escapeHTML(jam)}</div>`
        : ""
    }

  `;

}


// ==========================================
// GAGAL
// ==========================================

async function prosesGagal(message) {

  tampilkanError(
    message +
    "<br><br>Silakan coba lagi."
  );


  speak(
    "Gagal, coba lagi"
  );


  // Beri waktu suara/error terlihat
  await tunggu(1500);


  tampilkanStatus(
    "📷 Silakan scan siswa berikutnya.",
    ""
  );

}


// ==========================================
// STATUS NORMAL
// ==========================================

function tampilkanStatus(
  message,
  extra
) {

  const result =
    document.getElementById(
      "result"
    );


  result.className =
    "result-box";


  result.innerHTML = `

    <div>
      ${message}
    </div>

    ${
      extra
        ? `<div>${extra}</div>`
        : ""
    }

  `;

}


// ==========================================
// ERROR
// ==========================================

function tampilkanError(message) {

  const result =
    document.getElementById(
      "result"
    );


  result.className =
    "result-box error";


  result.innerHTML = `
    ❌ ${message}
  `;

}


// ==========================================
// DELAY
// ==========================================

function tunggu(ms) {

  return new Promise(
    resolve =>
      setTimeout(resolve, ms)
  );

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
// ERROR SCANNER
// ==========================================

function onScanError(errorMessage) {

  // Jangan tampilkan error scanner
  // karena callback ini dipanggil
  // berkali-kali ketika QR belum ditemukan.

}


// ==========================================
// KEMBALI
// ==========================================

async function kembali() {

  await stopScanner();


  window.location.href =
    "presensi.html";

}


// ==========================================
// MULAI
// ==========================================

loadSiswa();
