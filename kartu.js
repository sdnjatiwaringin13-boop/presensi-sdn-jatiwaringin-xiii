(function () {

  "use strict";


  const API_URL =
    "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";


  Auth.requireRole("ADMIN");


  let siswaList = [];


  document.addEventListener(
    "DOMContentLoaded",
    init
  );


  async function init() {

    document
      .getElementById(
        "kartuKelas"
      )
      .addEventListener(
        "change",
        renderKartu
      );


    document
      .getElementById(
        "kartuSearch"
      )
      .addEventListener(
        "input",
        renderKartu
      );


    await loadData();

  }


  async function loadData() {

    try {

      const result =
        await callAPI({

          action:
            "getSiswa",

          aktifOnly:
            true

        });


      if (!result.success) {
        throw new Error(
          result.message
        );
      }


      siswaList =
        result.data || [];


      loadKelasFilter();


      renderKartu();


    } catch (error) {

      document.getElementById(
        "kartuContainer"
      ).innerHTML = `

        <div class="card">

          Gagal memuat data:
          ${escapeHTML(error.message)}

        </div>

      `;

    }

  }


  function loadKelasFilter() {

    const select =
      document.getElementById(
        "kartuKelas"
      );


    const kelasSet =
      new Set();


    siswaList.forEach(
      siswa => {

        if (siswa.KELAS) {
          kelasSet.add(
            String(siswa.KELAS)
          );
        }

      }
    );


    [...kelasSet]
      .sort()
      .forEach(kelas => {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          kelas;


        option.textContent =
          kelas;


        select.appendChild(
          option
        );

      });

  }


  function renderKartu() {

    const container =
      document.getElementById(
        "kartuContainer"
      );


    const kelas =
      document.getElementById(
        "kartuKelas"
      ).value;


    const keyword =
      document.getElementById(
        "kartuSearch"
      ).value
        .toLowerCase()
        .trim();


    const filtered =
      siswaList.filter(
        siswa => {

          const cocokKelas =
            !kelas ||
            String(siswa.KELAS) ===
            kelas;


          const teks = [

            siswa.NAMA,

            siswa.NISN,

            siswa.KELAS

          ]
            .join(" ")
            .toLowerCase();


          const cocokSearch =
            !keyword ||
            teks.includes(keyword);


          return (
            cocokKelas &&
            cocokSearch
          );

        }
      );


    if (!filtered.length) {

      container.innerHTML = `

        <div class="card">

          Tidak ada siswa yang ditemukan.

        </div>

      `;

      return;

    }


    container.innerHTML =
      filtered.map(
        siswa => {

          const safeId =
            escapeHTML(
              siswa.ID
            );


          return `

            <div class="student-card">

              <div class="student-card-header">

                <div>

                  <strong>
                    SD Negeri Jatiwaringin XIII
                  </strong>

                  <small>
                    KARTU PRESENSI SISWA
                  </small>

                </div>

              </div>


              <div class="student-card-body">

                <div class="student-card-info">

                  <div>

                    <span>Nama</span>

                    <strong>
                      ${escapeHTML(
                        siswa.NAMA
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>NISN</span>

                    <strong>
                      ${escapeHTML(
                        siswa.NISN
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>Kelas</span>

                    <strong>
                      ${escapeHTML(
                        siswa.KELAS
                      )}
                    </strong>

                  </div>

                </div>


                <div
                  class="student-qr"
                  id="qr-${safeId}"
                ></div>

              </div>


              <div class="student-card-footer">

                Tunjukkan QR Code
                kepada petugas/guru
                saat presensi.

              </div>

            </div>

          `;

        }
      ).join("");


    filtered.forEach(
      siswa => {

        const element =
          document.getElementById(
            "qr-" +
            String(siswa.ID)
          );


        if (!element) return;


        new QRCode(
          element,
          {

            text:
              String(siswa.ID),

            width:
              110,

            height:
              110,

            correctLevel:
              QRCode.CorrectLevel.H

          }
        );

      }
    );

  }


  async function callAPI(payload) {

    const response =
      await fetch(
        API_URL,
        {

          method:
            "POST",

          headers: {
            "Content-Type":
              "text/plain;charset=utf-8"
          },

          body:
            JSON.stringify(payload)

        }
      );


    return await response.json();

  }


  function escapeHTML(value) {

    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }

})();
