(function () {
  "use strict";

  Auth.requireRole("ADMIN");

  let guruList = [];

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    document
      .getElementById("guruForm")
      .addEventListener("submit", simpanGuru);

    document
      .getElementById("btnBatalGuru")
      .addEventListener("click", resetForm);

    await loadGuru();
  }

  async function loadGuru() {
    try {
      const result = await callAPI({
        action: "getGuru"
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      guruList = result.data || [];

      renderTable();

    } catch (error) {
      tampilkanPesan(error.message, "error");
    }
  }

  function renderTable() {
    const tbody =
      document.getElementById("guruTableBody");

    if (!guruList.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center">
            Belum ada data guru.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = guruList.map((guru, index) => `
      <tr>

        <td>${index + 1}</td>

        <td>
          ${escapeHTML(guru.ID_GURU)}
        </td>

        <td>
          ${escapeHTML(guru.NIP)}
        </td>

        <td>
          ${escapeHTML(guru.NAMA)}
        </td>

        <td>
          ${escapeHTML(guru.EMAIL)}
        </td>

        <td>
          <span class="status-badge ${
            String(guru.STATUS).toUpperCase() === "AKTIF"
              ? "status-aktif"
              : "status-nonaktif"
          }">
            ${escapeHTML(guru.STATUS)}
          </span>
        </td>

        <td>

          <div class="table-actions">

            <button
              class="btn btn-warning btn-small"
              onclick="editGuru('${escapeJS(guru.ID_GURU)}')"
            >
              Edit
            </button>

            <button
              class="btn btn-danger btn-small"
              onclick="hapusGuru('${escapeJS(guru.ID_GURU)}')"
            >
              Hapus
            </button>

          </div>

        </td>

      </tr>
    `).join("");
  }

  async function simpanGuru(event) {
    event.preventDefault();

    const id =
      document.getElementById("guruId").value.trim();

    const data = {
      action: id ? "updateGuru" : "tambahGuru",

      idGuru: id,

      nip:
        document.getElementById("guruNip").value.trim(),

      nama:
        document.getElementById("guruNama").value.trim(),

      email:
        document.getElementById("guruEmail").value.trim(),

      status:
        document.getElementById("guruStatus").value
    };

    if (!data.nama) {
      tampilkanPesan(
        "Nama guru wajib diisi.",
        "error"
      );
      return;
    }

    const button =
      document.getElementById("btnSimpanGuru");

    button.disabled = true;
    button.textContent = "Menyimpan...";

    try {
      const result = await callAPI(data);

      if (!result.success) {
        throw new Error(result.message);
      }

      tampilkanPesan(
        result.message || "Data guru berhasil disimpan.",
        "success"
      );

      resetForm();

      await loadGuru();

    } catch (error) {
      tampilkanPesan(error.message, "error");

    } finally {
      button.disabled = false;
      button.textContent = "Simpan";
    }
  }

  window.editGuru = function (id) {
    const guru =
      guruList.find(
        item =>
          String(item.ID_GURU) === String(id)
      );

    if (!guru) return;

    document.getElementById("guruId").value =
      guru.ID_GURU || "";

    document.getElementById("guruNip").value =
      guru.NIP || "";

    document.getElementById("guruNama").value =
      guru.NAMA || "";

    document.getElementById("guruEmail").value =
      guru.EMAIL || "";

    document.getElementById("guruStatus").value =
      guru.STATUS || "AKTIF";

    document.getElementById("formTitle").textContent =
      "Edit Guru";

    document.getElementById("btnBatalGuru").style.display =
      "inline-flex";

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  window.hapusGuru = async function (id) {
    const guru =
      guruList.find(
        item =>
          String(item.ID_GURU) === String(id)
      );

    if (!guru) return;

    const yakin = confirm(
      "Hapus guru " + guru.NAMA + "?"
    );

    if (!yakin) return;

    try {
      const result = await callAPI({
        action: "hapusGuru",
        idGuru: id
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      tampilkanPesan(
        result.message || "Guru berhasil dihapus.",
        "success"
      );

      await loadGuru();

    } catch (error) {
      tampilkanPesan(error.message, "error");
    }
  };

  function resetForm() {
    document.getElementById("guruForm").reset();

    document.getElementById("guruId").value = "";

    document.getElementById("guruStatus").value =
      "AKTIF";

    document.getElementById("formTitle").textContent =
      "Tambah Guru";

    document.getElementById("btnBatalGuru").style.display =
      "none";
  }


  function tampilkanPesan(message, type) {
    const element =
      document.getElementById("guruMessage");

    element.textContent = message;

    element.className =
      "message " +
      (
        type === "success"
          ? "message-success"
          : "message-error"
      );

    element.style.display = "block";

    setTimeout(() => {
      element.style.display = "none";
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
