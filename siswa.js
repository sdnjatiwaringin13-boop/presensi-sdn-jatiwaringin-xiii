"use strict";

let siswaData = [];
let modeSiswa = "tambah";


/* =========================================================
   INIT
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async function () {

    const user = requireAdmin();

    if (!user) return;


    try {

      await loadSiswa();

      await loadFilterKelas();

      bindSiswaEvents();

    } catch (error) {

      console.error(error);

      showSiswaError(
        error.message
      );

    }

  }
);


/* =========================================================
   LOAD SISWA
   ========================================================= */

async function loadSiswa() {

  const tbody =
    document.getElementById(
      "siswaTable"
    );


  if (tbody) {

    tbody.innerHTML = `
      <tr>
        <td colspan="8"
            class="loading">

          Memuat data siswa...

        </td>
      </tr>
    `;

  }


  const result =
    await callAPI({
      action: "getSiswa",
      aktifOnly: false
    });


  console.log(
    "GET SISWA:",
    result
  );


  if (!result.success) {

    throw new Error(
      result.message ||
      "Gagal mengambil data siswa."
    );

  }


  siswaData =
    Array.isArray(result.data)
      ? result.data
      : [];


  renderSiswa();

}


/* =========================================================
   FILTER KELAS
   ========================================================= */

async function loadFilterKelas() {

  const select =
    document.getElementById(
      "kelasFilter"
    );


  if (!select) return;


  const result =
    await callAPI({
      action: "getKelas"
    });


  if (!result.success) return;


  const kelas =
    Array.isArray(result.data)
      ? result.data
      : [];


  select.innerHTML = `
    <option value="">
      Semua Kelas
    </option>
  `;


  kelas.forEach(function (item) {

    const option =
      document.createElement(
        "option"
      );


    option.value =
      item.NAMA_KELAS || "";


    option.textContent =
      item.NAMA_KELAS || "";


    select.appendChild(
      option
    );

  });

}


/* =========================================================
   RENDER
   ========================================================= */

