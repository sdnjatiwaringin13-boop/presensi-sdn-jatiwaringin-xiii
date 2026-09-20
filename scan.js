<!DOCTYPE html>
<html lang="id">

<head>

  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>
    Scan QR - Presensi Siswa
  </title>


  <style>

    * {
      box-sizing: border-box;
    }


    body {

      margin: 0;

      min-height: 100vh;

      font-family:
        Arial,
        Helvetica,
        sans-serif;

      background:
        #f1f5f9;

      color:
        #1f2937;

    }


    /* ==========================================
       HEADER
    ========================================== */

    .header {

      background:
        #1d4ed8;

      color:
        white;

      padding:
        18px 20px;

      text-align:
        center;

      box-shadow:
        0 2px 8px
        rgba(0,0,0,0.15);

    }


    .header h1 {

      margin:
        0;

      font-size:
        23px;

    }


    .header p {

      margin:
        6px 0 0;

      font-size:
        14px;

      opacity:
        0.9;

    }


    /* ==========================================
       CONTAINER
    ========================================== */

    .container {

      width:
        100%;

      max-width:
        700px;

      margin:
        0 auto;

      padding:
        20px;

    }


    /* ==========================================
       INFO GURU
    ========================================== */

    .guru-card {

      background:
        white;

      border-radius:
        14px;

      padding:
        15px 18px;

      margin-bottom:
        18px;

      box-shadow:
        0 3px 12px
        rgba(0,0,0,0.08);

    }


    .guru-label {

      font-size:
        12px;

      color:
        #6b7280;

      margin-bottom:
        5px;

    }


    .guru-name {

      font-size:
        18px;

      font-weight:
        bold;

      color:
        #111827;

    }


    /* ==========================================
       SCANNER CARD
    ========================================== */

    .scanner-card {

      background:
        white;

      border-radius:
        16px;

      padding:
        18px;

      box-shadow:
        0 3px 12px
        rgba(0,0,0,0.08);

    }


    .scanner-title {

      text-align:
        center;

      font-size:
        18px;

      font-weight:
        bold;

      margin-bottom:
        15px;

    }


    /* ==========================================
       QR READER
    ========================================== */

    #reader {

      width:
        100%;

      max-width:
        500px;

      margin:
        0 auto;

      overflow:
        hidden;

      border-radius:
        12px;

    }


    /* ==========================================
       RESULT
    ========================================== */

    .result-box {

      margin-top:
        18px;

      padding:
        18px;

      border-radius:
        12px;

      background:
        #eff6ff;

      color:
        #1e3a8a;

      text-align:
        center;

      line-height:
        1.6;

      min-height:
        70px;

      display:
        flex;

      flex-direction:
        column;

      justify-content:
        center;

    }


    .result-box.success {

      background:
        #dcfce7;

      color:
        #166534;

    }


    .result-box.error {

      background:
        #fee2e2;

      color:
        #991b1b;

    }


    .student-name {

      margin-top:
        8px;

    }


    /* ==========================================
       BUTTON
    ========================================== */

    .button-group {

      display:
        flex;

      gap:
        10px;

      margin-top:
        18px;

    }


    .btn {

      flex:
        1;

      border:
        none;

      border-radius:
        10px;

      padding:
        13px 15px;

      font-size:
        15px;

      font-weight:
        bold;

      cursor:
        pointer;

    }


    .btn-back {

      background:
        #e5e7eb;

      color:
        #374151;

    }


    .btn-back:hover {

      background:
        #d1d5db;

    }


    .btn-logout {

      background:
        #dc2626;

      color:
        white;

    }


    .btn-logout:hover {

      background:
        #b91c1c;

    }


    /* ==========================================
       PETUNJUK
    ========================================== */

    .instruction {

      margin-top:
        18px;

      padding:
        15px;

      background:
        #f8fafc;

      border-radius:
        12px;

      font-size:
        14px;

      line-height:
        1.6;

      color:
        #4b5563;

    }


    .instruction strong {

      color:
        #111827;

    }


    /* ==========================================
       FOOTER
    ========================================== */

    .footer {

      text-align:
        center;

      padding:
        20px;

      font-size:
        12px;

      color:
        #9ca3af;

    }


    /* ==========================================
       MOBILE
    ========================================== */

    @media (
      max-width: 480px
    ) {

      .container {

        padding:
          12px;

      }


      .header h1 {

        font-size:
          20px;

      }


      .scanner-card {

        padding:
          12px;

      }


      .button-group {

        flex-direction:
          column;

      }

    }

  </style>

