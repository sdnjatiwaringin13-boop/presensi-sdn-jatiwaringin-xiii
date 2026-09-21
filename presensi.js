"use strict";

(function () {

  let semuaSiswa = [];
  let siswaTampil = [];
  let presensiHariIni = new Map();
  let user = null;

  const $ = id => document.getElementById(id);

  document.addEventListener("DOMContentLoaded", init);


  /* =========================================================
     INIT
  ========================================================= */

  async function init() {

    try {

      user = Auth.requireRole(["ADMIN", "GURU"]);

      if (!user) {
        return;
      }

      bindEvents();

      await Promise.all([
        loadKelas(),
        loadData()
      ]);

    } catch (error) {

      showMessage(
        error.message || "Gagal membuka halaman presensi.",
        "error"
      );

    }

  }


  /* =========================================================
     EVENT
  ========================================================= */

  function bindEvents() {

    $("kelasSelect")?.addEventListener(
      "change",
      filterSiswa
    );

    $("searchInput")?.addEventListener(
      "input",
      filterSiswa
    );

    $("refreshButton")?.addEventListener(
      "click",
      async function () {

        const button = $("refreshButton");

        if (button) {
          button.disabled = true;
          button.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Memuat...';
        }

        try {

          await loadData();

          showMessage(
            "Data presensi berhasil diperbarui.",
            "success"
          );

        } catch (error) {

          showMessage(
            error.message,
            "error"
          );

        } finally {

          if (button) {

            button.disabled = false;

            button.innerHTML =
              '<i class="fa-solid fa-rotate"></i> Refresh';

          }

        }

      }
    );

    $("simpanButton")?.addEventListener(
      "click",
      simpanSemua
    );

  }


  /* =========================================================
     LOAD KELAS
  ========================================================= */

  async function loadKelas() {

    const select = $("kelasSelect");

    if (!select) {
      return;
    }

    try {

      const role =
        String(
          Auth.getRole(user) || ""
        ).toUpperCase();


      let result;


      if (role === "GURU") {

        result =
          await callAPI({
            action: "getKelasGuru",
            idGuru: user.idGuru
          });

      } else {

        result =
          await callAPI({
            action: "getKelas"
          });

      }


      if (!result.success) {

        throw new Error(
          result.message ||
          "Gagal mengambil data kelas."
        );

      }


      const data =
        Array.isArray(result.data)
          ? result.data
          : [];


      select.innerHTML =
        '<option value="">Semua Kelas</option>';


      data.forEach(function (item) {

        const nama =
          String(
            item.NAMA_KELAS || ""
          ).trim();

        if (!nama) {
          return;
        }


        const option =
          document.createElement("option");

        option.value = nama;
        option.textContent = nama;

        select.appendChild(option);

      });


    } catch (error) {

      select.innerHTML =
        '<option value="">Gagal memuat kelas</option>';

      throw error;

    }

  }


  /* =========================================================
     LOAD DATA
  ========================================================= */

  async function loadData() {

    const table =
      $("siswaTable");


    if (table) {

      table.innerHTML = `
        <tr>
          <td colspan="7" class="loading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            Memuat data siswa...
          </td>
        </tr>
      `;

    }


    const role =
      String(
        Auth.getRole(user) || ""
      ).toUpperCase();


    try {

      const today =
        localDate();


      /*
       * Ambil siswa dan presensi hari ini
       * secara bersamaan.
       */

      const [
        siswaResult,
        rekapResult
      ] = await Promise.all([

        callAPI({
          action: "getSiswa",
          aktifOnly: true
        }),

        callAPI({
          action: "getRekap",
          tanggal: today,

          idGuru:
            role === "GURU"
              ? user.idGuru
              : ""
        })

      ]);


      if (!siswaResult.success) {

        throw new Error(
          siswaResult.message ||
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
       * Untuk GURU, hanya tampilkan kelas
       * yang menjadi tanggung jawabnya.
       */

      if (role === "GURU") {

        const kelasResult =
          await callAPI({
            action: "getKelasGuru",
            idGuru: user.idGuru
          });


        if (!kelasResult.success) {

          throw new Error(
            kelasResult.message ||
            "Gagal mengambil kelas guru."
          );

        }


        const kelasGuru =
          Array.isArray(
            kelasResult.data
          )
            ? kelasResult.data
            : [];


        const allowed =
          new Set(
            kelasGuru.map(
              item =>
                String(
                  item.NAMA_KELAS || ""
                ).trim()
            )
          );


        semuaSiswa =
          semuaSiswa.filter(
            siswa =>
              allowed.has(
                String(
                  siswa.KELAS || ""
                ).trim()
              )
          );

      }


      /*
       * Simpan presensi hari ini
       * ke Map agar pencarian sangat cepat.
       */

      presensiHariIni =
        new Map();


      if (
        rekapResult &&
        rekapResult.success &&
        Array.isArray(rekapResult.data)
      ) {

        rekapResult.data.forEach(
          function (item) {

            if (!item.ID) {
              return;
            }

            presensiHariIni.set(
              String(item.ID),
              item
            );

          }
        );

      }


      filterSiswa();


    } catch (error) {

      if (table) {

        table.innerHTML = `
          <tr>
            <td
              colspan="7"
              class="error"
            >
              ${escapeHTML(
                error.message ||
                "Gagal memuat data."
              )}
            </td>
          </tr>
        `;

      }

      throw error;

    }

  }


  /* =========================================================
     FILTER SISWA
  ========================================================= */

  function filterSiswa() {

    const kelas =
      String(
        $("kelasSelect")?.value || ""
      ).trim();


    const keyword =
      String(
        $("searchInput")?.value || ""
      )
        .toLowerCase()
        .trim();


    siswaTampil =
      semuaSiswa.filter(
        function (siswa) {

          const cocokKelas =
            !kelas ||
            String(
              siswa.KELAS || ""
            ).trim() === kelas;


          const nisn =
            String(
              siswa.NISN || ""
            ).toLowerCase();


          const nama =
            String(
              siswa.NAMA || ""
            ).toLowerCase();


          const cocokCari =
            !keyword ||
            nisn.includes(keyword) ||
            nama.includes(keyword);


          return (
            cocokKelas &&
            cocokCari
          );

        }
      );


    renderSiswa();

  }


  /* =========================================================
     RENDER SISWA
  ========================================================= */

  function renderSiswa() {

    const table =
      $("siswaTable");

    if (!table) {
      return;
    }


    if (!siswaTampil.length) {

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

      updateCounter();

      return;

    }


    const fragment =
      document.createDocumentFragment();


    siswaTampil.forEach(
      function (siswa, index) {

        const existing =
          presensiHariIni.get(
            String(siswa.ID)
          );


        const status =
          existing &&
          existing.STATUS
            ? String(
                existing.STATUS
              ).toUpperCase()
            : "HADIR";


        const saved =
          Boolean(existing);


        const tr =
          document.createElement("tr");


        tr.dataset.siswa =
          String(siswa.ID);


        tr.innerHTML = `

          <td>
            ${index + 1}
          </td>

          <td>
            ${escapeHTML(
              siswa.NISN || "-"
            )}
          </td>

          <td>
            ${escapeHTML(
              siswa.NAMA || "-"
            )}
          </td>

          <td>
            ${escapeHTML(
              siswa.KELAS || "-"
            )}
          </td>

          <td>
            ${escapeHTML(
              siswa.JK || "-"
            )}
          </td>

          <td>

            <select
              class="status-presensi"
              data-id="${escapeAttr(
                siswa.ID
              )}"
            >

              <option
                value="HADIR"
                ${status === "HADIR"
                  ? "selected"
                  : ""}
              >
                Hadir
              </option>

              <option
                value="IZIN"
                ${status === "IZIN"
                  ? "selected"
                  : ""}
              >
                Izin
              </option>

              <option
                value="SAKIT"
                ${status === "SAKIT"
                  ? "selected"
                  : ""}
              >
                Sakit
              </option>

              <option
                value="ALPA"
                ${status === "ALPA"
                  ? "selected"
                  : ""}
              >
                Alpa
              </option>

            </select>

          </td>

          <td>

            <button
              type="button"
              class="
                btn
                btn-sm
                ${saved
                  ? "btn-success"
                  : "btn-primary"}
              "
              data-simpan="${escapeAttr(
                siswa.ID
              )}"
            >

              ${saved
                ? "Tersimpan"
                : "Simpan"}

            </button>

          </td>

        `;


        const button =
          tr.querySelector(
            "[data-simpan]"
          );


        if (button) {

          button.addEventListener(
            "click",
            function () {

              simpanSatu(
                siswa.ID,
                button
              );

            }
          );

        }


        fragment.appendChild(tr);

      }
    );


    table.innerHTML = "";

    table.appendChild(
      fragment
    );


    updateCounter();

  }


  /* =========================================================
     SIMPAN SATU
     Tetap tersedia jika guru ingin
     menyimpan satu siswa saja.
  ========================================================= */

  async function simpanSatu(
    id,
    button
  ) {

    const siswa =
      semuaSiswa.find(
        item =>
          String(item.ID) ===
          String(id)
      );


    if (!siswa) {

      showMessage(
        "Data siswa tidak ditemukan.",
        "error"
      );

      return false;

    }


    const row =
      button?.closest("tr");


    const select =
      row?.querySelector(
        ".status-presensi"
      );


    const status =
      String(
        select?.value || "HADIR"
      ).toUpperCase();


    setButtonLoading(
      button,
      true
    );


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
            status,

          idGuru:
            user.idGuru || "",

          sumber:
            "MANUAL"

        });


      if (!result.success) {

        throw new Error(
          result.message ||
          "Presensi gagal disimpan."
        );

      }


      presensiHariIni.set(
        String(siswa.ID),
        {
          ID:
            siswa.ID,

          STATUS:
            status,

          TANGGAL:
            localDate()
        }
      );


      setButtonSaved(
        button
      );


      showMessage(
        `${siswa.NAMA}: presensi berhasil disimpan.`,
        "success"
      );


      updateCounter();


      return true;


    } catch (error) {

      setButtonFailed(
        button
      );


      showMessage(
        `${siswa.NAMA}: ${
          error.message ||
          "Gagal menyimpan."
        }`,
        "error"
      );


      return false;

    }

  }


  /* =========================================================
     SIMPAN SEMUA
     
     SEKARANG HANYA 1 REQUEST.
     
     Tidak ada lagi:
       Promise.all(...5 request...)
  ========================================================= */

  async function simpanSemua() {

    const mainButton =
      $("simpanButton");


    if (
      !siswaTampil.length
    ) {

      showMessage(
        "Tidak ada siswa yang dapat disimpan.",
        "error"
      );

      return;

    }


    const data =
      siswaTampil.map(
        function (siswa) {

          const row =
            document.querySelector(
              `tr[data-siswa="${CSS.escape(
                String(siswa.ID)
              )}"]`
            );


          const select =
            row?.querySelector(
              ".status-presensi"
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
              String(
                select?.value ||
                "HADIR"
              ).toUpperCase(),

            idGuru:
              user.idGuru || "",

            sumber:
              "MANUAL"

          };

        }
      );


    if (!data.length) {

      showMessage(
        "Tidak ada data presensi.",
        "error"
      );

      return;

    }


    /*
     * Loading semua tombol.
     */

    const buttons =
      Array.from(
        document.querySelectorAll(
          "[data-simpan]"
        )
      );


    buttons.forEach(
      function (button) {

        button.disabled = true;
        button.textContent =
          "Menyimpan...";

      }
    );


    if (mainButton) {

      mainButton.disabled = true;

      mainButton.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

    }


    try {

      showMessage(
        `Menyimpan ${data.length} siswa...`,
        "info"
      );


      /*
       * SATU REQUEST KE APPS SCRIPT
       */

      const result =
        await callAPI({

          action:
            "simpanPresensiBatch",

          data:
            data

        });


      if (!result.success) {

        throw new Error(
          result.message ||
          "Gagal menyimpan presensi."
        );

      }


      /*
       * Update data lokal.
       */

      data.forEach(
        function (item) {

          presensiHariIni.set(
            String(item.id),
            {
              ID:
                item.id,

              STATUS:
                item.status,

              TANGGAL:
                localDate()
            }
          );

        }
      );


      /*
       * Update tombol.
       */

      buttons.forEach(
        function (button) {

          button.disabled = false;

          button.textContent =
            "Tersimpan";

          button.classList.remove(
            "btn-primary"
          );

          button.classList.add(
            "btn-success"
          );

        }
      );


      const berhasil =
        Number(
          result.berhasil || 0
        );


      const gagal =
        Number(
          result.gagal || 0
        );


      showMessage(
        `Selesai. Berhasil: ${berhasil}. Gagal: ${gagal}.`,
        gagal > 0
          ? "error"
          : "success"
      );


      updateCounter();


    } catch (error) {

      buttons.forEach(
        function (button) {

          button.disabled = false;

          button.textContent =
            "Simpan";

        }
      );


      showMessage(
        error.message ||
        "Gagal menyimpan presensi.",
        "error"
      );

    } finally {

      if (mainButton) {

        mainButton.disabled = false;

        mainButton.innerHTML =
          "Simpan Semua";

      }

    }

  }


  /* =========================================================
     BUTTON HELPERS
  ========================================================= */

  function setButtonLoading(
    button,
    loading
  ) {

    if (!button) {
      return;
    }


    if (loading) {

      button.disabled = true;

      button.dataset.oldText =
        button.textContent;

      button.textContent =
        "Menyimpan...";

    } else {

      button.disabled = false;

      button.textContent =
        button.dataset.oldText ||
        "Simpan";

    }

  }


  function setButtonSaved(
    button
  ) {

    if (!button) {
      return;
    }


    button.disabled = false;

    button.textContent =
      "Tersimpan";


    button.classList.remove(
      "btn-primary"
    );


    button.classList.add(
      "btn-success"
    );

  }


  function setButtonFailed(
    button
  ) {

    if (!button) {
      return;
    }


    button.disabled = false;

    button.textContent =
      "Gagal";


    button.classList.remove(
      "btn-success"
    );


    button.classList.add(
      "btn-primary"
    );

  }


  /* =========================================================
     COUNTER
  ========================================================= */

  function updateCounter() {

    const element =
      $("presensiCounter");


    if (!element) {
      return;
    }


    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alpa = 0;


    siswaTampil.forEach(
      function (siswa) {

        const row =
          document.querySelector(
            `tr[data-siswa="${CSS.escape(
              String(siswa.ID)
            )}"]`
          );


        const select =
          row?.querySelector(
            ".status-presensi"
          );


        const status =
          String(
            select?.value || ""
          ).toUpperCase();


        if (status === "HADIR") {
          hadir++;
        }

        if (status === "SAKIT") {
          sakit++;
        }

        if (status === "IZIN") {
          izin++;
        }

        if (status === "ALPA") {
          alpa++;
        }

      }
    );


    element.textContent =
      `Hadir: ${hadir} | Sakit: ${sakit} | Izin: ${izin} | Alpa: ${alpa}`;

  }


  /* =========================================================
     MESSAGE
  ========================================================= */

  function showMessage(
    message,
    type = "info"
  ) {

    const element =
      $("presensiMessage");


    if (!element) {
      return;
    }


    element.textContent =
      message;


    element.className =
      `alert alert-${type}`;


    element.style.display =
      "block";

  }


  /* =========================================================
     DATE
  ========================================================= */

  function localDate(
    date = new Date()
  ) {

    return [

      date.getFullYear(),

      String(
        date.getMonth() + 1
      ).padStart(2, "0"),

      String(
        date.getDate()
      ).padStart(2, "0")

    ].join("-");

  }


})();
