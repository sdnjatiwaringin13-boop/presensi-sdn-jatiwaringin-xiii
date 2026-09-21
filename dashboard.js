"use strict";

(function () {

  const $ = (id) => document.getElementById(id);

  let user = null;

  function init() {

    user = getCurrentUser();

    if (!user) {
      location.href = "index.html";
      return;
    }

    renderUser();

    bindEvents();

    loadDashboard();
  }

  function renderUser() {

    const nama =
      user.nama ||
      user.username ||
      "Pengguna";

    const role =
      String(user.role || "")
        .toUpperCase();

    setText("namaUser", nama);
    setText("userName", nama);
    setText("roleUser", role);
    setText("userRole", role);

    setText(
      "welcomeUser",
      `Selamat datang, ${nama}`
    );
  }

  function bindEvents() {

    $("refreshButton")?.addEventListener(
      "click",
      loadDashboard
    );

  }

  async function loadDashboard() {

    setLoading(true);

    try {

      const [
        siswaResult,
        guruResult,
        kelasResult,
        rekapResult
      ] = await Promise.all([

        callAPI({
          action: "getSiswa",
          aktifOnly: true
        }),

        callAPI({
          action: "getGuru"
        }),

        callAPI({
          action: "getKelas"
        }),

        callAPI({
          action: "getRekap"
        })

      ]);

      const siswa =
        siswaResult.success &&
        Array.isArray(siswaResult.data)
          ? siswaResult.data
          : [];

      const guru =
        guruResult.success &&
        Array.isArray(guruResult.data)
          ? guruResult.data
          : [];

      const kelas =
        kelasResult.success &&
        Array.isArray(kelasResult.data)
          ? kelasResult.data
          : [];

      const rekap =
        rekapResult.success &&
        Array.isArray(rekapResult.data)
          ? rekapResult.data
          : [];

      renderStatistics(
        siswa,
        guru,
        kelas,
        rekap
      );

      renderTodayAttendance(
        rekap
      );

    } catch (error) {

      console.error(error);

      showError(error.message);

    } finally {

      setLoading(false);

    }
  }

  function renderStatistics(
    siswa,
    guru,
    kelas,
    rekap
  ) {

    setNumber(
      "jumlahSiswa",
      siswa.length
    );

    setNumber(
      "jumlahGuru",
      guru.length
    );

    setNumber(
      "jumlahKelas",
      kelas.length
    );

    const today =
      todayString();

    const todayRows =
      rekap.filter(row =>
        normalizeDate(row.TANGGAL) === today
      );

    const hadir =
      todayRows.filter(row =>
        String(row.STATUS)
          .toUpperCase() === "HADIR"
      ).length;

    const izin =
      todayRows.filter(row =>
        String(row.STATUS)
          .toUpperCase() === "IZIN"
      ).length;

    const sakit =
      todayRows.filter(row =>
        String(row.STATUS)
          .toUpperCase() === "SAKIT"
      ).length;

    const alpa =
      todayRows.filter(row =>
        String(row.STATUS)
          .toUpperCase() === "ALPA"
      ).length;

    setNumber("jumlahHadir", hadir);
    setNumber("jumlahIzin", izin);
    setNumber("jumlahSakit", sakit);
    setNumber("jumlahAlpa", alpa);
  }

  function renderTodayAttendance(rows) {

    const table = $("dashboardTable");

    if (!table) return;

    const today = todayString();

    const data = rows.filter(row =>
      normalizeDate(row.TANGGAL) === today
    );

    if (!data.length) {

      table.innerHTML = `
        <tr>
          <td colspan="7" class="empty">
            Belum ada presensi hari ini.
          </td>
        </tr>
      `;

      return;
    }

    table.innerHTML = data.map(
      (row, index) => {

        const status =
          String(row.STATUS || "")
            .toUpperCase();

        return `
          <tr>
            <td>${index + 1}</td>

            <td>
              ${escapeHTML(
                row.NISN || "-"
              )}
            </td>

            <td>
              ${escapeHTML(
                row.NAMA || "-"
              )}
            </td>

            <td>
              ${escapeHTML(
                row.KELAS || "-"
              )}
            </td>

            <td>
              ${escapeHTML(
                row.JAM || "-"
              )}
            </td>

            <td>
              <span class="status-${status.toLowerCase()}">
                ${escapeHTML(status)}
              </span>
            </td>

            <td>
              ${escapeHTML(
                row.SUMBER || "-"
              )}
            </td>
          </tr>
        `;
      }
    ).join("");
  }

  function normalizeDate(value) {

    if (!value) return "";

    const text =
      String(value);

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      return text;
    }

    const date =
      new Date(value);

    if (isNaN(date.getTime())) {
      return text.substring(0, 10);
    }

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

  function todayString() {

    const date = new Date();

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

  function setNumber(id, value) {

    const el = $(id);

    if (el) {
      el.textContent =
        Number(value || 0)
          .toLocaleString("id-ID");
    }
  }

  function setText(id, value) {

    const el = $(id);

    if (el) {
      el.textContent =
        value ?? "";
    }
  }

  function setLoading(state) {

    document.body.classList.toggle(
      "loading-dashboard",
      state
    );
  }

  function showError(message) {

    const el = $("dashboardError");

    if (el) {
      el.textContent = message;
      el.style.display = "block";
    } else {
      console.error(message);
    }
  }

  window.loadDashboard =
    loadDashboard;

  document.addEventListener(
    "DOMContentLoaded",
    init
  );

})();
