(function () {

  "use strict";


  const API_URL =
    "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";


  const currentUser =
    Auth.requireRole("GURU");


  let siswaList = [];
  let existingAttendance = {};


  document.addEventListener(
    "DOMContentLoaded",
    init
  );


  async function init() {

    document.getElementById(
      "tanggalPresensi"
    ).value =
      getToday();


    document
      .getElementById(
        "kelasPresensi"
      )
      .addEventListener(
        "change",
        loadSiswa
      );


    document
      .getElementById(
        "btnTampilkanSiswa"
      )
      .addEventListener(
        "click",
        loadSiswa
      );


    document
      .getElementById(
        "btnSimpanPresensi"
      )
      .addEventListener(
        "click",
        simpanSemua
      );


    await loadKelas();

  }


  async function loadKelas() {

    try {

      const result =
        await callAPI({

          action:
            "getKelasGuru",

          idGuru:
            currentUser.idGuru

        });


      if (!result.success) {
        throw new Error(result.message);
      }


      const select =
        document.getElementById(
          "kelasPresensi"
        );


      select.innerHTML = `
        <option value="">
          Pilih kelas
        </option>
      `;


      (result.data || []).forEach(
        kelas => {

          const option =
            document.createElement(
              "option"
            );


          option.value =
            kelas.NAMA_KELAS;


          option.textContent =
            kelas.NAMA_KELAS;


          select.appendChild(
            option
          );

        }
      );


      if (
        result.data &&
        result.data.length === 1
      ) {

        select.value =
          result.data[0].NAMA_KELAS;

        await loadSiswa();

      }

    } catch (error) {

      tampilkanPesan(
        error.message,
        "error"
      );

    }

  }


  async function loadSiswa() {

    const kelas =
      document.getElementById(
        "kelasPresensi"
      ).value;


    const tanggal =
      document.getElementById(
        "tanggalPresensi"
      ).value;


    if (!kelas) {

      document.getElementById(
        "presensiTableBody"
      ).innerHTML = `

        <tr>

          <td
            colspan="6"
            class="text-center"
          >
            Silakan pilih kelas.

          </td>

        </tr>

      `;

      return;

    }


    try {

      const siswaResult =
        await callAPI({

          action:
            "getSiswa",

          kelas:
            kelas,

          aktifOnly:
            true

        });


      if (!siswaResult.success) {
        throw new Error(
          siswaResult.message
        );
      }


      siswaList =
        siswaResult.data || [];


      const rekapResult =
        await callAPI({

          action:
            "getRekap",

          tanggal:
            tanggal,

          kelas:
            kelas

        });


      existingAttendance = {};


      if (rekapResult.success) {

        (rekapResult.data || [])
          .forEach(row => {

            const id =
              String(row.ID || "");

            existingAttendance[id] =
              String(
                row.STATUS || ""
              ).toUpperCase();

          });

      }


      renderTable();

    } catch (error) {

      tampilkanPesan(
        error.message,
        "error"
      );

    }

  }


  function renderTable() {

    const tbody =
      document.getElementById(
        "presensiTableBody"
      );


    if (!siswaList.length) {

      tbody.innerHTML = `

        <tr>

          <td
            colspan="6"
            class="text-center"
          >
            Tidak ada siswa aktif.

          </td>

        </tr>

      `;

      return;

    }


    tbody.innerHTML =
      siswaList.map(
        (siswa, index) => {

          const id =
            String(siswa.ID);


          const status =
            existingAttendance[id]
              || "HADIR";


          const sudahAda =
            Boolean(
              existingAttendance[id]
            );


          return `

            <tr>

              <td>
                ${index + 1}
              </td>

              <td>
                ${escapeHTML(
                  siswa.NISN
                )}
              </td>

              <td>
                ${escapeHTML(
                  siswa.NAMA
                )}
              </td>

              <td>
                ${escapeHTML(
                  siswa.KELAS
                )}
              </td>

              <td>
                ${escapeHTML(
                  siswa.JK
                )}
              </td>

              <td>

                <select
                  class="status-select"
                  data-id="${escapeHTML(id)}"
                  ${sudahAda ? "" : ""}
                >

                  <option
                    value="HADIR"
                    ${status === "HADIR" ? "selected" : ""}
                  >
                    HADIR
                  </option>

                  <option
                    value="IZIN"
                    ${status === "IZIN" ? "selected" : ""}
                  >
                    IZIN
                  </option>

                  <option
                    value="SAKIT"
                    ${status === "SAKIT" ? "selected" : ""}
                  >
                    SAKIT
                  </option>

                  <option
                    value="ALPA"
                    ${status === "ALPA" ? "selected" : ""}
                  >
                    ALPA
                  </option>

                </select>

                ${
                  sudahAda
                    ? `<small class="text-muted">
                        Sudah tersimpan
                       </small>`
                    : ""
                }

              </td>

            </tr>

          `;

        }
      ).join("");


    updateSummary();

  }


  async function simpanSemua() {

    const tanggal =
      document.getElementById(
        "tanggalPresensi"
      ).value;


    const kelas =
      document.getElementById(
        "kelasPresensi"
      ).value;


    if (!tanggal || !kelas) {

      tampilkanPesan(
        "Tanggal dan kelas wajib dipilih.",
        "error"
      );

      return;

    }


    if (!siswaList.length) {

      tampilkanPesan(
        "Tidak ada siswa untuk disimpan.",
        "error"
      );

      return;

    }


    const selects =
      document.querySelectorAll(
        ".status-select"
      );


    const button =
      document.getElementById(
        "btnSimpanPresensi"
      );


    button.disabled = true;
    button.textContent =
      "Menyimpan...";


    let berhasil = 0;
    let dilewati = 0;
    let gagal = 0;


    try {

      for (const select of selects) {

        const id =
          select.dataset.id;


        if (existingAttendance[id]) {

          dilewati++;

          continue;

        }


        const siswa =
          siswaList.find(
            item =>
              String(item.ID) ===
              String(id)
          );


        if (!siswa) {

          gagal++;

          continue;

        }


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
                select.value,

              idGuru:
                currentUser.idGuru,

              sumber:
                "WEB",

              tanggal:
                tanggal

            });


          if (result.success) {

            berhasil++;

            existingAttendance[id] =
              select.value;

          } else {

            gagal++;

          }

        } catch (error) {

          gagal++;

          console.error(error);

        }

      }


      renderTable();


      tampilkanPesan(

        `Presensi selesai. Berhasil: ${berhasil}, dilewati: ${dilewati}, gagal: ${gagal}.`,

        gagal
          ? "error"
          : "success"

      );


    } finally {

      button.disabled = false;

      button.textContent =
        "Simpan Presensi";

    }

  }


  function updateSummary() {

    const summary =
      document.getElementById(
        "presensiSummary"
      );


    const counts = {

      HADIR: 0,
      IZIN: 0,
      SAKIT: 0,
      ALPA: 0

    };


    document
      .querySelectorAll(
        ".status-select"
      )
      .forEach(select => {

        if (counts[select.value] !== undefined) {

          counts[select.value]++;

        }

      });


    summary.innerHTML = `

      H: ${counts.HADIR}
      &nbsp; | &nbsp;
      I: ${counts.IZIN}
      &nbsp; | &nbsp;
      S: ${counts.SAKIT}
      &nbsp; | &nbsp;
      A: ${counts.ALPA}

    `;

  }


  document.addEventListener(
    "change",
    event => {

      if (
        event.target.classList.contains(
          "status-select"
        )
      ) {

        updateSummary();

      }

    }
  );


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


  function getToday() {

    const now =
      new Date();


    return [

      now.getFullYear(),

      String(
        now.getMonth() + 1
      ).padStart(2, "0"),

      String(
        now.getDate()
      ).padStart(2, "0")

    ].join("-");

  }


  function tampilkanPesan(
    message,
    type
  ) {

    const element =
      document.getElementById(
        "presensiMessage"
      );


    element.textContent =
      message;


    element.className =
      "message " +
      (
        type === "success"
          ? "message-success"
          : "message-error"
      );


    element.style.display =
      "block";


    setTimeout(() => {

      element.style.display =
        "none";

    }, 5000);

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
