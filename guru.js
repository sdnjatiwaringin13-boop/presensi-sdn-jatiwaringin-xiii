"use strict";

(function () {

  let dataGuru = [];
  let modeEdit = false;

  const $ = (id) => document.getElementById(id);

  function init() {
    const user = getCurrentUser();

    if (!user) {
      location.href = "index.html";
      return;
    }

    if (String(user.role).toUpperCase() !== "ADMIN") {
      alert("Halaman ini hanya dapat diakses Administrator.");
      location.href = "dashboard.html";
      return;
    }

    bindEvents();
    loadGuru();
  }

  function bindEvents() {

    $("tambahButton")?.addEventListener("click", function () {
      openForm();
    });

    $("cancelButton")?.addEventListener("click", function () {
      closeForm();
    });

    $("refreshButton")?.addEventListener("click", function () {
      loadGuru();
    });

    $("searchInput")?.addEventListener("input", renderGuru);

    $("statusFilter")?.addEventListener("change", renderGuru);

    $("formGuru")?.addEventListener("submit", async function (e) {
      e.preventDefault();
      await saveGuru();
    });

    $("guruForm")?.addEventListener("submit", async function (e) {
      e.preventDefault();
      await saveGuru();
    });
  }

  async function loadGuru() {

    const table = $("guruTable");

    if (table) {
      table.innerHTML = `
        <tr>
          <td colspan="7" class="loading">
            Memuat data guru...
          </td>
        </tr>
      `;
    }

    try {

      const result = await callAPI({
        action: "getGuru"
      });

      if (!result.success) {
        throw new Error(result.message || "Gagal mengambil data guru.");
      }

      dataGuru = Array.isArray(result.data)
        ? result.data
        : [];

      renderGuru();

      const jumlah = $("jumlahGuru");

      if (jumlah) {
        jumlah.textContent = dataGuru.length;
      }

    } catch (error) {

      console.error(error);

      if (table) {
        table.innerHTML = `
          <tr>
            <td colspan="7" class="error">
              ${escapeHTML(error.message)}
            </td>
          </tr>
        `;
      }
    }
  }

  function renderGuru() {

    const table = $("guruTable");

    if (!table) return;

    const keyword = String(
      $("searchInput")?.value || ""
    ).toLowerCase().trim();

    const status = String(
      $("statusFilter")?.value || ""
    ).toUpperCase();

    const filtered = dataGuru.filter(guru => {

      const cocokKeyword =
        !keyword ||
        String(guru.ID_GURU || "").toLowerCase().includes(keyword) ||
        String(guru.NIP || "").toLowerCase().includes(keyword) ||
        String(guru.NAMA || "").toLowerCase().includes(keyword) ||
        String(guru.EMAIL || "").toLowerCase().includes(keyword);

      const cocokStatus =
        !status ||
        String(guru.STATUS || "").toUpperCase() === status;

      return cocokKeyword && cocokStatus;
    });

    if (!filtered.length) {

      table.innerHTML = `
        <tr>
          <td colspan="7" class="empty">
            Data guru tidak ditemukan.
          </td>
        </tr>
      `;

      return;
    }

    table.innerHTML = filtered.map((guru, index) => {

      const statusText = String(
        guru.STATUS || "AKTIF"
      ).toUpperCase();

      const statusClass =
        statusText === "AKTIF"
          ? "status-hadir"
          : "status-alpa";

      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHTML(guru.ID_GURU || "")}</td>
          <td>${escapeHTML(guru.NIP || "")}</td>
          <td>${escapeHTML(guru.NAMA || "")}</td>
          <td>${escapeHTML(guru.EMAIL || "")}</td>
          <td>
            <span class="${statusClass}">
              ${escapeHTML(statusText)}
            </span>
          </td>
          <td>
            <button
              type="button"
              class="btn btn-warning btn-sm"
              data-edit-guru="${escapeAttr(guru.ID_GURU)}">
              Edit
            </button>

            <button
              type="button"
              class="btn btn-danger btn-sm"
              data-delete-guru="${escapeAttr(guru.ID_GURU)}">
              Hapus
            </button>
          </td>
        </tr>
      `;
    }).join("");

    table.querySelectorAll("[data-edit-guru]")
      .forEach(button => {

        button.addEventListener("click", function () {
          editGuru(this.dataset.editGuru);
        });

      });

    table.querySelectorAll("[data-delete-guru]")
      .forEach(button => {

        button.addEventListener("click", function () {
          deleteGuru(this.dataset.deleteGuru);
        });

      });
  }

  function openForm(guru = null) {

    modeEdit = !!guru;

    const formContainer =
      $("formGuru") ||
      $("guruFormContainer");

    if (formContainer) {
      formContainer.style.display = "block";
    }

    const title = $("formTitle");

    if (title) {
      title.textContent = modeEdit
        ? "Edit Data Guru"
        : "Tambah Data Guru";
    }

    setValue("inputIDGuru", guru?.ID_GURU || "");
    setValue("inputNIP", guru?.NIP || "");
    setValue("inputNama", guru?.NAMA || "");
    setValue("inputEmail", guru?.EMAIL || "");
    setValue("inputStatus", guru?.STATUS || "AKTIF");

    const idInput = $("inputIDGuru");

    if (idInput) {
      idInput.readOnly = modeEdit;
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function closeForm() {

    const formContainer =
      $("formGuru") ||
      $("guruFormContainer");

    if (formContainer) {
      formContainer.style.display = "none";
    }

    $("guruForm")?.reset();

    modeEdit = false;

    setValue("inputStatus", "AKTIF");
  }

  function editGuru(id) {

    const guru = dataGuru.find(
      item => String(item.ID_GURU) === String(id)
    );

    if (!guru) {
      alert("Data guru tidak ditemukan.");
      return;
    }

    openForm(guru);
  }

  async function saveGuru() {

    const idGuru = getValue("inputIDGuru");
    const nip = getValue("inputNIP");
    const nama = getValue("inputNama");
    const email = getValue("inputEmail");
    const status = getValue("inputStatus") || "AKTIF";

    if (!idGuru || !nama) {
      alert("ID Guru dan Nama wajib diisi.");
      return;
    }

    const payload = {
      action: modeEdit
        ? "updateGuru"
        : "tambahGuru",

      ID_GURU: idGuru,
      NIP: nip,
      NAMA: nama,
      EMAIL: email,
      STATUS: status
    };

    try {

      setSaving(true);

      const result = await callAPI(payload);

      if (!result.success) {
        throw new Error(
          result.message || "Gagal menyimpan data guru."
        );
      }

      alert(
        modeEdit
          ? "Data guru berhasil diperbarui."
          : "Data guru berhasil ditambahkan."
      );

      closeForm();
      await loadGuru();

    } catch (error) {

      console.error(error);

      alert(error.message);

    } finally {

      setSaving(false);

    }
  }

  async function deleteGuru(id) {

    const guru = dataGuru.find(
      item => String(item.ID_GURU) === String(id)
    );

    if (!guru) return;

    const yakin = confirm(
      `Hapus guru "${guru.NAMA}"?`
    );

    if (!yakin) return;

    try {

      const result = await callAPI({
        action: "hapusGuru",
        ID_GURU: id
      });

      if (!result.success) {
        throw new Error(
          result.message || "Gagal menghapus guru."
        );
      }

      alert("Data guru berhasil dihapus.");

      await loadGuru();

    } catch (error) {

      console.error(error);

      alert(error.message);

    }
  }

  function setValue(id, value) {
    const element = $(id);
    if (element) element.value = value ?? "";
  }

  function getValue(id) {
    return String($(id)?.value || "").trim();
  }

  function setSaving(state) {

    const buttons = document.querySelectorAll(
      "#guruForm button, #formGuru button"
    );

    buttons.forEach(button => {
      button.disabled = state;
    });
  }

  window.loadGuru = loadGuru;
  window.editGuru = editGuru;
  window.deleteGuru = deleteGuru;
  window.openGuruForm = openForm;
  window.closeGuruForm = closeForm;

  document.addEventListener("DOMContentLoaded", init);

})();
