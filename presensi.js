"use strict";

(function () {

  let semuaSiswa = [];
  let siswaTampil = [];
  let user = null;

  const $ = (id) =>
    document.getElementById(id);

  function init() {

    user = getCurrentUser();

    if (!user) {
      location.href = "index.html";
      return;
    }

    const role =
      String(user.role || "")
        .toUpperCase();

    if (
      role !== "ADMIN" &&
      role !== "GURU"
    ) {
      location.href =
        "dashboard.html";
      return;
    }

    bindEvents();

    loadKelas();

    loadSiswa();
  }

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
        await loadSiswa();
      }
    );

    $("simpanButton")?.addEventListener(
      "click",
      simpanSemua
    );
  }

  async function loadKelas() {

    const select =
      $("kelasSelect");

    if (!select) return;

    try {

      let result;

      if (
        String(user.role)
          .toUpperCase() === "GURU"
      ) {

        result = await callAPI({
          action: "getKelasGuru",
          idGuru: user.idGuru
        });

      } else {

        result = await callAPI({
          action: "getKelas"
        });

      }

      if (!result.success) {
        throw new Error(
          result.message ||
          "Gagal mengambil kelas."
        );
      }

      const kelas =
        Array.isArray(result.data)
          ? result.data
          : [];

      select.innerHTML = `
        <option value="">
          Semua Kelas
        </option>

        ${kelas.map(item => `
          <option value="${escapeAttr(
            item.NAMA_KELAS
          )}">
            ${escapeHTML(
              item.NAMA_KELAS
            )}
          </option>
        `).join("")}
      `;

    } catch (error) {

      console.error(error);

      select.innerHTML = `
        <option value="">
          Gagal memuat kelas
        </option>
      `;
    }
  }

  async function loadSiswa() {

    const table =
      $("siswaTable");

    if (table) {
      table.innerHTML = `
        <tr>
          <td colspan="7" class="loading">
            Memuat data siswa...
          </td>
        </tr>
      `;
    }

    try {

      const result =
        await callAPI({
          action: "getSiswa",
          aktifOnly: true
        });

      if (!result.success) {
        throw new Error(
          result.message ||
          "Gagal mengambil siswa."
        );
      }

      semuaSiswa =
        Array.isArray(result.data)
          ? result.data
          : [];

      filterSiswa();

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

  function filterSiswa() {

    const kelas =
      String(
        $("kelasSelect")?.value || ""
      );

    const keyword =
      String(
        $("searchInput")?.value || ""
      )
      .toLowerCase()
      .trim();

    siswaTampil =
      semuaSiswa.filter(siswa => {

        const cocokKelas =
          !kelas ||
          String(siswa.KELAS) === kelas;

        const cocokKeyword =
          !keyword ||
          String(siswa.NISN || "")
            .toLowerCase()
            .includes(keyword) ||
          String(siswa.NAMA || "")
            .toLowerCase()
            .includes(keyword);

        return (
          cocokKelas &&
          cocokKeyword
        );
      });

    renderSiswa();
  }

  function renderSiswa() {

    const table =
      $("siswaTable");

    if (!table) return;

    if (!siswaTampil.length) {

      table.innerHTML = `
        <tr>
          <td colspan="7" class="empty">
            Tidak ada siswa.
          </td>
        </tr>
      `;

      return;
    }

    table.innerHTML =
      siswaTampil.map(
        (siswa, index) => {

          const id =
            escapeAttr(
              siswa.ID
            );

          return `
            <tr data-siswa="${id}">

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
                  data-id="${id}">
                  <option value="HADIR">
                    Hadir
                  </option>
                  <option value="IZIN">
                    Izin
                  </option>
                  <option value="SAKIT">
                    Sakit
                  </option>
                  <option value="ALPA">
                    Alpa
                  </option>
                </select>
              </td>

              <td>
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  data-simpan="${id}">
                  Simpan
                </button>
              </td>

            </tr>
          `;
        }
      ).join("");

    table.querySelectorAll(
      "[data-simpan]"
    ).forEach(button => {

      button.addEventListener(
        "click",
        () => simpanSatu(
          button.dataset.simpan,
          button
        )
      );

    });
  }

  async function simpanSemua() {

    const buttons =
      document.querySelectorAll(
        "[data-simpan]"
      );

    if (!buttons.length) {
      alert("Tidak ada siswa.");
      return;
    }

    if (
      !confirm(
        `Simpan presensi untuk ${buttons.length} siswa?`
      )
    ) {
      return;
    }

    const simpanButton =
      $("simpanButton");

    if (simpanButton) {
      simpanButton.disabled = true;
    }

    let berhasil = 0;
    let gagal = 0;

    try {

      for (const button of buttons) {

        const ok =
          await simpanSatu(
            button.dataset.simpan,
            button,
            true
          );

        if (ok) {
          berhasil++;
        } else {
          gagal++;
        }
      }

      alert(
        `Presensi selesai.\n\n` +
        `Berhasil: ${berhasil}\n` +
        `Gagal: ${gagal}`
      );

    } finally {

      if (simpanButton) {
        simpanButton.disabled = false;
      }
    }
  }

  async function simpanSatu(
    id,
    button,
    silent = false
  ) {

    const siswa =
      semuaSiswa.find(
        item =>
          String(item.ID) ===
          String(id)
      );

    if (!siswa) {
      if (!silent) {
        alert("Data siswa tidak ditemukan.");
      }
      return false;
    }

    const row =
      button.closest("tr");

    const select =
      row?.querySelector(
        ".status-presensi"
      );

    const status =
      select?.value || "HADIR";

    try {

      button.disabled = true;
      button.textContent =
        "Menyimpan...";

      const result =
        await callAPI({
          action: "simpanPresensi",

          id: siswa.ID,

          nisn: siswa.NISN,

          nama: siswa.NAMA,

          kelas: siswa.KELAS,

          status,

          idGuru:
            user.idGuru || "",

          sumber:
            "MANUAL"
        });

      if (!result.success) {
        throw new Error(
          result.message ||
          "Gagal menyimpan presensi."
        );
      }

      button.textContent =
        "Tersimpan";

      button.classList.add(
        "btn-success"
      );

      if (!silent) {
        alert(
          `${siswa.NAMA}: presensi berhasil disimpan.`
        );
      }

      return true;

    } catch (error) {

      console.error(error);

      button.textContent =
        "Gagal";

      if (!silent) {
        alert(error.message);
      }

      return false;

    } finally {

      setTimeout(() => {

        button.disabled = false;

        if (
          button.textContent !==
          "Tersimpan"
        ) {
          button.textContent =
            "Simpan";
        }

      }, 1500);
    }
  }

  window.loadSiswaPresensi =
    loadSiswa;

  window.simpanPresensiSatu =
    simpanSatu;

  document.addEventListener(
    "DOMContentLoaded",
    init
  );

})();