function renderSiswa() {

  const tbody =
    document.getElementById(
      "siswaTable"
    );


  if (!tbody) return;


  const search =
    String(
      document.getElementById(
        "searchInput"
      )?.value || ""
    )
    .trim()
    .toLowerCase();


  const kelas =
    String(
      document.getElementById(
        "kelasFilter"
      )?.value || ""
    );


  let data =
    siswaData.filter(
      function (siswa) {

        const cocokSearch =
          !search ||

          String(
            siswa.NAMA || ""
          )
          .toLowerCase()
          .includes(search) ||

          String(
            siswa.NISN || ""
          )
          .toLowerCase()
          .includes(search) ||

          String(
            siswa.ID || ""
          )
          .toLowerCase()
          .includes(search);


        const cocokKelas =
          !kelas ||
          String(
            siswa.KELAS || ""
          ) === kelas;


        return (
          cocokSearch &&
          cocokKelas
        );

      }
    );


  const jumlah =
    document.getElementById(
      "jumlahSiswa"
    );


  if (jumlah) {

    jumlah.textContent =
      `${data.length} siswa`;

  }


  if (!data.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="8"
            class="loading">

          Tidak ada data siswa.

        </td>
      </tr>
    `;

    return;

  }


  tbody.innerHTML =
    data.map(
      function (siswa, index) {

        return `

          <tr>

            <td>
              ${index + 1}
            </td>

            <td>
              ${escapeHTML(
                siswa.ID
              )}
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
              <span class="status-badge">
                ${escapeHTML(
                  siswa.STATUS
                )}
              </span>
            </td>

            <td class="action-buttons">

              <button
                class="edit-button"
                onclick="editSiswa('${escapeAttr(
                  siswa.ID
                )}')">

                Edit

              </button>


              <button
                class="delete-button"
                onclick="deleteSiswa('${escapeAttr(
                  siswa.ID
                )}')">

                Hapus

              </button>

            </td>

          </tr>

        `;

      }
    )
    .join("");

}


/* =========================================================
   FORM
   ========================================================= */

function bukaFormSiswa() {

  modeSiswa = "tambah";


  const form =
    document.getElementById(
      "formSiswa"
    );


  const title =
    document.getElementById(
      "formTitle"
    );


  if (form) {

    form.style.display =
      "block";

  }


  if (title) {

    title.textContent =
      "Tambah Siswa";

  }


  document
    .getElementById(
      "siswaForm"
    )
    ?.reset();


  document.getElementById(
    "inputID"
  ).disabled = false;


  document.getElementById(
    "inputStatus"
  ).value = "AKTIF";

}


/* =========================================================
   EDIT
   ========================================================= */

function editSiswa(id) {

  const siswa =
    siswaData.find(
      function (item) {

        return String(
          item.ID
        ) === String(id);

      }
    );


  if (!siswa) {

    alert(
      "Data siswa tidak ditemukan."
    );

    return;

  }


  modeSiswa = "edit";


  document.getElementById(
    "formSiswa"
  ).style.display = "block";


  document.getElementById(
    "formTitle"
  ).textContent =
    "Edit Siswa";


  document.getElementById(
    "inputID"
  ).value =
    siswa.ID || "";


  document.getElementById(
    "inputID"
  ).disabled = true;


  document.getElementById(
    "inputNISN"
  ).value =
    siswa.NISN || "";


  document.getElementById(
    "inputNama"
  ).value =
    siswa.NAMA || "";


  document.getElementById(
    "inputKelas"
  ).value =
    siswa.KELAS || "";


  document.getElementById(
    "inputJK"
  ).value =
    siswa.JK || "";


  document.getElementById(
    "inputStatus"
  ).value =
    siswa.STATUS || "AKTIF";


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* =========================================================
   SIMPAN
   ========================================================= */

async function simpanSiswa(
  event
) {

  event.preventDefault();


  const payload = {

    action:
      modeSiswa === "edit"
        ? "updateSiswa"
        : "tambahSiswa",

    id:
      document.getElementById(
        "inputID"
      ).value.trim(),

    nisn:
      document.getElementById(
        "inputNISN"
      ).value.trim(),

    nama:
      document.getElementById(
        "inputNama"
      ).value.trim(),

    kelas:
      document.getElementById(
        "inputKelas"
      ).value.trim(),

    jk:
      document.getElementById(
        "inputJK"
      ).value,

    status:
      document.getElementById(
        "inputStatus"
      ).value

  };


  try {

    const result =
      await callAPI(
        payload
      );


    console.log(
      "SIMPAN SISWA:",
      result
    );


    if (!result.success) {

      throw new Error(
        result.message ||
        "Data gagal disimpan."
      );

    }


    alert(
      result.message ||
      "Data berhasil disimpan."
    );


    tutupFormSiswa();


    await loadSiswa();


  } catch (error) {

    console.error(error);

    alert(
      "Gagal menyimpan siswa:\n\n" +
      error.message
    );

  }

}


/* =========================================================
   HAPUS
   ========================================================= */

async function deleteSiswa(id) {

  if (
    !confirm(
      "Apakah data siswa ini akan dihapus?"
    )
  ) {

    return;

  }


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
        "Data gagal dihapus."
      );

    }


    alert(
      result.message ||
      "Data berhasil dihapus."
    );


    await loadSiswa();


  } catch (error) {

    alert(
      "Gagal menghapus siswa:\n\n" +
      error.message
    );

  }

}


/* =========================================================
   TUTUP FORM
   ========================================================= */

function tutupFormSiswa() {

  const form =
    document.getElementById(
      "formSiswa"
    );


  if (form) {

    form.style.display =
      "none";

  }


  document
    .getElementById(
      "siswaForm"
    )
    ?.reset();


  document.getElementById(
    "inputID"
  ).disabled = false;

}


/* =========================================================
   EVENTS
   ========================================================= */

function bindSiswaEvents() {

  document
    .getElementById(
      "tambahButton"
    )
    ?.addEventListener(
      "click",
      bukaFormSiswa
    );


  document
    .getElementById(
      "cancelButton"
    )
    ?.addEventListener(
      "click",
      tutupFormSiswa
    );


  document
    .getElementById(
      "refreshButton"
    )
    ?.addEventListener(
      "click",
      loadSiswa
    );


  document
    .getElementById(
      "searchInput"
    )
    ?.addEventListener(
      "input",
      renderSiswa
    );


  document
    .getElementById(
      "kelasFilter"
    )
    ?.addEventListener(
      "change",
      renderSiswa
    );


  document
    .getElementById(
      "siswaForm"
    )
    ?.addEventListener(
      "submit",
      simpanSiswa
    );

}


/* =========================================================
   ERROR
   ========================================================= */

function showSiswaError(
  message
) {

  const tbody =
    document.getElementById(
      "siswaTable"
    );


  if (!tbody) return;


  tbody.innerHTML = `

    <tr>

      <td colspan="8"
          style="color:#dc2626;padding:30px">

        Gagal memuat data:

        <br><br>

        ${escapeHTML(
          message
        )}

      </td>

    </tr>

  `;

}
