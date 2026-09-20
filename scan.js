/*******************************************************
 * SCAN QR PRESENSI SISWA
 * SD NEGERI JATIWARINGIN XIII
 *******************************************************/

const API_URL =
  "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";


/* =====================================================
   VARIABEL GLOBAL
===================================================== */

let semuaSiswa = [];

let scanner = null;

let sedangMemproses = false;

let kameraAktif = false;

let userLogin = null;

let idGuruLogin = "";


/* =====================================================
   SAAT HALAMAN DIBUKA
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  async function () {

    await init();

  }
);


/* =====================================================
   AMBIL DATA GURU YANG LOGIN
===================================================== */

function ambilDataGuru() {

  try {

    const dataUser =
      localStorage.getItem(
        "presensiUser"
      );


    if (!dataUser) {

      throw new Error(
        "Data login tidak ditemukan."
      );

    }


    userLogin =
      JSON.parse(dataUser);


    if (!userLogin) {

      throw new Error(
        "Data login tidak valid."
      );

    }


    const role =
      String(
        userLogin.role || ""
      )
      .trim()
      .toUpperCase();


    if (role !== "GURU") {

      throw new Error(
        "Halaman scan QR hanya dapat digunakan oleh GURU."
      );

    }


    idGuruLogin =
      String(
        userLogin.idGuru || ""
      ).trim();


    if (!idGuruLogin) {

      throw new Error(
        "ID Guru tidak ditemukan pada akun yang sedang login."
      );

    }


    console.log(
      "================================="
    );

    console.log(
      "USER LOGIN"
    );

    console.log(
      userLogin
    );

    console.log(
      "ID GURU:",
      idGuruLogin
    );

    console.log(
      "================================="
    );


    return true;


  } catch (error) {

    console.error(
      "Gagal mengambil data guru:",
      error
    );


    tampilkanError(
      "Data guru tidak ditemukan.<br><br>" +
      escapeHTML(error.message) +
      "<br><br>" +
      "Silakan login kembali."
    );


    return false;

  }

}


/* =====================================================
   PANGGIL API
===================================================== */

async function callAPI(payload) {

  try {

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


    if (!response.ok) {

      throw new Error(
        "HTTP Error " +
        response.status
      );

    }


    const text =
      await response.text();


    if (!text) {

      throw new Error(
        "Server tidak mengirim response."
      );

    }


    let result;


    try {

      result =
        JSON.parse(text);

    } catch (error) {

      console.error(
        "Response server:",
        text
      );


      throw new Error(
        "Response server bukan JSON yang valid."
      );

    }


    console.log(
      "API RESPONSE:",
      result
    );


    return result;


  } catch (error) {

    console.error(
      "API ERROR:",
      error
    );


    throw error;

  }

}


/* =====================================================
   VOICE
===================================================== */

function speak(text) {

  if (
    !(
      "speechSynthesis"
      in window
    )
  ) {

    return;

  }


  try {

    window.speechSynthesis.cancel();


    const voice =
      new SpeechSynthesisUtterance(
        text
      );


    voice.lang =
      "id-ID";


    voice.rate =
      0.9;


    voice.pitch =
      1;


    voice.volume =
      1;


    window.speechSynthesis.speak(
      voice
    );


  } catch (error) {

    console.error(
      "Voice error:",
      error
    );

  }

}


/* =====================================================
   LOAD DATA SISWA
===================================================== */

async function loadSiswa() {

  tampilkanStatus(
    "⏳ Memuat data siswa...",
    ""
  );


  try {

    const result =
      await callAPI({
        action: "getSiswa"
      });


    if (!result) {

      throw new Error(
        "Server tidak memberikan response."
      );

    }


    if (
      result.success !== true
    ) {

      throw new Error(
        result.message ||
        "Gagal mengambil data siswa."
      );

    }


    semuaSiswa =
      Array.isArray(
        result.data
      )
        ? result.data
        : [];


    /* ==========================================
       HANYA SISWA AKTIF
    ========================================== */

    semuaSiswa =
      semuaSiswa.filter(
        function (siswa) {

          const status =
            String(
              siswa.STATUS ||
              "AKTIF"
            )
            .trim()
            .toUpperCase();


          return (
            status === "AKTIF"
          );

        }
      );


    console.log(
      "Jumlah siswa aktif:",
      semuaSiswa.length
    );


    if (
      semuaSiswa.length === 0
    ) {

      throw new Error(
        "Data siswa aktif belum tersedia."
      );

    }


    tampilkanStatus(
      "✓ Data siswa berhasil dimuat.",
      semuaSiswa.length +
      " siswa aktif"
    );


    await tunggu(500);


    await mulaiScanner();


  } catch (error) {

    console.error(
      "Gagal memuat siswa:",
      error
    );


    tampilkanError(
      "Gagal memuat data siswa:<br><br>" +
      escapeHTML(error.message)
    );


    speak(
      "Gagal memuat data siswa"
    );

  }

}


