const API_URL =
  "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";

let semuaSiswa = [];
let scanner = null;
let sedangMemproses = false;
let kameraAktif = false;

// ==========================================
// DATA GURU YANG LOGIN
// ==========================================

let userLogin = null;
let idGuruLogin = "";

function ambilDataGuru() {
  try {
    const dataUser = localStorage.getItem("presensiUser");

    if (!dataUser) {
      throw new Error("Data login tidak ditemukan.");
    }

    userLogin = JSON.parse(dataUser);

    if (!userLogin) {
      throw new Error("Data login tidak valid.");
    }

    if (userLogin.role !== "GURU") {
      throw new Error("Halaman scan QR hanya dapat digunakan oleh GURU.");
    }

    idGuruLogin = String(userLogin.idGuru || "").trim();

    if (!idGuruLogin) {
      throw new Error("ID Guru tidak ditemukan pada akun yang sedang login.");
    }

    console.log("Guru Login:", userLogin);
    console.log("ID Guru:", idGuruLogin);

    return true;

  } catch (error) {
    console.error("Gagal mengambil data guru:", error);

    tampilkanError(
      "Data guru tidak ditemukan.<br><br>" +
      "Silakan login kembali."
    );

    return false;
  }
}


// ==========================================
// API
// ==========================================

async function callAPI(payload) {

  const response = await fetch(API_URL, {
    method: "POST",

    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },

    body: JSON.stringify(payload)
  });

  const text = await response.text();

  let result;

  try {
    result = JSON.parse(text);

  } catch (error) {

    console.error("Response server:", text);

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
    console.warn("Browser tidak mendukung speech synthesis.");
    return;
  }

  try {

    window.speechSynthesis.cancel();

    const voice =
      new SpeechSynthesisUtterance(text);

    voice.lang = "id-ID";
    voice.rate = 0.9;
    voice.pitch = 1;
    voice.volume = 1;

    window.speechSynthesis.speak(voice);

  } catch (error) {

    console.error(
      "Voice error:",
      error
    );
  }
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

    const result = await callAPI({
      action: "getSiswa"
    });

    if (!result.success) {

      throw new Error(
        result.message ||
        "Gagal mengambil data siswa."
      );
    }

    semuaSiswa = result.data || [];

    console.log(
      "Jumlah siswa:",
      semuaSiswa.length
    );

    if (semuaSiswa.length === 0) {

      throw new Error(
        "Data siswa belum tersedia."
      );
    }

    tampilkanStatus(
      "Data siswa berhasil dimuat.",
      ""
    );

    await tunggu(500);

    mulaiScanner();

  } catch (error) {

    console.error(error);

    tampilkanError(
      "Gagal memuat data siswa: " +
      error.message
    );

    speak(
      "Gagal memuat data siswa"
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

    console.log(
      "Kamera scanner aktif."
    );

  } catch (error) {

    console.error(
      "Kamera gagal:",
      error
    );

    kameraAktif = false;

    tampilkanError(
      "Kamera tidak dapat digunakan.<br><br>" +
      "Pastikan izin kamera diberikan pada browser."
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

  // Mencegah QR terbaca berkali-kali
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
  // CARI DATA SISWA
  // ========================================

  const siswa =
    semuaSiswa.find(
      s =>
        String(s.ID).trim() === idSiswa
    );

  // ========================================
  // QR TIDAK TERDAFTAR
  // ========================================

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
    "⏳ Menyimpan presensi...",
    siswa.NAMA
  );


  try {

    // ======================================
    // SIMPAN PRESENSI
    // ======================================

    const result =
      await callAPI({

        action: "simpanPresensi",

        // Data siswa
        id: siswa.ID,

        nisn: siswa.NISN,

        nama: siswa.NAMA,

        kelas: siswa.KELAS,

        // Status otomatis
        status: "HADIR",

        // Guru yang login
        idGuru: idGuruLogin
      });


    console.log(
      "Hasil simpan:",
      result
    );


    // ======================================
    // BERHASIL
    // ======================================

    if (result.success) {

      tampilkanBerhasil(
        siswa,
        result
      );

      // Voice
      speak(
        "Terima kasih, " +
        siswa.NAMA
      );

      // Tunggu sebentar agar siswa
      // melihat hasil presensinya
      await tunggu(1800);


      // Kamera TIDAK dimatikan.
      // Langsung siap siswa berikutnya.

      tampilkanStatus(
        "📷 Silakan scan siswa berikutnya.",
        ""
      );

      sedangMemproses = false;

      return;
    }


    // ======================================
    // GAGAL DARI SERVER
    // ======================================

    await prosesGagal(
      result.message ||
      "Presensi gagal."
    );


  } catch (error) {

    console.error(
      "Error simpan presensi:",
      error
    );

    await prosesGagal(
      "Gagal terhubung ke server."
    );
  }


  sedangMemproses = false;
}


// ==========================================
// TAMPILKAN BERHASIL
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
        ? `
          <div>
            Jam:
            ${escapeHTML(jam)}
          </div>
        `
        : ""
    }

  `;
}


// ==========================================
// PROSES GAGAL
// ==========================================

async function prosesGagal(
  message
) {

  tampilkanError(
    message +
    "<br><br>" +
    "Silakan coba lagi."
  );


  // Voice gagal
  speak(
    "Gagal, coba lagi"
  );


  // Tampilkan pesan selama 1,5 detik
  await tunggu(1500);


  // Kembali ke mode scan
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
        ? `
          <div>
            ${escapeHTML(extra)}
          </div>
        `
        : ""
    }

  `;
}


// ==========================================
// STATUS ERROR
// ==========================================

function tampilkanError(
  message
) {

  const result =
    document.getElementById(
      "result"
    );

  result.className =
    "result-box error";


  result.innerHTML =
    `❌ ${message}`;
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
// KEAMANAN HTML
// ==========================================

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


// ==========================================
// ERROR SAAT SCAN
// ==========================================

function onScanError(
  errorMessage
) {

  // Error ini normal terjadi ketika
  // kamera belum menemukan QR.
  // Tidak perlu ditampilkan kepada user.
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
// MULAI APLIKASI
// ==========================================

async function init() {

  // Pastikan user sudah login
  const loginOK =
    ambilDataGuru();

  if (!loginOK) {

    await tunggu(2000);

    window.location.href =
      "index.html";

    return;
  }


  // Setelah data guru valid,
  // ambil data siswa
  await loadSiswa();
}


// Jalankan aplikasi
init();
