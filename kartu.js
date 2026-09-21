"use strict";


(function () {


  /* =====================================================
     VARIABLE
  ===================================================== */

  let semuaSiswa = [];

  let siswaTampil = [];

  let sedangMemuat = false;


  /* =====================================================
     INIT
  ===================================================== */

  document.addEventListener(
    "DOMContentLoaded",
    init
  );


  async function init() {

    try {

      bindEvents();

      await loadData();

    } catch (error) {

      console.error(
        "INIT KARTU:",
        error
      );

      showError(
        error.message ||
        "Gagal membuka kartu siswa."
      );

    }

  }


  /* =====================================================
     EVENT
  ===================================================== */

  function bindEvents() {


    document
      .getElementById(
        "searchInput"
      )
      ?.addEventListener(
        "input",
        filterData
      );


    document
      .getElementById(
        "kelasSelect"
      )
      ?.addEventListener(
        "change",
        filterData
      );


    document
      .getElementById(
        "refreshButton"
      )
      ?.addEventListener(
        "click",
        function () {

          loadData(
            true
          );

        }
      );


    document
      .getElementById(
        "cetakButton"
      )
      ?.addEventListener(
        "click",
        cetakKartu
      );

  }


  /* =====================================================
     LOAD DATA
  ===================================================== */

  async function loadData(
    forceRefresh = false
  ) {


    if (sedangMemuat) {

      return;

    }


    sedangMemuat = true;


    const container =
      document.getElementById(
        "kartuContainer"
      );


    if (container) {

      container.innerHTML = `

        <div class="kartu-empty">

          <i class="fa-solid fa-spinner fa-spin"></i>

          Memuat data siswa...

        </div>

      `;

    }


    try {


      const result =
        await callAPI({

          action:
            "getSiswa",

          aktifOnly:
            true,

          forceRefresh:
            forceRefresh

        });


      if (
        !result ||
        result.success !== true
      ) {

        throw new Error(
          result?.message ||
          "Gagal mengambil data siswa."
        );

      }


      semuaSiswa =
        Array.isArray(
          result.data
        )
          ? result.data
          : [];


      loadKelas();


      filterData();


    } catch (error) {

      console.error(
        "LOAD KARTU:",
        error
      );


      showError(
        error.message ||
        "Gagal memuat data siswa."
      );


    } finally {

      sedangMemuat = false;

    }

  }


  /* =====================================================
     LOAD KELAS
  ===================================================== */

  function loadKelas() {


    const select =
      document.getElementById(
        "kelasSelect"
      );


    if (!select) {

      return;

    }


    const current =
      select.value;


    const kelas =
      Array.from(

        new Set(

          semuaSiswa

            .map(
              function (siswa) {

                return String(
                  siswa.KELAS ||
                  ""
                ).trim();

              }
            )

            .filter(Boolean)

        )

      )
      .sort(
        naturalSort
      );


    select.innerHTML = `

      <option value="">
        Semua Kelas
      </option>

      ${
        kelas
          .map(
            function (nama) {

              return `

                <option
                  value="${escapeAttr(nama)}"
                >

                  ${escapeHTML(nama)}

                </option>

              `;

            }
          )
          .join("")

      }

    `;


    if (
      kelas.includes(current)
    ) {

      select.value =
        current;

    }

  }


  /* =====================================================
     FILTER
  ===================================================== */

  function filterData() {


    const search =
      String(

        document
          .getElementById(
            "searchInput"
          )
          ?.value ||
        ""

      )
        .trim()
        .toLowerCase();


    const kelas =
      String(

        document
          .getElementById(
            "kelasSelect"
          )
          ?.value ||
        ""

      )
        .trim();


    siswaTampil =
      semuaSiswa.filter(
        function (siswa) {


          const nama =
            String(
              siswa.NAMA ||
              ""
            )
              .toLowerCase();


          const nisn =
            String(
              siswa.NISN ||
              ""
            )
              .toLowerCase();


          const cocokSearch =
            !search ||
            nama.includes(search) ||
            nisn.includes(search);


          const cocokKelas =
            !kelas ||
            String(
              siswa.KELAS ||
              ""
            ).trim() === kelas;


          return (
            cocokSearch &&
            cocokKelas
          );

        }
      );


    renderKartu();

  }


  /* =====================================================
     RENDER KARTU
  ===================================================== */

  function renderKartu() {


    const container =
      document.getElementById(
        "kartuContainer"
      );


    if (!container) {

      return;

    }


    if (
      !siswaTampil.length
    ) {

      container.innerHTML = `

        <div class="kartu-empty">

          <i class="fa-solid fa-user-slash"></i>

          Tidak ada siswa yang ditemukan.

        </div>

      `;

      return;

    }


    /*
     * SATU SISWA = SATU KARTU
     *
     * Tidak ada duplikasi kartu.
     */

    container.innerHTML =
      siswaTampil
        .map(
          buatKartu
        )
        .join("");


  }


  /* =====================================================
     BUAT KARTU
  ===================================================== */

  function buatKartu(
    siswa
  ) {


    const id =
      String(
        siswa.ID ||
        ""
      ).trim();


    const nisn =
      String(
        siswa.NISN ||
        ""
      ).trim();


    const nama =
      String(
        siswa.NAMA ||
        "-"
      ).trim();


    const kelas =
      String(
        siswa.KELAS ||
        "-"
      ).trim();


    const jk =
      String(
        siswa.JK ||
        "-"
      ).trim();


    /*
     * Data QR.
     *
     * SATU QR SAJA.
     */

    const qrData =
      JSON.stringify({

        id:
          id,

        nisn:
          nisn

      });


    const qrUrl =
      buatQRUrl(
        qrData
      );


    return `

      <div
        class="kartu-siswa"
        data-id="${escapeAttr(id)}"
      >


        <!-- HEADER -->

        <div class="kartu-header">


          <div class="kartu-logo">

            SD

          </div>


          <div class="kartu-sekolah">


            <div class="kartu-sekolah-nama">

              SD NEGERI JATIWARINGIN XIII

            </div>


            <div class="kartu-subtitle">

              KARTU IDENTITAS SISWA

            </div>


          </div>


        </div>


        <!-- BODY -->

        <div class="kartu-body">


          <div class="kartu-nama">

            ${escapeHTML(nama)}

          </div>


          <div class="kartu-data">


            <div class="kartu-data-label">
              NISN
            </div>

            <div class="kartu-data-separator">
              :
            </div>

            <div class="kartu-data-value">
              ${escapeHTML(nisn || "-")}
            </div>


            <div class="kartu-data-label">
              Kelas
            </div>

            <div class="kartu-data-separator">
              :
            </div>

            <div class="kartu-data-value">
              ${escapeHTML(kelas)}
            </div>


            <div class="kartu-data-label">
              JK
            </div>

            <div class="kartu-data-separator">
              :
            </div>

            <div class="kartu-data-value">
              ${escapeHTML(jk)}
            </div>


            <div class="kartu-data-label">
              ID
            </div>

            <div class="kartu-data-separator">
              :
            </div>

            <div class="kartu-data-value">
              ${escapeHTML(id || nisn || "-")}
            </div>


          </div>


          <!-- QR / BARCODE -->
          
          <div class="kartu-qr-area">


            <div class="kartu-qr">

              <img
                src="${qrUrl}"
                alt="QR ${escapeAttr(nama)}"
                loading="lazy"
              >

            </div>


            <div class="kartu-qr-caption">

              Scan untuk presensi

            </div>


          </div>


        </div>


        <!-- FOOTER -->

        <div class="kartu-footer">

          Kartu identitas siswa

        </div>


      </div>

    `;

  }


  /* =====================================================
     QR CODE
     
     MENGGUNAKAN SATU SUMBER SAJA
     
     Tidak memakai library QR kedua.
  ===================================================== */

  function buatQRUrl(
    data
  ) {


    const encoded =
      encodeURIComponent(
        data
      );


    return (
      "https://api.qrserver.com/v1/create-qr-code/" +
      "?size=300x300" +
      "&margin=5" +
      "&data=" +
      encoded
    );

  }


  /* =====================================================
     CETAK
  ===================================================== */

  function cetakKartu() {


    if (
      !siswaTampil.length
    ) {

      alert(
        "Tidak ada kartu siswa yang dapat dicetak."
      );

      return;

    }


    /*
     * Pastikan QR sudah selesai
     * dimuat sebelum print.
     */

    const images =
      Array.from(
        document.querySelectorAll(
          ".kartu-qr img"
        )
      );


    const belumSiap =
      images.filter(
        function (img) {

          return !img.complete;

        }
      );


    if (
      belumSiap.length
    ) {

      alert(
        "QR sedang dimuat. Tunggu sebentar lalu klik Cetak kembali."
      );

      return;

    }


    window.print();

  }


  /* =====================================================
     ERROR
  ===================================================== */

  function showError(
    message
  ) {


    const container =
      document.getElementById(
        "kartuContainer"
      );


    if (!container) {

      return;

    }


    container.innerHTML = `

      <div
        class="kartu-empty"
        style="color:#b91c1c"
      >

        <i class="fa-solid fa-triangle-exclamation"></i>

        ${escapeHTML(
          message
        )}

      </div>

    `;

  }


  /* =====================================================
     HTML ESCAPE
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
     ATTRIBUTE ESCAPE
  ===================================================== */

  function escapeAttr(
    value
  ) {

    return escapeHTML(
      value
    );

  }


  /* =====================================================
     SORT
  ===================================================== */

  function naturalSort(
    a,
    b
  ) {

    return String(a)
      .localeCompare(
        String(b),
        "id",
        {
          numeric: true,
          sensitivity: "base"
        }
      );

  }


})();
