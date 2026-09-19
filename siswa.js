const API_URL =
  "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";


document.addEventListener(
  "DOMContentLoaded",
  () => {


    /* =====================================
       CEK LOGIN
    ===================================== */

    const userData =
      localStorage.getItem(
        "presensiUser"
      );


    if (!userData) {

      window.location.href =
        "index.html";

      return;

    }


    let user;


    try {

      user =
        JSON.parse(userData);

    } catch (error) {

      localStorage.removeItem(
        "presensiUser"
      );

      window.location.href =
        "index.html";

      return;

    }


    /* =====================================
       CEK ADMIN
    ===================================== */

    if (
      user.role !== "ADMIN"
    ) {

      alert(
        "Halaman ini hanya dapat diakses Admin."
      );

      window.location.href =
        "index.html";

      return;

    }


    /* =====================================
       VARIABEL
    ===================================== */

    let semuaSiswa = [];

    let modeForm = "tambah";


    /* =====================================
       ELEMENT
    ===================================== */

    const formSiswa =
      document.getElementById(
        "formSiswa"
      );

    const siswaForm =
      document.getElementById(
        "siswaForm"
      );

    const formTitle =
      document.getElementById(
        "formTitle"
      );

    const inputID =
      document.getElementById(
        "inputID"
      );

    const inputNISN =
      document.getElementById(
        "inputNISN"
      );

    const inputNama =
      document.getElementById(
        "inputNama"
      );

    const inputKelas =
      document.getElementById(
        "inputKelas"
      );

    const inputJK =
      document.getElementById(
        "inputJK"
      );

    const inputStatus =
      document.getElementById(
        "inputStatus"
      );


    /* =====================================
       API
    ===================================== */

    async function callAPI(data) {

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
              JSON.stringify(data)

          }
        );


      if (!response.ok) {

        throw new Error(
          "HTTP " +
          response.status
        );

      }


      const text =
        await response.text();


      let result;


      try {

        result =
          JSON.parse(text);

      } catch (error) {

        console.error(
          "Response server:",
          text
        );

        throw new Error(
          "Server tidak mengirim JSON yang valid."
        );

      }


      return result;

    }


    /* =====================================
       LOAD SISWA
    ===================================== */

    async function loadSiswa() {

      const table =
        document.getElementById(
          "siswaTable"
        );


      table.innerHTML = `

        <tr>

          <td
            colspan="8"
            class="loading"
          >

            Memuat data siswa...

          </td>

        </tr>

      `;


      try {

        const result =
          await callAPI({

            action:
              "getSiswa"

          });


        if (!result.success) {

          throw new Error(
            result.message ||
            "Gagal mengambil data siswa."
          );

        }


        semuaSiswa =
          result.data || [];


        document.getElementById(
          "jumlahSiswa"
        ).textContent =
          semuaSiswa.length +
          " siswa";


        buatFilterKelas();


        tampilkanSiswa(
          semuaSiswa
        );


      } catch (error) {

        console.error(error);


        table.innerHTML = `

          <tr>

            <td
              colspan="8"
              class="empty"
            >

              Gagal mengambil data siswa.

              <br><br>

              ${error.message}

            </td>

          </tr>

        `;

      }

    }


    /* =====================================
       FILTER KELAS
    ===================================== */

    function buatFilterKelas() {

      const select =
        document.getElementById(
          "kelasFilter"
        );


      select.innerHTML = `

        <option value="">
          Semua Kelas
        </option>

      `;


      const daftarKelas =
        [
          ...new Set(

            semuaSiswa

              .map(
                siswa =>
                  siswa.KELAS
              )

              .filter(Boolean)

          )
        ];


      daftarKelas.sort();


      daftarKelas.forEach(
        kelas => {

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

        }
      );

    }


    /* =====================================
       TAMPILKAN SISWA
    ===================================== */

    function tampilkanSiswa(
      data
    ) {

      const table =
        document.getElementById(
          "siswaTable"
        );


      table.innerHTML = "";


      if (
        data.length === 0
      ) {

        table.innerHTML = `

          <tr>

            <td
              colspan="8"
              class="empty"
            >

              Data siswa tidak ditemukan.

            </td>

          </tr>

        `;

        return;

      }


      data.forEach(
        (siswa, index) => {

          const row =
            document.createElement(
              "tr"
            );


          row.innerHTML = `

            <td>
              ${index + 1}
            </td>

            <td>
              ${siswa.ID || "-"}
            </td>

            <td>
              ${siswa.NISN || "-"}
            </td>

            <td>
              ${siswa.NAMA || "-"}
            </td>

            <td>
              ${siswa.KELAS || "-"}
            </td>

            <td>
              ${siswa.JK || "-"}
            </td>

            <td>

              <span class="status-badge">

                ${siswa.STATUS || "-"}

              </span>

            </td>

            <td>

              <button
                class="edit-button"
                data-id="${siswa.ID}"
              >
                ✏️
              </button>

              <button
                class="delete-button"
                data-id="${siswa.ID}"
              >
                🗑️
              </button>

            </td>

          `;


          table.appendChild(
            row
          );

        }
      );


      /* EVENT EDIT */

      document
        .querySelectorAll(
          ".edit-button"
        )
        .forEach(
          button => {

            button.addEventListener(
              "click",
              () => {

                editSiswa(
                  button.dataset.id
                );

              }
            );

          }
        );


      /* EVENT DELETE */

      document
        .querySelectorAll(
          ".delete-button"
        )
        .forEach(
          button => {

            button.addEventListener(
              "click",
              () => {

                hapusSiswa(
                  button.dataset.id
                );

              }
            );

          }
        );

    }


    /* =====================================
       SEARCH + FILTER
    ===================================== */

    function filterData() {

      const keyword =
        document.getElementById(
          "searchInput"
        )
          .value
          .toLowerCase()
          .trim();


      const kelas =
        document.getElementById(
          "kelasFilter"
        ).value;


      const hasil =
        semuaSiswa.filter(
          siswa => {

            const cocokKeyword =

              String(
                siswa.NAMA || ""
              )
                .toLowerCase()
                .includes(
                  keyword
                )

              ||

              String(
                siswa.NISN || ""
              )
                .toLowerCase()
                .includes(
                  keyword
                );


            const cocokKelas =

              !kelas ||

              String(
                siswa.KELAS || ""
              ) === kelas;


            return (
              cocokKeyword &&
              cocokKelas
            );

          }
        );


      tampilkanSiswa(
        hasil
      );

    }


    /* =====================================
       BUKA FORM TAMBAH
    ===================================== */

    function bukaFormTambah() {

      modeForm =
        "tambah";


      formTitle.textContent =
        "Tambah Siswa";


      siswaForm.reset();


      inputID.disabled =
        false;


      inputStatus.value =
        "AKTIF";


      formSiswa.style.display =
        "block";


      inputID.focus();

    }


    /* =====================================
       BUKA FORM EDIT
    ===================================== */

    function editSiswa(id) {

      const siswa =
        semuaSiswa.find(
          item =>
            String(item.ID) ===
            String(id)
        );


      if (!siswa) {

        alert(
          "Data siswa tidak ditemukan."
        );

        return;

      }


      modeForm =
        "edit";


      formTitle.textContent =
        "Edit Siswa";


      inputID.value =
        siswa.ID || "";


      inputNISN.value =
        siswa.NISN || "";


      inputNama.value =
        siswa.NAMA || "";


      inputKelas.value =
        siswa.KELAS || "";


      inputJK.value =
        siswa.JK || "";


      inputStatus.value =
        siswa.STATUS || "AKTIF";


      inputID.disabled =
        true;


      formSiswa.style.display =
        "block";


      inputNISN.focus();

    }


    /* =====================================
       SIMPAN SISWA
    ===================================== */

    siswaForm.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const data = {

          action:
            modeForm === "tambah"
              ? "tambahSiswa"
              : "updateSiswa",

          id:
            inputID.value.trim(),

          nisn:
            inputNISN.value.trim(),

          nama:
            inputNama.value.trim(),

          kelas:
            inputKelas.value.trim(),

          jk:
            inputJK.value,

          status:
            inputStatus.value

        };


        if (
          !data.id ||
          !data.nisn ||
          !data.nama ||
          !data.kelas ||
          !data.jk ||
          !data.status
        ) {

          alert(
            "Semua data wajib diisi."
          );

          return;

        }


        const submitButton =
          siswaForm.querySelector(
            'button[type="submit"]'
          );


        submitButton.disabled =
          true;


        submitButton.textContent =
          "Menyimpan...";


        try {

          const result =
            await callAPI(data);


          if (!result.success) {

            throw new Error(
              result.message ||
              "Gagal menyimpan data."
            );

          }


          alert(
            result.message
          );


          tutupForm();


          await loadSiswa();


        } catch (error) {

          console.error(error);


          alert(
            "Gagal: " +
            error.message
          );


        } finally {

          submitButton.disabled =
            false;

          submitButton.textContent =
            "Simpan";

        }

      }
    );


    /* =====================================
       HAPUS SISWA
    ===================================== */

    async function hapusSiswa(id) {

      const siswa =
        semuaSiswa.find(
          item =>
            String(item.ID) ===
            String(id)
        );


      if (!siswa) return;


      const yakin =
        confirm(
          "Hapus siswa berikut?\n\n" +
          siswa.NAMA +
          " (" +
          siswa.ID +
          ")\n\n" +
          "Data yang dihapus tidak dapat dikembalikan."
        );


      if (!yakin) return;


      try {

        const result =
          await callAPI({

            action:
              "hapusSiswa",

            id:
              id

          });


        if (!result.success) {

          throw new Error(
            result.message ||
            "Gagal menghapus siswa."
          );

        }


        alert(
          result.message
        );


        await loadSiswa();


      } catch (error) {

        console.error(error);


        alert(
          "Gagal menghapus: " +
          error.message
        );

      }

    }


    /* =====================================
       TUTUP FORM
    ===================================== */

    function tutupForm() {

      formSiswa.style.display =
        "none";


      siswaForm.reset();


      inputID.disabled =
        false;

    }


    /* =====================================
       EVENT
    ===================================== */

    document
      .getElementById(
        "searchInput"
      )
      .addEventListener(
        "input",
        filterData
      );


    document
      .getElementById(
        "kelasFilter"
      )
      .addEventListener(
        "change",
        filterData
      );


    document
      .getElementById(
        "tambahButton"
      )
      .addEventListener(
        "click",
        bukaFormTambah
      );


    document
      .getElementById(
        "cancelButton"
      )
      .addEventListener(
        "click",
        tutupForm
      );


    document
      .getElementById(
        "refreshButton"
      )
      .addEventListener(
        "click",
        loadSiswa
      );


    document
      .getElementById(
        "logoutButton"
      )
      .addEventListener(
        "click",
        () => {

          localStorage.removeItem(
            "presensiUser"
          );

          window.location.href =
            "index.html";

        }
      );


    /* =====================================
       MULAI
    ===================================== */

    loadSiswa();

  }
);
