const API_URL =
  "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";


document.addEventListener("DOMContentLoaded", () => {

  /* =====================================
     CEK LOGIN
  ===================================== */

  const userData =
    localStorage.getItem("presensiUser");

  if (!userData) {
    window.location.href = "index.html";
    return;
  }


  let user;

  try {

    user = JSON.parse(userData);

  } catch (error) {

    localStorage.removeItem("presensiUser");
    window.location.href = "index.html";
    return;

  }


  /* =====================================
     CEK ADMIN
  ===================================== */

  if (user.role !== "ADMIN") {

    alert(
      "Halaman ini hanya dapat diakses Admin."
    );

    window.location.href = "index.html";
    return;

  }


  /* =====================================
     VARIABEL
  ===================================== */

  let semuaSiswa = [];


  /* =====================================
     API
  ===================================== */

  async function callAPI(data) {

    const response = await fetch(
      API_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "text/plain;charset=utf-8"
        },

        body: JSON.stringify(data)
      }
    );


    if (!response.ok) {

      throw new Error(
        "HTTP " + response.status
      );

    }


    const text =
      await response.text();


    let result;

    try {

      result = JSON.parse(text);

    } catch (error) {

      console.error(
        "Response dari server:",
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

    try {

      const result =
        await callAPI({
          action: "getSiswa"
        });


      if (!result.success) {

        throw new Error(
          result.message ||
          "Gagal mengambil data siswa."
        );

      }


      semuaSiswa =
        result.data || [];


      const jumlahSiswa =
        document.getElementById(
          "jumlahSiswa"
        );


      if (jumlahSiswa) {

        jumlahSiswa.textContent =
          semuaSiswa.length +
          " siswa";

      }


      buatFilterKelas();

      tampilkanSiswa(
        semuaSiswa
      );


    } catch (error) {

      console.error(
        "Gagal load siswa:",
        error
      );


      const table =
        document.getElementById(
          "siswaTable"
        );


      if (table) {

        table.innerHTML = `

          <tr>

            <td
              colspan="7"
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

  }


  /* =====================================
     FILTER KELAS
  ===================================== */

  function buatFilterKelas() {

    const select =
      document.getElementById(
        "kelasFilter"
      );


    if (!select) return;


    select.innerHTML =
      '<option value="">Semua Kelas</option>';


    const daftarKelas =
      [
        ...new Set(

          semuaSiswa

            .map(
              siswa => siswa.KELAS
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

  function tampilkanSiswa(data) {

    const table =
      document.getElementById(
        "siswaTable"
      );


    if (!table) return;


    table.innerHTML = "";


    if (data.length === 0) {

      table.innerHTML = `

        <tr>

          <td
            colspan="7"
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
            ${siswa.JENIS_KELAMIN || "-"}
          </td>

          <td>

            <span class="status-badge">

              ${siswa.STATUS || "-"}

            </span>

          </td>

        `;


        table.appendChild(row);

      }
    );

  }


  /* =====================================
     FILTER DATA
  ===================================== */

  function filterData() {

    const searchInput =
      document.getElementById(
        "searchInput"
      );


    const kelasFilter =
      document.getElementById(
        "kelasFilter"
      );


    const keyword =
      searchInput
        ? searchInput.value
            .toLowerCase()
            .trim()
        : "";


    const kelas =
      kelasFilter
        ? kelasFilter.value
        : "";


    const hasil =
      semuaSiswa.filter(
        siswa => {

          const cocokKeyword =

            String(
              siswa.NAMA || ""
            )
              .toLowerCase()
              .includes(keyword)

            ||

            String(
              siswa.NISN || ""
            )
              .toLowerCase()
              .includes(keyword);


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


    tampilkanSiswa(hasil);

  }


  /* =====================================
     EVENT SEARCH
  ===================================== */

  const searchInput =
    document.getElementById(
      "searchInput"
    );


  if (searchInput) {

    searchInput.addEventListener(
      "input",
      filterData
    );

  }


  /* =====================================
     EVENT KELAS
  ===================================== */

  const kelasFilter =
    document.getElementById(
      "kelasFilter"
    );


  if (kelasFilter) {

    kelasFilter.addEventListener(
      "change",
      filterData
    );

  }


  /* =====================================
     LOGOUT
  ===================================== */

  const logoutButton =
    document.getElementById(
      "logoutButton"
    );


  if (logoutButton) {

    logoutButton.addEventListener(
      "click",
      function () {

        localStorage.removeItem(
          "presensiUser"
        );

        window.location.href =
          "index.html";

      }
    );

  }


  /* =====================================
     MULAI
  ===================================== */

  loadSiswa();

});