</head>


<body>


  <!-- ==========================================
       HEADER
  =========================================== -->

  <header class="header">

    <h1>
      📷 Scan QR Presensi
    </h1>

    <p>
      SD Negeri Jatiwaringin XIII
    </p>

  </header>



  <!-- ==========================================
       CONTAINER
  =========================================== -->

  <main class="container">


    <!-- ========================================
         INFORMASI GURU
    ========================================= -->

    <div class="guru-card">

      <div class="guru-label">
        Guru yang sedang login
      </div>

      <div
        class="guru-name"
        id="guruInfo"
      >
        Memuat informasi guru...
      </div>

    </div>



    <!-- ========================================
         SCANNER
    ========================================= -->

    <div class="scanner-card">

      <div class="scanner-title">

        Arahkan kamera ke QR Code siswa

      </div>


      <!-- AREA KAMERA -->

      <div id="reader"></div>


      <!-- HASIL SCAN -->

      <div
        id="result"
        class="result-box"
      >

        Memulai kamera...

      </div>


      <!-- TOMBOL -->

      <div class="button-group">

        <button
          type="button"
          class="btn btn-back"
          onclick="kembali()"
        >
          ← Kembali
        </button>


        <button
          type="button"
          class="btn btn-logout"
          onclick="logoutScan()"
        >
          Logout
        </button>

      </div>


      <!-- PETUNJUK -->

      <div class="instruction">

        <strong>
          Petunjuk:
        </strong>

        <br>

        1. Izinkan akses kamera ketika diminta browser.

        <br>

        2. Arahkan kamera ke QR Code pada kartu siswa.

        <br>

        3. Tunggu sampai nama siswa muncul.

        <br>

        4. Jika berhasil, status otomatis tercatat sebagai
        <strong>HADIR</strong>.

        <br>

        5. QR yang sama tidak dapat melakukan presensi
        dua kali pada tanggal yang sama.

      </div>

    </div>


  </main>



  <!-- ==========================================
       FOOTER
  =========================================== -->

  <footer class="footer">

    Sistem Presensi Siswa

    <br>

    SD Negeri Jatiwaringin XIII

  </footer>



  <!-- ==========================================
       LIBRARY QR SCANNER
  =========================================== -->

  <script
    src="https://unpkg.com/html5-qrcode"
  ></script>


  <!-- ==========================================
       SCAN JS
  =========================================== -->

  <script
    src="scan.js"
  ></script>



  <!-- ==========================================
       SCRIPT HALAMAN
  =========================================== -->

  <script>

    /*
     * Tampilkan nama guru
     * yang sedang login.
     */

    document.addEventListener(
      "DOMContentLoaded",
      function () {

        try {

          const data =
            localStorage.getItem(
              "presensiUser"
            );


          if (!data) {

            window.location.href =
              "index.html";

            return;

          }


          const user =
            JSON.parse(data);


          if (
            !user ||
            String(
              user.role || ""
            )
            .toUpperCase() !==
            "GURU"
          ) {

            window.location.href =
              "index.html";

            return;

          }


          const nama =
            user.nama ||
            user.namaGuru ||
            user.username ||
            "Guru";


          const guruInfo =
            document.getElementById(
              "guruInfo"
            );


          if (guruInfo) {

            guruInfo.textContent =
              nama;

          }

        } catch (error) {

          console.error(
            error
          );

          window.location.href =
            "index.html";

        }

      }
    );


    /*
     * Logout
     */

    function logoutScan() {

      if (
        typeof stopScanner ===
        "function"
      ) {

        stopScanner();

      }


      localStorage.removeItem(
        "presensiUser"
      );


      window.location.href =
        "index.html";

    }

  </script>


</body>

</html>
