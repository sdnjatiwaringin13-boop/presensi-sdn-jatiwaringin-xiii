(function () {

  "use strict";

  const API_URL =
    "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";

  Auth.requireRole("ADMIN");

  let kelasList = [];
  let guruList = [];

  document.addEventListener(
    "DOMContentLoaded",
    init
  );


  async function init() {

    document
      .getElementById("kelasForm")
      .addEventListener(
        "submit",
        simpanKelas
      );

    document
      .getElementById("btnBatalKelas")
      .addEventListener(
        "click",
        resetForm
      );

    await loadGuru();

    await loadKelas();

  }


  async function loadGuru() {

    try {

      const result =
        await callAPI({
          action: "getGuru"
        });

      if (!result.success) {
        throw new Error(result.message);
      }

      guruList =
        result.data || [];

      const select =
        document.getElementById(
          "kelasGuru"
        );

      select.innerHTML = `
        <option value="">
          Pilih wali kelas
        </option>
      `;

      guruList.forEach(guru => {

        const option =
          document.createElement("option");

        option.value =
          guru.ID_GURU;

        option.textContent =
          guru.NAMA;

        select.appendChild(option);

      });

    } catch (error) {

      tampilkanPesan(
        error.message,
        "error"
      );

    }

  }


  async function loadKelas() {

    try {

      const result =
        await callAPI({
          action: "getKelas"
        });

      if (!result.success) {
        throw new Error(result.message);
      }

      kelasList =
        result.data || [];

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
        "kelasTableBody"
      );


    if (!kelasList.length) {

      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center">
            Belum ada data kelas.
          </td>
        </tr>
      `;

      return;
    }


    tbody.innerHTML =
      kelasList.map(
        (kelas, index) => {

          const guru =
            guruList.find(
              item =>
                String(item.ID_GURU) ===
                String(kelas.ID_GURU)
            );


          return `

            <tr>

              <td>
                ${index + 1}
              </td>

              <td>
                ${escapeHTML(kelas.ID_KELAS)}
              </td>

              <td>
                ${escapeHTML(kelas.NAMA_KELAS)}
              </td>

              <td>
                ${escapeHTML(
                  guru
                    ? guru.NAMA
                    : kelas.ID_GURU || "-"
                )}
              </td>

              <td>
                ${escapeHTML(kelas.TAHUN_AJARAN)}
              </td>

              <td>

                <span class="status-badge ${
                  String(kelas.STATUS)
                    .toUpperCase() === "AKTIF"
                    ? "status-aktif"
                    : "status-nonaktif"
                }">

                  ${escapeHTML(kelas.STATUS)}

                </span>

              </td>

              <td>

                <div class="table-actions">

                  <button
                    class="btn btn-warning btn-small"
                    onclick="editKelas('${escapeJS(kelas.ID_KELAS)}')"
                  >
                    Edit
                  </button>

                  <button
                    class="btn btn-danger btn-small"
                    onclick="hapusKelas('${escapeJS(kelas.ID_KELAS)}')"
                  >
                    Hapus
                  </button>

                </div>

              </td>

            </tr>

          `;

        }
      ).join("");

  }


  async function simpanKelas(event) {

    event.preventDefault();


    const id =
      document.getElementById(
        "kelasId"
      ).value.trim();


    const data = {

      action:
        id
          ? "updateKelas"
          : "tambahKelas",

      idKelas:
        id,

      namaKelas:
        document.getElementById(
          "kelasNama"
        ).value.trim(),

      idGuru:
        document.getElementById(
          "kelasGuru"
        ).value,

      tahunAjaran:
        document.getElementById(
          "kelasTahun"
        ).value.trim(),

      status:
        document.getElementById(
          "kelasStatus"
        ).value

    };


    if (
      !data.namaKelas ||
      !data.idGuru ||
      !data.tahunAjaran
    ) {

      tampilkanPesan(
        "Data kelas belum lengkap.",
        "error"
      );

      return;

    }


    const button =
      document.getElementById(
        "btnSimpanKelas"
      );


    button.disabled = true;
    button.textContent =
      "Menyimpan...";


    try {

      const result =
        await callAPI(data);


      if (!result.success) {
        throw new Error(result.message);
      }


      tampilkanPesan(
        result.message ||
        "Data kelas berhasil disimpan.",
        "success"
      );


      resetForm();

      await loadKelas();


    } catch (error) {

      tampilkanPesan(
        error.message,
        "error"
      );

    } finally {

      button.disabled = false;

      button.textContent =
        "Simpan";

    }

  }


  window.editKelas =
    function (id) {

      const kelas =
        kelasList.find(
          item =>
            String(item.ID_KELAS) ===
            String(id)
        );


      if (!kelas) return;


      document.getElementById(
        "kelasId"
      ).value =
        kelas.ID_KELAS || "";


      document.getElementById(
        "kelasNama"
      ).value =
        kelas.NAMA_KELAS || "";


      document.getElementById(
        "kelasGuru"
      ).value =
        kelas.ID_GURU || "";


      document.getElementById(
        "kelasTahun"
      ).value =
        kelas.TAHUN_AJARAN || "";


      document.getElementById(
        "kelasStatus"
      ).value =
        kelas.STATUS || "AKTIF";


      document.getElementById(
        "formTitle"
      ).textContent =
        "Edit Kelas";


      document.getElementById(
        "btnBatalKelas"
      ).style.display =
        "inline-flex";


      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

    };


  window.hapusKelas =
    async function (id) {

      const kelas =
        kelasList.find(
          item =>
            String(item.ID_KELAS) ===
            String(id)
        );


      if (!kelas) return;


      const yakin =
        confirm(
          "Hapus kelas " +
          kelas.NAMA_KELAS +
          "?"
        );


      if (!yakin) return;


      try {

        const result =
          await callAPI({

            action:
              "hapusKelas",

            idKelas:
              id

          });


        if (!result.success) {
          throw new Error(result.message);
        }


        tampilkanPesan(
          result.message ||
          "Kelas berhasil dihapus.",
          "success"
        );


        await loadKelas();


      } catch (error) {

        tampilkanPesan(
          error.message,
          "error"
        );

      }

    };


  function resetForm() {

    document
      .getElementById(
        "kelasForm"
      )
      .reset();


    document.getElementById(
      "kelasId"
    ).value = "";


    document.getElementById(
      "kelasStatus"
    ).value =
      "AKTIF";


    document.getElementById(
      "formTitle"
    ).textContent =
      "Tambah Kelas";


    document.getElementById(
      "btnBatalKelas"
    ).style.display =
      "none";

  }


  async function callAPI(payload) {

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


    return await response.json();

  }


  function tampilkanPesan(
    message,
    type
  ) {

    const element =
      document.getElementById(
        "kelasMessage"
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

    }, 4000);

  }


  function escapeHTML(value) {

    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }


  function escapeJS(value) {

    return String(value ?? "")
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'");

  }

})();
