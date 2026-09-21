"use strict";

(function () {

  let dataKelas = [];
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
    loadData();
  }

  function bindEvents() {

    $("tambahButton")?.addEventListener(
      "click",
      () => openForm()
    );

    $("cancelButton")?.addEventListener(
      "click",
      closeForm
    );

    $("refreshButton")?.addEventListener(
      "click",
      loadData
    );

    $("searchInput")?.addEventListener(
      "input",
      renderKelas
    );

    $("guruFilter")?.addEventListener(
      "change",
      renderKelas
    );

    $("statusFilter")?.addEventListener(
      "change",
      renderKelas
    );

    $("formKelas")?.addEventListener(
      "submit",
      handleSubmit
    );

    $("kelasForm")?.addEventListener(
      "submit",
      handleSubmit
    );
  }

  async function loadData() {

    const table = $("kelasTable");

    if (table) {
      table.innerHTML = `
        <tr>
          <td colspan="7" class="loading">
            Memuat data kelas...
          </td>
        </tr>
      `;
    }

    try {

      const [kelasResult, guruResult] =
        await Promise.all([
          callAPI({
            action: "getKelas"
          }),

          callAPI({
            action: "getGuru"
          })
        ]);

      if (!kelasResult.success) {
        throw new Error(
          kelasResult.message ||
          "Gagal mengambil data kelas."
        );
      }

      if (!guruResult.success) {
        throw new Error(
          guruResult.message ||
          "Gagal mengambil data guru."
        );
      }

      dataKelas = Array.isArray(kelasResult.data)
        ? kelasResult.data
        : [];

      dataGuru = Array.isArray(guruResult.data)
        ? guruResult.data
        : [];

      renderGuruOptions();
      renderKelas();

      if ($("jumlahKelas")) {
        $("jumlahKelas").textContent =
          dataKelas.length;
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

  function renderGuruOptions() {

    const selects = [
      $("inputIDGuru"),
      $("guruSelect"),
      $("guruFilter")
    ].filter(Boolean);

    selects.forEach(select => {

      const currentValue = select.value;

      const isFilter =
        select.id === "guruFilter";

      select.innerHTML = `
        <option value="">
          ${isFilter ? "Semua Guru" : "Pilih Guru"}
        </option>

        ${dataGuru.map(guru => `
          <option value="${escapeAttr(guru.ID_GURU)}">
            ${escapeHTML(
              guru.NAMA ||
              guru.ID_GURU
            )}
          </option>
        `).join("")}
      `;

      if (currentValue) {
        select.value = currentValue;
      }

    });
  }

  function renderKelas() {

    const table = $("kelasTable");

    if (!table) return;

    const keyword = String(
      $("searchInput")?.value || ""
    ).toLowerCase().trim();

    const guruFilter = String(
      $("guruFilter")?.value || ""
    );

    const statusFilter = String(
      $("statusFilter")?.value || ""
    ).toUpperCase();

    const filtered = dataKelas.filter(kelas => {

      const guru = dataGuru.find(
        item =>
          String(item.ID_GURU) ===
          String(kelas.ID_GURU)
      );

      const namaGuru =
        guru?.NAMA || "";

      const cocokKeyword =
        !keyword ||
        String(kelas.ID_KELAS || "")
          .toLowerCase()
          .includes(keyword) ||
        String(kelas.NAMA_KELAS || "")
          .toLowerCase()
          .includes(keyword) ||
        namaGuru.toLowerCase()
          .includes(keyword);

      const cocokGuru =
        !guruFilter ||
        String(kelas.ID_GURU) === guruFilter;

      const cocokStatus =
        !statusFilter ||
        String(kelas.STATUS || "")
          .toUpperCase() === statusFilter;

      return (
        cocokKeyword &&
        cocokGuru &&
        cocokStatus
      );
    });

    if (!filtered.length) {

      table.innerHTML = `
        <tr>
          <td colspan="7" class="empty">
            Data kelas tidak ditemukan.
          </td>
        </tr>
      `;

      return;
    }

    table.innerHTML = filtered.map(
      (kelas, index) => {

        const guru = dataGuru.find(
          item =>
            String(item.ID_GURU) ===
            String(kelas.ID_GURU)
        );

        const status =
          String(kelas.STATUS || "AKTIF")
            .toUpperCase();

        return `
          <tr>
            <td>${index + 1}</td>

            <td>
              ${escapeHTML(kelas.ID_KELAS || "")}
            </td>

            <td>
              ${escapeHTML(kelas.NAMA_KELAS || "")}
            </td>

            <td>
              ${escapeHTML(
                guru?.NAMA ||
                kelas.ID_GURU ||
                "-"
              )}
            </td>

            <td>
              ${escapeHTML(
                kelas.TAHUN_AJARAN || "-"
              )}
            </td>

            <td>
              <span class="${
                status === "AKTIF"
                  ? "status-hadir"
                  : "status-alpa"
              }">
                ${escapeHTML(status)}
              </span>
            </td>

            <td>
              <button
                type="button"
                class="btn btn-warning btn-sm"
                data-edit-kelas="${escapeAttr(
                  kelas.ID_KELAS
                )}">
                Edit
              </button>

              <button
                type="button"
                class="btn btn-danger btn-sm"
                data-delete-kelas="${escapeAttr(
                  kelas.ID_KELAS
                )}">
                Hapus
              </button>
            </td>
          </tr>
        `;
      }
    ).join("");

    table.querySelectorAll(
      "[data-edit-kelas]"
    ).forEach(button => {

      button.addEventListener(
        "click",
        () => editKelas(
          button.dataset.editKelas
        )
      );

    });

    table.querySelectorAll(
      "[data-delete-kelas]"
    ).forEach(button => {

      button.addEventListener(
        "click",
        () => deleteKelas(
          button.dataset.deleteKelas
        )
      );

    });
  }

  function openForm(kelas = null) {

    modeEdit = !!kelas;

    const container =
      $("formKelas") ||
      $("kelasFormContainer");

    if (container) {
      container.style.display = "block";
    }

    if ($("formTitle")) {
      $("formTitle").textContent =
        modeEdit
          ? "Edit Data Kelas"
          : "Tambah Data Kelas";
    }

    setValue(
      "inputIDKelas",
      kelas?.ID_KELAS || ""
    );

    setValue(
      "inputNamaKelas",
      kelas?.NAMA_KELAS || ""
    );

    setValue(
      "inputIDGuru",
      kelas?.ID_GURU || ""
    );

    setValue(
      "inputTahunAjaran",
      kelas?.TAHUN_AJARAN || ""
    );

    setValue(
      "inputStatus",
      kelas?.STATUS || "AKTIF"
    );

    const idInput = $("inputIDKelas");

    if (idInput) {
      idInput.readOnly = modeEdit;
    }
  }

  function closeForm() {

    const container =
      $("formKelas") ||
      $("kelasFormContainer");

    if (container) {
      container.style.display = "none";
    }

    $("kelasForm")?.reset();

    modeEdit = false;

    setValue("inputStatus", "AKTIF");
  }

  function editKelas(id) {

    const kelas = dataKelas.find(
      item =>
        String(item.ID_KELAS) === String(id)
    );

    if (!kelas) {
      alert("Data kelas tidak ditemukan.");
      return;
    }

    openForm(kelas);
  }

  async function handleSubmit(e) {

    e.preventDefault();

    const payload = {
      action: modeEdit
        ? "updateKelas"
        : "tambahKelas",

      ID_KELAS: getValue("inputIDKelas"),

      NAMA_KELAS:
        getValue("inputNamaKelas"),

      ID_GURU:
        getValue("inputIDGuru"),

      TAHUN_AJARAN:
        getValue("inputTahunAjaran"),

      STATUS:
        getValue("inputStatus") || "AKTIF"
    };

    if (
      !payload.ID_KELAS ||
      !payload.NAMA_KELAS
    ) {
      alert(
        "ID Kelas dan Nama Kelas wajib diisi."
      );
      return;
    }

    if (!payload.ID_GURU) {
      alert("Guru/Wali Kelas wajib dipilih.");
      return;
    }

    try {

      const result = await callAPI(payload);

      if (!result.success) {
        throw new Error(
          result.message ||
          "Gagal menyimpan data kelas."
        );
      }

      alert(
        modeEdit
          ? "Data kelas berhasil diperbarui."
          : "Data kelas berhasil ditambahkan."
      );

      closeForm();

      await loadData();

    } catch (error) {

      console.error(error);

      alert(error.message);
    }
  }

  async function deleteKelas(id) {

    const kelas = dataKelas.find(
      item =>
        String(item.ID_KELAS) === String(id)
    );

    if (!kelas) return;

    if (!confirm(
      `Hapus kelas "${kelas.NAMA_KELAS}"?`
    )) {
      return;
    }

    try {

      const result = await callAPI({
        action: "hapusKelas",
        ID_KELAS: id
      });

      if (!result.success) {
        throw new Error(
          result.message ||
          "Gagal menghapus kelas."
        );
      }

      alert("Data kelas berhasil dihapus.");

      await loadData();

    } catch (error) {

      console.error(error);

      alert(error.message);
    }
  }

  function setValue(id, value) {
    const el = $(id);
    if (el) el.value = value ?? "";
  }

  function getValue(id) {
    return String($(id)?.value || "").trim();
  }

  window.loadKelas = loadData;
  window.editKelas = editKelas;
  window.deleteKelas = deleteKelas;
  window.openKelasForm = openForm;
  window.closeKelasForm = closeForm;

  document.addEventListener(
    "DOMContentLoaded",
    init
  );

})();