/* =====================================================
   MULAI KAMERA
===================================================== */

async function mulaiScanner() {

  if (kameraAktif) {

    return;

  }


  if (
    typeof Html5Qrcode ===
    "undefined"
  ) {

    tampilkanError(
      "Library QR Scanner tidak ditemukan.<br><br>" +
      "Pastikan html5-qrcode sudah dimuat pada scan.html."
    );

    return;

  }


  if (!scanner) {

    scanner =
      new Html5Qrcode(
        "reader"
      );

  }


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


    kameraAktif =
      true;


    tampilkanStatus(
      "📷 Kamera aktif.",
      "Silakan arahkan kamera ke QR siswa."
    );


    console.log(
      "Kamera scanner aktif."
    );


  } catch (error) {

    console.error(
      "Kamera gagal:",
      error
    );


    kameraAktif =
      false;


    tampilkanError(
      "Kamera tidak dapat digunakan.<br><br>" +
      "Pastikan:<br>" +
      "• Izin kamera diberikan<br>" +
      "• Website menggunakan HTTPS<br>" +
      "• Kamera tidak sedang digunakan aplikasi lain"
    );

  }

}


/* =====================================================
   STOP KAMERA
===================================================== */

async function stopScanner() {

  if (
    !scanner ||
    !kameraAktif
  ) {

    return;

  }


  try {

    await scanner.stop();

  } catch (error) {

    console.warn(
      "Stop scanner:",
      error
    );

  }


  kameraAktif =
    false;

}


/* =====================================================
   QR BERHASIL DIBACA
===================================================== */

async function onScanSuccess(
  decodedText,
  decodedResult
) {

  /* ==========================================
     CEGAH DOUBLE SCAN
  ========================================== */

  if (
    sedangMemproses
  ) {

    return;

  }


  sedangMemproses =
    true;


  const idSiswa =
    String(
      decodedText || ""
    ).trim();


  console.log(
    "================================="
  );

  console.log(
    "QR TERBACA:"
  );

  console.log(
    idSiswa
  );

  console.log(
    "================================="
  );


  /* ==========================================
     QR KOSONG
  ========================================== */

  if (!idSiswa) {

    await prosesGagal(
      "QR tidak berisi ID siswa."
    );


    sedangMemproses =
      false;


    return;

  }


  /* ==========================================
     CARI SISWA
  ========================================== */

  const siswa =
    semuaSiswa.find(
      function (item) {

        return (
          String(
            item.ID || ""
          ).trim() ===
          idSiswa
        );

      }
    );


  /* ==========================================
     SISWA TIDAK DITEMUKAN
  ========================================== */

  if (!siswa) {

    await prosesGagal(
      "QR siswa tidak terdaftar."
    );


    sedangMemproses =
      false;


    return;

  }


  /* ==========================================
     CEK ID SISWA
  ========================================== */

  if (!siswa.ID) {

    await prosesGagal(
      "Data siswa tidak memiliki ID."
    );


    sedangMemproses =
      false;


    return;

  }


  /* ==========================================
     TAMPILKAN PROSES
  ========================================== */

  tampilkanStatus(
    "⏳ Menyimpan presensi...",
    siswa.NAMA
  );


  try {

    /* ========================================
       DATA YANG DIKIRIM KE SERVER
    ======================================== */

    const payload = {

      action:
        "simpanPresensi",

      id:
        String(
          siswa.ID
        ).trim(),

      nisn:
        siswa.NISN || "",

      nama:
        siswa.NAMA || "",

      kelas:
        siswa.KELAS || "",

      status:
        "HADIR",

      idGuru:
        idGuruLogin,

      sumber:
        "QR"

    };


    console.log(
      "PAYLOAD PRESENSI QR:"
    );

    console.log(
      payload
    );


    /* ========================================
       KIRIM KE SERVER
    ======================================== */

    const result =
      await callAPI(
        payload
      );


    console.log(
      "HASIL SIMPAN:",
      result
    );


    /* ========================================
       BERHASIL
    ======================================== */

    if (
      result &&
      result.success === true
    ) {

      tampilkanBerhasil(
        siswa,
        result
      );


      speak(
        "Terima kasih, " +
        siswa.NAMA
      );


      await tunggu(
        1800
      );


      tampilkanStatus(
        "📷 Kamera aktif.",
        "Silakan scan siswa berikutnya."
      );


      sedangMemproses =
        false;


      return;

    }


    /* ========================================
       DUPLIKAT
    ======================================== */

    if (
      result &&
      result.duplicate === true
    ) {

      await prosesGagal(
        "Siswa ini sudah melakukan presensi hari ini."
      );


      sedangMemproses =
        false;


      return;

    }


    /* ========================================
       ERROR SERVER
    ======================================== */

    await prosesGagal(
      (
        result &&
        result.message
      ) ||
      "Presensi gagal disimpan."
    );


  } catch (error) {

    console.error(
      "Error simpan presensi:",
      error
    );


    await prosesGagal(
      "Gagal terhubung ke server.<br><br>" +
      escapeHTML(
        error.message
      )
    );

  }


  sedangMemproses =
    false;

}


