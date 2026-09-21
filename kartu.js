/* =========================================================
   KARTU PELAJAR
   SD NEGERI JATIWARINGIN XIII
   ========================================================= */

(function () {

  "use strict";

  let semuaSiswa = [];

  const container = document.getElementById("kartuContainer");
  const searchInput = document.getElementById("searchInput");
  const kelasFilter = document.getElementById("kelasFilter");
  const refreshButton = document.getElementById("refreshButton");
  const printButton = document.getElementById("printButton");


  /* =========================================================
     INIT
     ========================================================= */

  document.addEventListener("DOMContentLoaded", function () {

    loadSiswa();

    if (searchInput) {
      searchInput.addEventListener(
        "input",
        filterSiswa
      );
    }

    if (kelasFilter) {
      kelasFilter.addEventListener(
        "change",
        filterSiswa
      );
    }

    if (refreshButton) {
      refreshButton.addEventListener(
        "click",
        function () {
          loadSiswa(true);
        }
      );
    }

    if (printButton) {
      printButton.addEventListener(
        "click",
        function () {
          window.print();
        }
      );
    }

  });


  /* =========================================================
     LOAD DATA SISWA
     ========================================================= */

  async function loadSiswa(forceRefresh) {

    try {

      showLoading();

      const response = await callAPI({
        action: "getSiswa",
        aktifOnly: true,
        forceRefresh: !!forceRefresh
      });

      if (!response) {
        throw new Error(
          "Server tidak memberikan respons."
        );
      }

      if (!response.success) {
        throw new Error(
          response.message ||
          "Data siswa gagal dimuat."
        );
      }

      semuaSiswa = Array.isArray(response.data)
        ? response.data
        : [];

      isiFilterKelas();

      tampilkanSiswa(semuaSiswa);

    } catch (error) {

      console.error(
        "loadSiswa:",
        error
      );

      container.innerHTML = `
        <div style="
          grid-column:1/-1;
          padding:30px;
          background:white;
          border-radius:10px;
          text-align:center;
          color:#b00020;
        ">
          <strong>Data siswa gagal dimuat.</strong>
          <br>
          <small>${escapeHTML(
            error.message || "Terjadi kesalahan."
          )}</small>
        </div>
      `;

    }

  }


  /* =========================================================
     FILTER KELAS
     ========================================================= */

  function isiFilterKelas() {

    if (!kelasFilter) {
      return;
    }

    const daftarKelas = [
      ...new Set(
        semuaSiswa
          .map(function (siswa) {
            return String(
              siswa.KELAS ||
              siswa.kelas ||
              ""
            ).trim();
          })
          .filter(Boolean)
      )
    ];

    daftarKelas.sort(function (a, b) {
      return a.localeCompare(
        b,
        "id",
        {
          numeric: true
        }
      );
    });

    kelasFilter.innerHTML =
      `<option value="">Semua Kelas</option>`;

    daftarKelas.forEach(function (kelas) {

      const option =
        document.createElement("option");

      option.value = kelas;
      option.textContent = kelas;

      kelasFilter.appendChild(option);

    });

  }


  /* =========================================================
     FILTER SISWA
     ========================================================= */

  function filterSiswa() {

    const keyword =
      String(
        searchInput?.value || ""
      )
        .trim()
        .toLowerCase();

    const kelas =
      String(
        kelasFilter?.value || ""
      )
        .trim()
        .toLowerCase();

    const hasil =
      semuaSiswa.filter(function (siswa) {

        const nama =
          String(
            siswa.NAMA ||
            siswa.nama ||
            ""
          ).toLowerCase();

        const nisn =
          String(
            siswa.NISN ||
            siswa.nisn ||
            ""
          ).toLowerCase();

        const dataKelas =
          String(
            siswa.KELAS ||
            siswa.kelas ||
            ""
          ).toLowerCase();

        const cocokKeyword =
          !keyword ||
          nama.includes(keyword) ||
          nisn.includes(keyword);

        const cocokKelas =
          !kelas ||
          dataKelas === kelas;

        return (
          cocokKeyword &&
          cocokKelas
        );

      });

    tampilkanSiswa(hasil);

  }


  /* =========================================================
     TAMPILKAN KARTU
     ========================================================= */

  function tampilkanSiswa(data) {

    if (!container) {
      return;
    }

    container.innerHTML = "";

    if (!data.length) {

      container.innerHTML = `
        <div style="
          grid-column:1/-1;
          background:white;
          padding:30px;
          text-align:center;
          border-radius:10px;
        ">
          Data siswa tidak ditemukan.
        </div>
      `;

      return;
    }


    data.forEach(function (siswa, index) {

      const kartu =
        buatKartu(siswa, index);

      container.appendChild(kartu);

    });

  }


  /* =========================================================
     BUAT KARTU
     ========================================================= */

  function buatKartu(siswa, index) {

    const id =
      siswa.ID ||
      siswa.id ||
      "";

    const nisn =
      siswa.NISN ||
      siswa.nisn ||
      "-";

    const nama =
      siswa.NAMA ||
      siswa.nama ||
      "-";

    /*
     * Backend yang digunakan sebelumnya
     * belum selalu mempunyai TANGGAL_LAHIR.
     *
     * Karena itu kita cek beberapa kemungkinan
     * nama kolom.
     */

    const tanggalLahir =
      siswa.TANGGAL_LAHIR ||
      siswa.tanggalLahir ||
      siswa.TGL_LAHIR ||
      siswa.tglLahir ||
      "-";


    const card =
      document.createElement("div");

    card.className = "student-card";


    /* =====================================================
       HTML KARTU
       ===================================================== */

    card.innerHTML = `

      <!-- DEKORASI -->
      <div class="top-red"></div>

      <div class="top-gray"></div>

      <div class="top-yellow"></div>

      <div class="yellow-dots"></div>

      <div class="circle-decoration">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>


      <!-- HEADER SEKOLAH -->

      <div class="school-header">

        <div class="school-title">
          SD NEGERI<br>
          JATIWARINGIN XIII
        </div>

      </div>


      <!-- JUDUL -->

      <div class="card-title">
        KARTU PELAJAR
      </div>


      <!-- QR -->

      <div class="qr-wrapper">

        <div
          class="qr-code"
          id="qr-${index}">
        </div>

      </div>


      <!-- DATA -->

      <div class="student-info">

        <div class="student-row">

          <div class="student-label">
            NAMA
          </div>

          <div class="student-separator">
            :
          </div>

          <div
            class="student-value"
            title="${escapeAttr(nama)}">

            ${escapeHTML(nama)}

          </div>

        </div>


        <div class="student-row">

          <div class="student-label">
            NISN
          </div>

          <div class="student-separator">
            :
          </div>

          <div class="student-value">

            ${escapeHTML(nisn)}

          </div>

        </div>


        <div class="student-row">

          <div class="student-label">
            TGL LAHIR
          </div>

          <div class="student-separator">
            :
          </div>

          <div class="student-value">

            ${escapeHTML(
              formatTanggalLahir(tanggalLahir)
            )}

          </div>

        </div>

      </div>


      <!-- FOOTER -->

      <div class="chevron">

        <span></span>
        <span></span>
        <span></span>

      </div>

      <div class="bottom-red"></div>

      <div class="bottom-yellow"></div>

    `;


    /* =====================================================
       GENERATE QR
       ===================================================== */

    const qrElement =
      card.querySelector(
        `#qr-${index}`
      );

    if (qrElement) {

      /*
       * ID TIDAK DITAMPILKAN DI KARTU,
       * tetapi tetap dimasukkan ke QR.
       *
       * Scanner dapat membaca:
       *
       * {
       *   id: "...",
       *   nisn: "..."
       * }
       */

      const qrData =
        JSON.stringify({
          id: String(id),
          nisn: String(nisn)
        });


      new QRCode(
        qrElement,
        {
          text: qrData,

          width: 180,
          height: 180,

          colorDark: "#000000",
          colorLight: "#ffffff",

          correctLevel:
            QRCode.CorrectLevel.M
        }
      );

    }


    return card;

  }


  /* =========================================================
     FORMAT TANGGAL LAHIR
     ========================================================= */

  function formatTanggalLahir(value) {

    if (
      !value ||
      value === "-" ||
      value === "null" ||
      value === "undefined"
    ) {
      return "-";
    }

    const text =
      String(value).trim();

    /*
     * Jika sudah berbentuk:
     * 26 Agustus 2017
     */

    if (
      /[A-Za-z]/.test(text)
    ) {
      return text;
    }


    /*
     * Jika bentuk:
     * 2017-08-26
     */

    const match =
      text.match(
        /^(\d{4})-(\d{1,2})-(\d{1,2})/
      );

    if (match) {

      const tahun =
        Number(match[1]);

      const bulan =
        Number(match[2]);

      const hari =
        Number(match[3]);

      const namaBulan = [
        "",
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember"
      ];

      return `${hari} ${
        namaBulan[bulan] || ""
      } ${tahun}`;

    }


    return text;

  }


  /* =========================================================
     LOADING
     ========================================================= */

  function showLoading() {

    if (!container) {
      return;
    }

    container.innerHTML = `

      <div style="
        grid-column:1/-1;
        background:white;
        padding:40px;
        text-align:center;
        border-radius:10px;
      ">

        Memuat data siswa...

      </div>

    `;

  }


  /* =========================================================
     ESCAPE HTML
     ========================================================= */

  function escapeHTML(value) {

    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }


  function escapeAttr(value) {

    return escapeHTML(value);

  }


})();
