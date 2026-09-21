(function () {

  "use strict";


  const API_URL =
    "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";


  Auth.requireRole("ADMIN");


  let siswaList = [];
  let kelasList = [];


  document.addEventListener(
    "DOMContentLoaded",
    init
  );


  async function init() {

    document
      .getElementById("siswaForm")
      .addEventListener(
        "submit",
        simpanSiswa
      );


    document
      .getElementById("btnBatalSiswa")
      .addEventListener(
        "click",
        resetForm
      );


    document
      .getElementById("filterKelas")
      .addEventListener(
        "change",
        renderTable
      );


    document
      .getElementById("searchSiswa")
      .addEventListener(
        "input",
        renderTable
      );


    await loadKelas();

    await loadSiswa();

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


      const selects = [

        document.getElementById("siswaKelas"),

        document.getElementById("filterKelas")

      ];


      selects.forEach(select => {

        const firstOption =
          select.options[0].outerHTML;

        select.innerHTML =
          firstOption;


        kelasList.forEach(kelas => {

          const option =
            document.createElement("option");

          option.value =
            kelas.NAMA_KELAS;

          option.textContent =
            kelas.NAMA_KELAS;

          select.appendChild(option);

        });

      });

    } catch (error) {

      tampilkanPesan(
        error.message,
        "error"
      );

    }

  }


  async function loadSiswa() {

    try {

      const result =
        await callAPI({

          action: "getSiswa",

          aktifOnly: false

        });


      if (!result.success) {
        throw new Error(result.message);
      }


      siswaList =
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
        "siswaTableBody"
      );


    const filterKelas =
      document.getElementById(
        "filterKelas"
      ).value;


    const keyword =
      document.getElementById(
        "searchSiswa"
      ).value
        .toLowerCase()
        .trim();


    const filtered =
      siswaList.filter(siswa => {

        const cocokKelas =
          !filterKelas ||
          String(siswa.KELAS) === filterKelas;


        const teks = [

          siswa.NISN,

          siswa.NAMA,

          siswa.KELAS

        ]
          .join(" ")
          .toLowerCase();


        const cocokSearch =
          !keyword ||
          teks.includes(keyword);


        return cocokKelas && cocokSearch;

      });


    if (!filtered.length) {

      tbody.innerHTML = `

        <tr>
          <td colspan="7" class="text-center">
            Tidak ada data siswa.
          </td>
        </tr>

      `;

      return;
    }


    tbody.innerHTML =
      filtered.map((siswa, index) => `

        <tr>

          <td>
            ${index + 1}
          </td>

          <td>
            ${escapeHTML(siswa.NISN)}
          </td>

          <td>
            ${escapeHTML(siswa.NAMA)}
          </td>

          <td>
            ${escapeHTML(siswa.KELAS)}
          </td>

          <td>
            ${escapeHTML(siswa.JK)}
          </td>

          <td>
            <span class="status-badge ${
              String(siswa.STATUS).toUpperCase() === "AKTIF"
                ? "status-aktif"
                : "status-nonaktif"
            }">
              ${escapeHTML(siswa.STATUS)}
            </span>
          </td>

          <td>

            <div class="table-actions">

              <button
                class="btn btn-warning btn-small"
                onclick="editSiswa('${escapeJS(siswa.ID)}')"
              >
                Edit
              </button>

              <button
                class="btn btn-danger btn-small"
                onclick="hapusSiswa('${escapeJS(siswa.ID)}')"
              >
                Hapus
              </button>

            </div>

          </td>

        </tr>

      `).join("");

  }


  async function simpanSiswa(event) {

    event.preventDefault();


    const id =
      document.getElementById(
        "siswaId"
      ).value.trim();


    const data = {

      action: id
        ? "updateSiswa"
        : "tambahSiswa",

      id: id,

      nisn:
        document.getElementById(
          "siswaNisn"
        ).value.trim(),

      nama:
        document.getElementById(
          "siswaNama"
        ).value.trim(),

      kelas:
        document.getElementById(
          "siswaKelas"
        ).value,

      jk:
        document.getElementById(
          "siswaJK"
        ).value,

      status:
        document.getElementById(
          "siswaStatus"
        ).value

    };


    if (
      !data.nisn ||
      !data.nama ||
      !data.kelas ||
      !data.jk
    ) {

      tampilkanPesan(
        "Semua data wajib diisi.",
        "error"
      );

      return;
    }


    const button =
      document.getElementById(
        "btnSimpanSiswa"
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
        "Data berhasil disimpan.",
        "success"
      );


      resetForm();

      await loadSiswa();

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


  window.editSiswa =
    function (id) {

      const siswa =
        siswaList.find(
          item =>
            String(item.ID) === String(id)
        );


      if (!siswa) {
        return;
      }


      document.getElementById(
        "siswaId"
      ).value =
        siswa.ID || "";


      document.getElementById(
        "siswaNisn"
      ).value =
        siswa.NISN || "";


      document.getElementById(
        "siswaNama"
      ).value =
        siswa.NAMA || "";


      document.getElementById(
        "siswaKelas"
      ).value =
        siswa.KELAS || "";


      document.getElementById(
        "siswaJK"
      ).value =
        siswa.JK || "";


      document.getElementById(
        "siswaStatus"
      ).value =
        siswa.STATUS || "AKTIF";


      document.getElementById(
        "formTitle"
      ).textContent =
        "Edit Siswa";


      document.getElementById(
        "btnBatalSiswa"
      ).style.display =
        "inline-flex";


      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

    };


  window.hapusSiswa =
    async function (id) {

      const siswa =
        siswaList.find(
          item =>
            String(item.ID) === String(id)
        );


      if (!siswa) {
        return;
      }


      const yakin =
        confirm(
          "Hapus siswa " +
          siswa.NAMA +
          "?"
        );


      if (!yakin) {
        return;
      }


      try {

        const result =
          await callAPI({

            action: "hapusSiswa",

            id: id

          });


        if (!result.success) {
          throw new Error(result.message);
        }


        tampilkanPesan(
          result.message ||
          "Siswa berhasil dihapus.",
          "success"
        );


        await loadSiswa();

      } catch (error) {

        tampilkanPesan(
          error.message,
          "error"
        );

      }

    };


  function resetForm() {

    document
      .getElementById("siswaForm")
      .reset();


    document.getElementById(
      "siswaId"
    ).value = "";


    document.getElementById(
      "siswaStatus"
    ).value = "AKTIF";


    document.getElementById(
      "formTitle"
    ).textContent =
      "Tambah Siswa";


    document.getElementById(
      "btnBatalSiswa"
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
        "siswaMessage"
      );


    element.textContent =
      message;


    element.className =
      "message " +
      (type === "success"
        ? "message-success"
        : "message-error");


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