/* =====================================================
   TAMPILKAN BERHASIL
===================================================== */

function tampilkanBerhasil(
  siswa,
  result
) {

  const resultBox =
    document.getElementById(
      "result"
    );


  if (!resultBox) {

    return;

  }


  resultBox.className =
    "result-box success";


  let jam = "";


  if (
    result &&
    result.data &&
    result.data.jam
  ) {

    jam =
      result.data.jam;

  }


  resultBox.innerHTML = `

    <div
      style="
        font-size:50px;
        margin-bottom:8px;
      "
    >
      ✓
    </div>

    <div
      style="
        font-size:21px;
        font-weight:bold;
      "
    >
      PRESENSI BERHASIL
    </div>

    <div
      class="student-name"
      style="
        font-size:20px;
        font-weight:bold;
        margin-top:10px;
      "
    >
      ${escapeHTML(
        siswa.NAMA
      )}
    </div>

    <div
      style="
        margin-top:6px;
      "
    >
      NISN:
      ${escapeHTML(
        siswa.NISN
      )}
    </div>

    <div>
      Kelas:
      <strong>
        ${escapeHTML(
          siswa.KELAS
        )}
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
            <strong>
              ${escapeHTML(
                jam
              )}
            </strong>
          </div>
        `
        : ""
    }

  `;

}


/* =====================================================
   PROSES GAGAL
===================================================== */

async function prosesGagal(
  message
) {

  tampilkanError(
    message +
    "<br><br>" +
    "Silakan coba lagi."
  );


  speak(
    "Gagal, coba lagi"
  );


  await tunggu(
    1500
  );


  tampilkanStatus(
    "📷 Kamera aktif.",
    "Silakan scan siswa berikutnya."
  );

}


/* =====================================================
   STATUS NORMAL
===================================================== */

function tampilkanStatus(
  message,
  extra
) {

  const result =
    document.getElementById(
      "result"
    );


  if (!result) {

    return;

  }


  result.className =
    "result-box";


  result.innerHTML = `

    <div>
      ${message}
    </div>

    ${
      extra
        ? `
          <div
            style="
              margin-top:6px;
            "
          >
            ${escapeHTML(
              extra
            )}
          </div>
        `
        : ""
    }

  `;

}


/* =====================================================
   STATUS ERROR
===================================================== */

function tampilkanError(
  message
) {

  const result =
    document.getElementById(
      "result"
    );


  if (!result) {

    return;

  }


  result.className =
    "result-box error";


  result.innerHTML =
    `❌ ${message}`;

}


/* =====================================================
   DELAY
===================================================== */

function tunggu(ms) {

  return new Promise(
    function (resolve) {

      setTimeout(
        resolve,
        ms
      );

    }
  );

}


/* =====================================================
   ESCAPE HTML
===================================================== */

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


/* =====================================================
   ERROR SCANNER
===================================================== */

function onScanError(
  errorMessage
) {

  /*
   * Error ketika QR belum ditemukan
   * adalah kondisi normal.
   *
   * Karena itu tidak ditampilkan
   * kepada pengguna.
   */

}


/* =====================================================
   KEMBALI KE PRESENSI
===================================================== */

async function kembali() {

  await stopScanner();


  window.location.href =
    "presensi.html";

}


/* =====================================================
   INIT
===================================================== */

async function init() {

  /* ==========================================
     CEK LOGIN GURU
  ========================================== */

  const loginOK =
    ambilDataGuru();


  if (!loginOK) {

    await tunggu(
      2000
    );


    window.location.href =
      "index.html";


    return;

  }


  /* ==========================================
     LOAD DATA SISWA
  ========================================== */

  await loadSiswa();

}


/* =====================================================
   SAAT HALAMAN DITUTUP
===================================================== */

window.addEventListener(
  "beforeunload",
  function () {

    if (
      scanner &&
      kameraAktif
    ) {

      scanner
        .stop()
        .catch(
          function () {}
        );

    }

  }
);
