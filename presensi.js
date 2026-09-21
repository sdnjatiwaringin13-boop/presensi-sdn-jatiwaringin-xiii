"use strict";

(function () {

  let semuaSiswa = [];
  let siswaTampil = [];
  let presensiHariIni = new Map();
  let user = null;
  let sedangMemuat = false;
  let sedangMenyimpan = false;

  const $ = (id) =>
    document.getElementById(id);


  /* =====================================================
     INIT
  ===================================================== */

  document.addEventListener(
    "DOMContentLoaded",
    init
  );


  async function init() {

    try {

      user =
        Auth.requireRole([
          "ADMIN",
          "GURU"
        ]);

      if (!user) return;


      bindEvents();


      await Promise.all([
        loadKelas(),
        loadData()
      ]);


    } catch (error) {

      console.error(
        "INIT PRESENSI:",
        error
      );

      showMessage(
        error.message ||
        "Gagal membuka halaman presensi.",
        "error"
      );

    }

  }


  /* =====================================================
     EVENT
  ===================================================== */

  function bindEvents() {

    $("kelasSelect")
      ?.addEventListener(
        "change",
        filterSiswa
      );


    $("searchInput")
      ?.addEventListener(
        "input",
        filterSiswa
      );


    $("refreshButton")
      ?.addEventListener(
        "click",
        refreshData
      );


    $("simpanButton")
      ?.addEventListener(
        "click",
        simpanSemua
      );

  }


  /* =====================================================
     LOAD KELAS
  ===================================================== */

  async function loadKelas() {

    const select =
      $("kelasSelect");


    if (!select) return;


    try {

      select.disabled = true;


      let result;


      if (
        String(
          Auth.getRole(user)
        ).toUpperCase() === "GURU"
      ) {

        result =
          await callAPI({

            action:
              "getKelasGuru",

            idGuru:
              user.idGuru || ""

          });

      } else {

        result =
          await callAPI({

            action:
              "getKelas"

          });

      }


      if (
        !result ||
        !result.success
      ) {

        throw new Error(
          result?.message ||
          "Gagal mengambil data kelas."
        );

      }


      const data =
        Array.isArray(
          result.data
        )
          ? result.data
          : [];


      const kelasMap =
        new Map();


      data.forEach(
        function (item) {

          const nama =
            String(
              item.NAMA_KELAS ||
              ""
            ).trim();


          if (nama) {

            kelasMap.set(
              nama,
              nama
            );

          }

        }
      );


      select.innerHTML =
        `<option value="">
          Semua Kelas
        </option>` +
        Array.from(
          kelasMap.values()
        )
          .sort(
            naturalSort
          )
          .map(
            function (nama) {

              return `
                <option value="${escapeAttr(nama)}">
                  ${escapeHTML(nama)}
                </option>
              `;

            }
          )
          .join("");


    } catch (error) {

      console.error(
        "LOAD KELAS:",
        error
      );


      select.innerHTML =
        `<option value="">
          Gagal memuat kelas
        </option>`;


      showMessage(
        "Gagal memuat kelas: " +
        error.message,
        "error"
      );


    } finally {

      select.disabled = false;

    }

  }


  /* =====================================================
     LOAD DATA SISWA + PRESENSI HARI INI
  ===================================================== */

  async function loadData(
    forceRefresh = false
  ) {

    if (sedangMemuat) {
      return;
    }


    sedangMemuat = true;


    const table =
      $("siswaTable");


    if (table) {

      table.innerHTML = `
        <tr>
          <td
            colspan="7"
            class="loading"
          >
            Memuat data siswa...
          </td>
        </tr>
      `;

    }


    try {

      const tanggal =
        localDate();


      const role =
        String(
          Auth.getRole(user)
        ).toUpperCase();


      /*
       * Ambil siswa dan presensi
       * secara bersamaan.
       */

      const [
        siswaResult,
        rekapResult
      ] = await Promise.all([

        callAPI({

          action:
            "getSiswa",

          aktifOnly:
            true,

          forceRefresh:
            forceRefresh

        }),

        callAPI({

          action:
            "getRekap",

          tanggal:
            tanggal,

          idGuru:
            role === "GURU"
              ? user.idGuru || ""
              : "",

          forceRefresh:
            forceRefresh

        })

      ]);


      if (
        !siswaResult ||
        !siswaResult.success
      ) {

        throw new Error(
          siswaResult?.message ||
          "Gagal mengambil data siswa."
        );

      }


      semuaSiswa =
        Array.isArray(
          siswaResult.data
        )
          ? siswaResult.data
          : [];


      /*
       * Jika user GURU,
       * hanya tampilkan kelas
       * yang menjadi tanggung jawabnya.
       */

      if (
        role === "GURU"
      ) {

        const kelasResult =
          await callAPI({

            action:
              "getKelasGuru",

            idGuru:
              user.idGuru || ""

          });


        if (
          kelasResult &&
          kelasResult.success
        ) {

          const allowed =
            new Set(
              (
                Array.isArray(
                  kelasResult.data
                )
                  ? kelasResult.data
                  : []
              )
                .map(
                  function (item) {

                    return String(
                      item.NAMA_KELAS ||
                      ""
                    ).trim();

                  }
                )
                .filter(Boolean)
            );


          semuaSiswa =
            semuaSiswa.filter(
              function (siswa) {

                return allowed.has(
                  String(
                    siswa.KELAS ||
                    ""
                  ).trim()
                );

              }
            );

        }

      }


      /*
       * Simpan presensi hari ini
       * dalam Map supaya render cepat.
       */

      presensiHariIni =
        new Map();


      if (
        rekapResult &&
        rekapResult.success &&
        Array.isArray(
          rekapResult.data
        )
      ) {

        rekapResult.data.forEach(
          function (item) {

            const id =
              String(
                item.ID ||
                ""
              ).trim();


            if (id) {

              presensiHariIni.set(
                id,
                item
              );

            }

          }
        );

      }


      filterSiswa();


      updateCounter();


    } catch (error) {

      console.error(
        "LOAD DATA:",
        error
      );


      if (table) {

        table.innerHTML = `
          <tr>
            <td
              colspan="7"
              class="error"
            >
              Gagal memuat data:
              <br>
              ${escapeHTML(
                error.message ||
                "Terjadi kesalahan."
              )}
            </td>
          </tr>
        `;

      }


      showMessage(
        error.message ||
        "Gagal memuat data.",
        "error"
      );


    } finally {

      sedangMemuat = false;

    }

  }


  /* =====================================================
     REFRESH
  ===================================================== */

  async function refreshData() {

    if (
      sedangMemuat ||
      sedangMenyimpan
    ) {
      return;
    }


    await loadData(
      true
    );

  }


  /* =====================================================
     FILTER
  ===================================================== */

  function filterSiswa() {

    const kelas =
      String(
        $("kelasSelect")
          ?.value ||
        ""
      ).trim();


    const keyword =
      String(
        $("searchInput")
          ?.value ||
        ""
      )
        .toLowerCase()
        .trim();


    siswaTampil =
      semuaSiswa.filter(
        function (siswa) {

          const cocokKelas =
            !kelas ||
            String(
              siswa.KELAS ||
              ""
            ).trim() === kelas;


          const nisn =
            String(
              siswa.NISN ||
              ""
            )
              .toLowerCase();


          const nama =
            String(
              siswa.NAMA ||
              ""
            )
              .toLowerCase();


          const cocokSearch =
            !keyword ||
            nisn.includes(
              keyword
            ) ||
            nama.includes(
              keyword
            );


          return (
            cocokKelas &&
            cocokSearch
          );

        }
      );


    renderSiswa();


    updateCounter();

  }


  /* =====================================================
     RENDER SISWA
  ===================================================== */

  function renderSiswa() {

    const table =
      $("siswaTable");


    if (!table) return;


    if (
      !siswaTampil.length
    ) {

      table.innerHTML = `
        <tr>
          <td
            colspan="7"
            class="empty"
          >
            Tidak ada siswa.
          </td>
        </tr>
      `;


      return;

    }


    table.innerHTML =
      siswaTampil
        .map(
          function (siswa, index) {

            const id =
              String(
                siswa.ID ||
                ""
              );


            const existing =
              presensiHariIni.get(
                id
              );


            const status =
              normalizeStatus(
                existing?.STATUS ||
                "HADIR"
              );


            const saved =
              Boolean(
                existing
              );


            return `
              <tr
                data-siswa="${escapeAttr(id)}"
              >

                <td>
                  ${index + 1}
                </td>

                <td>
                  ${escapeHTML(
                    siswa.NISN ||
                    "-"
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    siswa.NAMA ||
                    "-"
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    siswa.KELAS ||
                    "-"
                  )}
                </td>

                <td>
                  ${escapeHTML(
                    siswa.JK ||
                    "-"
                  )}
                </td>

                <td>

                  <select
                    class="status-presensi"
                    data-id="${escapeAttr(id)}"
                  >

                    <option
                      value="HADIR"
                      ${
                        status === "HADIR"
                          ? "selected"
                          : ""
                      }
                    >
                      Hadir
                    </option>

                    <option
                      value="IZIN"
                      ${
                        status === "IZIN"
                          ? "selected"
                          : ""
                      }
                    >
                      Izin
                    </option>

                    <option
                      value="SAKIT"
                      ${
                        status === "SAKIT"
                          ? "selected"
                          : ""
                      }
                    >
                      Sakit
                    </option>

                    <option
                      value="ALPA"
                      ${
                        status === "ALPA"
                          ? "selected"
                          : ""
                      }
                    >
                      Alpa
                    </option>

                  </select>

                </td>

                <td>

                  <button
                    type="button"
                    class="btn ${
                      saved
                        ? "btn-success"
                        : "btn-primary"
                    } btn-sm"
                    data-simpan="${escapeAttr(id)}"
                  >
                    ${
                      saved
                        ? "Tersimpan"
                        : "Simpan"
                    }
                  </button>

                </td>

              </tr>
            `;

          }
        )
        .join("");


    /*
     * Event tombol simpan per siswa.
     */

    table
      .querySelectorAll(
        "[data-simpan]"
      )
      .forEach(
        function (button) {

          button.addEventListener(
            "click",
            function () {

              simpanSatu(
                button.dataset.simpan,
                button
              );

            }
          );

        }
      );

  }


  /* =====================================================
     SIMPAN SEMUA
     VERSI BATCH
  ===================================================== */

  async function simpanSemua() {

    if (sedangMenyimpan) {
      return;
    }


    if (
      !siswaTampil.length
    ) {

      showMessage(
        "Tidak ada siswa yang dapat disimpan.",
        "error"
      );

      return;

    }


    const mainButton =
      $("simpanButton");


    sedangMenyimpan =
      true;


    if (mainButton) {

      mainButton.disabled =
        true;

      mainButton.innerHTML =
        `
          <i class="fa-solid fa-spinner fa-spin"></i>
          Menyimpan...
        `;

    }


    /*
     * Ambil data status dari tabel.
     */

    const data =
      siswaTampil.map(
        function (siswa) {

          const id =
            String(
              siswa.ID ||
              ""
            );


          const row =
            document.querySelector(
              `tr[data-siswa="${cssEscape(id)}"]`
            );


          const select =
            row?.querySelector(
              ".status-presensi"
            );


          const status =
            normalizeStatus(
              select?.value ||
              "HADIR"
            );


          return {

            id:
              siswa.ID,

            nisn:
              siswa.NISN,

            nama:
              siswa.NAMA,

            kelas:
              siswa.KELAS,

            status:
              status,

            idGuru:
              user?.idGuru ||
              "",

            sumber:
              "MANUAL"

          };

        }
      );


    /*
     * Pastikan semua data valid.
     */

    const validData =
      data.filter(
        function (item) {

          return (
            item.id &&
            item.nama &&
            item.status
          );

        }
      );


    if (
      !validData.length
    ) {

      showMessage(
        "Data presensi tidak valid.",
        "error"
      );


      selesaiSimpan(
        mainButton
      );


      return;

    }


    showMessage(
      `Sedang menyimpan ${validData.length} siswa...`,
      "info"
    );


    try {

      /*
       * SATU REQUEST untuk semua siswa.
       */

      const result =
        await callAPI({

          action:
            "simpanPresensiBatch",

          data:
            validData

        });


      console.log(
        "HASIL SIMPAN BATCH:",
        result
      );


      if (
        !result ||
        result.success !== true
      ) {

        throw new Error(
          result?.message ||
          "Server gagal menyimpan presensi."
        );

      }


      /*
       * Update cache lokal.
       */

      if (
        Array.isArray(
          result.data
        )
      ) {

        result.data.forEach(
          function (item) {

            const d =
              item.data ||
              item;


            const id =
              String(
                d.id ||
                item.id ||
                ""
              );


            if (!id) return;


            presensiHariIni.set(
              id,
              {

                ID:
                  id,

                STATUS:
                  d.status ||
                  item.status ||
                  "HADIR",

                JAM:
                  new Date()
                    .toLocaleTimeString(
                      "id-ID"
                    )

              }
            );

          }
        );

      }


      /*
       * Update tampilan tombol.
       */

      renderSiswa();


      updateCounter();


      const berhasil =
        Number(
          result.berhasil ||
          0
        );


      const gagal =
        Number(
          result.gagal ||
          0
        );


      if (
        gagal > 0
      ) {

        showMessage(
          `Selesai. Berhasil: ${berhasil}. Gagal: ${gagal}.`,
          "error"
        );


        /*
         * Tampilkan detail error
         * di console.
         */

        console.error(
          "DETAIL ERROR PRESENSI:",
          result.errors || []
        );

      } else {

        showMessage(
          `Presensi berhasil disimpan untuk ${berhasil} siswa.`,
          "success"
        );

      }


    } catch (error) {

      console.error(
        "SIMPAN SEMUA:",
        error
      );


      showMessage(
        "Presensi gagal disimpan: " +
        (
          error.message ||
          "Kesalahan server."
        ),
        "error"
      );

    } finally {

      selesaiSimpan(
        mainButton
      );

    }

  }


  /* =====================================================
     SIMPAN SATU SISWA
  ===================================================== */

  async function simpanSatu(
    id,
    button
  ) {

    if (sedangMenyimpan) {
      return;
    }


    const siswa =
      semuaSiswa.find(
        function (item) {

          return (
            String(
              item.ID
            ) ===
            String(id)
          );

        }
      );


    if (!siswa) {

      showMessage(
        "Data siswa tidak ditemukan.",
        "error"
      );

      return;

    }


    const row =
      button?.closest(
        "tr"
      );


    const select =
      row?.querySelector(
        ".status-presensi"
      );


    const status =
      normalizeStatus(
        select?.value ||
        "HADIR"
      );


    try {

      if (button) {

        button.disabled =
          true;

        button.innerHTML =
          `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Menyimpan...
          `;

      }


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
            status,

          idGuru:
            user?.idGuru ||
            "",

          sumber:
            "MANUAL"

        });


      if (
        !result ||
        result.success !== true
      ) {

        throw new Error(
          result?.message ||
          "Presensi gagal disimpan."
        );

      }


      /*
       * Update cache lokal.
       */

      presensiHariIni.set(
        String(
          siswa.ID
        ),
        {

          ID:
            siswa.ID,

          STATUS:
            status,

          JAM:
            new Date()
              .toLocaleTimeString(
                "id-ID"
              )

        }
      );


      if (button) {

        button.disabled =
          false;

        button.innerHTML =
          `
            <i class="fa-solid fa-check"></i>
            Tersimpan
          `;

        button.classList.remove(
          "btn-primary"
        );

        button.classList.add(
          "btn-success"
        );

      }


      updateCounter();


      showMessage(
        `${siswa.NAMA} berhasil disimpan.`,
        "success"
      );


    } catch (error) {

      console.error(
        "SIMPAN SATU:",
        error
      );


      if (button) {

        button.disabled =
          false;

        button.innerHTML =
          `
            <i class="fa-solid fa-xmark"></i>
            Gagal
          `;

        button.classList.remove(
          "btn-success"
        );

        button.classList.add(
          "btn-danger"
        );

      }


      showMessage(
        `${siswa.NAMA}: ${
          error.message ||
          "Gagal menyimpan."
        }`,
        "error"
      );

    }

  }


  /* =====================================================
     COUNTER
  ===================================================== */

  function updateCounter() {

    const counter =
      $("presensiCounter");


    if (!counter) return;


    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alpa = 0;


    siswaTampil.forEach(
      function (siswa) {

        const data =
          presensiHariIni.get(
            String(
              siswa.ID
            )
          );


        const status =
          normalizeStatus(
            data?.STATUS ||
            "HADIR"
          );


        if (
          status === "HADIR"
        ) {

          hadir++;

        } else if (
          status === "SAKIT"
        ) {

          sakit++;

        } else if (
          status === "IZIN"
        ) {

          izin++;

        } else if (
          status === "ALPA"
        ) {

          alpa++;

        }

      }
    );


    counter.innerHTML =
      `
        <strong>Hadir:</strong> ${hadir}
        |
        <strong>Sakit:</strong> ${sakit}
        |
        <strong>Izin:</strong> ${izin}
        |
        <strong>Alpa:</strong> ${alpa}
      `;

  }


  /* =====================================================
     MESSAGE
  ===================================================== */

  function showMessage(
    message,
    type
  ) {

    const element =
      $("presensiMessage");


    if (!element) return;


    element.textContent =
      message;


    element.className =
      "alert alert-" +
      (
        type ||
        "info"
      );


    element.style.display =
      "block";

  }


  /* =====================================================
     SELESAI SIMPAN
  ===================================================== */

  function selesaiSimpan(
    button
  ) {

    sedangMenyimpan =
      false;


    if (button) {

      button.disabled =
        false;

      button.innerHTML =
        `
          <i class="fa-solid fa-save"></i>
          Simpan Semua
        `;

    }

  }


  /* =====================================================
     NORMALIZE STATUS
  ===================================================== */

  function normalizeStatus(
    value
  ) {

    const status =
      String(
        value ||
        ""
      )
        .trim()
        .toUpperCase();


    if (
      [
        "HADIR",
        "SAKIT",
        "IZIN",
        "ALPA"
      ].includes(status)
    ) {

      return status;

    }


    return "HADIR";

  }


  /* =====================================================
     TANGGAL LOKAL INDONESIA
  ===================================================== */

  function localDate(
    date = new Date()
  ) {

    const year =
      date.getFullYear();


    const month =
      String(
        date.getMonth() + 1
      )
        .padStart(
          2,
          "0"
        );


    const day =
      String(
        date.getDate()
      )
        .padStart(
          2,
          "0"
        );


    return (
      year +
      "-" +
      month +
      "-" +
      day
    );

  }


  /* =====================================================
     SORT KELAS
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


  /* =====================================================
     CSS ESCAPE
  ===================================================== */

  function cssEscape(
    value
  ) {

    const text =
      String(
        value ||
        ""
      );


    if (
      window.CSS &&
      typeof CSS.escape ===
        "function"
    ) {

      return CSS.escape(
        text
      );

    }


    return text.replace(
      /([ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g,
      "\\$1"
    );

  }


})();
