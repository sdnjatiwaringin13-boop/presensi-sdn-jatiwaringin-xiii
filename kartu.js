"use strict";


(function () {


  let semuaSiswa = [];

  let siswaTampil = [];


  const $ =
    id =>
      document.getElementById(
        id
      );


  document.addEventListener(
    "DOMContentLoaded",
    init
  );


  /* =====================================================
     INIT
  ===================================================== */

  async function init() {

    bindEvents();

    await loadSiswa();

  }


  /* =====================================================
     EVENT
  ===================================================== */

  function bindEvents() {


    $("searchInput")
      ?.addEventListener(
        "input",
        renderSiswa
      );


    $("kelasFilter")
      ?.addEventListener(
        "change",
        renderSiswa
      );


    $("refreshButton")
      ?.addEventListener(
        "click",
        function () {

          loadSiswa(
            true
          );

        }
      );


    $("printButton")
      ?.addEventListener(
        "click",
        cetak
      );

  }


  /* =====================================================
     LOAD SISWA
  ===================================================== */

  async function loadSiswa(
    forceRefresh = false
  ) {


    const box =
      $("kartuContainer");


    if (box) {

      box.innerHTML = `

        <div class="loading">

          <i class="fa-solid fa-spinner fa-spin"></i>

          Memuat data siswa...

        </div>

      `;

    }


    try {


      /*
       * Ambil data siswa.
       *
       * Cache digunakan otomatis oleh api.js.
       */

      const result =
        await callAPI({

          action:
            "getSiswa",

          aktifOnly:
            true,

          forceRefresh:
            forceRefresh

        });


      console.log(
        "HASIL GET SISWA:",
        result
      );


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


      renderSiswa();


    } catch (error) {


      console.error(
        "KARTU SISWA:",
        error
      );


      if (box) {

        box.innerHTML = `

          <div class="empty">

            <i
              class="fa-solid fa-triangle-exclamation"
            ></i>

            <br>

            ${escapeHTML(
              error.message
            )}

          </div>

        `;

      }

    }

  }


  /* =====================================================
     KELAS
  ===================================================== */

  function loadKelas() {


    const select =
      $("kelasFilter");


    if (!select) {

      return;

    }


    const sebelumnya =
      select.value;


    const kelas =
      [
        ...new Set(

          semuaSiswa
            .map(
              s =>
                String(
                  s.KELAS ||
                  ""
                ).trim()
            )
            .filter(Boolean)

        )
      ]
      .sort(
        function (a, b) {

          return a.localeCompare(
            b,
            "id",
            {
              numeric: true
            }
          );

        }
      );


    select.innerHTML = `

      <option value="">
        Semua Kelas
      </option>

      ${
        kelas
          .map(
            function (kelas) {

              return `

                <option
                  value="${escapeAttr(kelas)}"
                >

                  ${escapeHTML(kelas)}

                </option>

              `;

            }
          )
          .join("")

      }

    `;


    if (
      kelas.includes(
        sebelumnya
      )
    ) {

      select.value =
        sebelumnya;

    }

  }


  /* =====================================================
     FILTER
  ===================================================== */

  function renderSiswa() {


    const box =
      $("kartuContainer");


    if (!box) {

      return;

    }


    const query =
      String(
        $("searchInput")
          ?.value ||
        ""
      )
        .trim()
        .toLowerCase();


    const kelas =
      String(
        $("kelasFilter")
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
            !query ||
            nama.includes(
              query
            ) ||
            nisn.includes(
              query
            );


          const cocokKelas =
            !kelas ||
            String(
              siswa.KELAS ||
              ""
            ).trim() ===
            kelas;


          return (
            cocokSearch &&
            cocokKelas
          );

        }
      );


    if (
      !siswaTampil.length
    ) {

      box.innerHTML = `

        <div class="empty">

          <i class="fa-solid fa-user-slash"></i>

          <br><br>

          Data siswa tidak ditemukan.

        </div>

      `;

      return;

    }


    /*
     * Render HTML kartu.
     */

    box.innerHTML =
      siswaTampil
        .map(
          function (
            siswa,
            index
          ) {

            return buatKartu(
              siswa,
              index
            );

          }
        )
        .join("");


    /*
     * Buat QR setelah HTML selesai.
     */

    siswaTampil.forEach(
      function (
        siswa,
        index
      ) {

        buatQR(
          siswa,
          index
        );

      }
    );

  }


  /* =====================================================
     BUAT KARTU
  ===================================================== */

  function buatKartu(
    siswa,
    index
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


    const qrId =
      "qr_" +
      index;


    return `

      <article
        class="student-card"
      >


        <div
          class="student-card-head"
        >


          <div
            class="school-mark"
          >

            SD

          </div>


          <div>

            <strong>
              SD NEGERI JATIWARINGIN XIII
            </strong>

            <small>
              KARTU IDENTITAS SISWA
            </small>

          </div>


        </div>


        <div
          class="student-card-body"
        >


          <div
            class="student-info"
          >


            <h3>

              ${escapeHTML(
                nama
              )}

            </h3>


            <p>

              <b>
                NISN
              </b>

              <span>
                ${escapeHTML(
                  nisn ||
                  "-"
                )}
              </span>

            </p>


            <p>

              <b>
                Kelas
              </b>

              <span>
                ${escapeHTML(
                  kelas
                )}
              </span>

            </p>


            <p>

              <b>
                JK
              </b>

              <span>
                ${escapeHTML(
                  jk
                )}
              </span>

            </p>


            <p>

              <b>
                ID
              </b>

              <span>
                ${escapeHTML(
                  id ||
                  nisn ||
                  "-"
                )}
              </span>

            </p>


          </div>


          <div
            class="qr-wrap"
          >


            <div
              id="${qrId}"
              class="qr-code"
            ></div>


            <small>
              Scan untuk presensi
            </small>


          </div>


        </div>


      </article>

    `;

  }


  /* =====================================================
     BUAT QR
  ===================================================== */

  function buatQR(
    siswa,
    index
  ) {


    const element =
      document.getElementById(
        "qr_" +
        index
      );


    if (!element) {

      return;

    }


    /*
     * QR hanya berisi data penting.
     */

    const data =
      JSON.stringify({

        id:
          String(
            siswa.ID ||
            ""
          ),

        nisn:
          String(
            siswa.NISN ||
            ""
          )

      });


    /*
     * Kalau library QRCode belum ada,
     * load otomatis.
     */

    if (
      typeof QRCode ===
      "undefined"
    ) {

      loadQRCodeLibrary(
        function () {

          buatQR(
            siswa,
            index
          );

        }
      );

      return;

    }


    element.innerHTML =
      "";


    new QRCode(
      element,
      {

        text:
          data,

        width:
          160,

        height:
          160,

        colorDark:
          "#000000",

        colorLight:
          "#ffffff",

        correctLevel:
          QRCode.CorrectLevel.M

      }
    );

  }


  /* =====================================================
     LOAD QR LIBRARY
  ===================================================== */

  let qrLibraryLoading =
    false;

  const qrCallbacks =
    [];


  function loadQRCodeLibrary(
    callback
  ) {


    if (
      typeof QRCode !==
      "undefined"
    ) {

      callback();

      return;

    }


    qrCallbacks.push(
      callback
    );


    if (
      qrLibraryLoading
    ) {

      return;

    }


    qrLibraryLoading =
      true;


    const script =
      document.createElement(
        "script"
      );


    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";


    script.onload =
      function () {


        qrLibraryLoading =
          false;


        const callbacks =
          qrCallbacks.splice(
            0
          );


        callbacks.forEach(
          cb =>
            cb()
        );

      };


    script.onerror =
      function () {


        qrLibraryLoading =
          false;


        console.error(
          "Library QRCode gagal dimuat."
        );


        qrCallbacks.length =
          0;

      };


    document.head.appendChild(
      script
    );

  }


  /* =====================================================
     CETAK
  ===================================================== */

  function cetak() {


    if (
      !siswaTampil.length
    ) {

      alert(
        "Tidak ada kartu yang dapat dicetak."
      );

      return;

    }


    window.print();

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


  function escapeAttr(
    value
  ) {

    return escapeHTML(
      value
    );

  }


})();
