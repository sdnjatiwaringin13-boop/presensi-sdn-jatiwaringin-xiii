"use strict";

(function () {

  let siswaData = [];
  let presensiHariIni = [];

  document.addEventListener(
    "DOMContentLoaded",
    init
  );

  async function init() {

    const user =
      Auth.requireLogin();

    if (!user) return;

    tampilkanUser(user);

    await loadDashboard();
  }

  function tampilkanUser(user) {

    const nama =
      user.nama ||
      user.username ||
      "Pengguna";

    setText(
      "topUserName",
      nama
    );

    setText(
      "sidebarUserName",
      nama
    );

    setText(
      "sidebarUserRole",
      Auth.getRole(user)
    );
  }

  async function loadDashboard() {

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

      siswaData =
        siswaResult.success &&
        Array.isArray(
          siswaResult.data
        )
          ? siswaResult.data
          : [];

      const guru =
        guruResult.success &&
        Array.isArray(
          guruResult.data
        )
          ? guruResult.data
          : [];

      const kelas =
        kelasResult.success &&
        Array.isArray(
          kelasResult.data
        )
          ? kelasResult.data
          : [];

      const semuaPresensi =
        rekapResult.success &&
        Array.isArray(
          rekapResult.data
        )
          ? rekapResult.data
          : [];

      presensiHariIni =
        semuaPresensi.filter(
          function (item) {
            return sameToday(
              item.TANGGAL
            );
          }
        );

      setText(
        "totalSiswa",
        siswaData.length
      );

      setText(
        "totalGuru",
        guru.length
      );

      setText(
        "totalKelas",
        kelas.length
      );

      renderStatistik();

      renderSudahAbsen();

      renderBelumAbsen();

    } catch (error) {

      console.error(
        "Dashboard:",
        error
      );

      setTableError(
        "tableBelumBody",
        4,
        error.message
      );

      setTableError(
        "tableSudahBody",
        5,
        error.message
      );
    }
  }

  function renderStatistik() {

    const hadir =
      countStatus("HADIR");

    const izin =
      countStatus("IZIN");

    const sakit =
      countStatus("SAKIT");

    const alpa =
      countStatus("ALPA");

    const sudahIDs =
      new Set(
        presensiHariIni.map(
          item =>
            String(item.ID || "")
        )
      );

    const belum =
      siswaData.filter(
        siswa =>
          !sudahIDs.has(
            String(siswa.ID || "")
          )
      ).length;

    setText(
      "totalHadir",
      hadir
    );

    setText(
      "totalIzin",
      izin
    );

    setText(
      "totalSakit",
      sakit
    );

    setText(
      "totalAlpa",
      alpa
    );

    setText(
      "totalBelumAbsen",
      belum
    );

    const total =
      hadir +
      izin +
      sakit +
      alpa;

    setText(
      "rekapHadir",
      hadir
    );

    setText(
      "rekapIzin",
      izin
    );

    setText(
      "rekapSakit",
      sakit
    );

    setText(
      "rekapAlpa",
      alpa
    );

    setText(
      "persenHadir",
      persen(hadir, total)
    );

    setText(
      "persenIzin",
      persen(izin, total)
    );

    setText(
      "persenSakit",
      persen(sakit, total)
    );

    setText(
      "persenAlpa",
      persen(alpa, total)
    );
  }

  function renderSudahAbsen() {

    const tbody =
      document.getElementById(
        "tableSudahBody"
      );

    if (!tbody) return;

    if (!presensiHariIni.length) {

      tbody.innerHTML = `
        <tr>
          <td
            colspan="5"
            class="empty"
          >
            Belum ada presensi hari ini.
          </td>
        </tr>
      `;

      return;
    }

    tbody.innerHTML =
      presensiHariIni.map(
        function (
          item,
          index
        ) {

          const status =
            String(
              item.STATUS || ""
            ).toUpperCase();

          return `
            <tr>
              <td>
                ${index + 1}
              </td>

              <td>
                ${escapeHTML(
                  item.NISN || "-"
                )}
              </td>

              <td>
                ${escapeHTML(
                  item.NAMA || "-"
                )}
              </td>

              <td>
                <span
                  class="badge badge-${status.toLowerCase()}"
                >
                  ${escapeHTML(status)}
                </span>
              </td>

              <td>
                ${escapeHTML(
                  item.JAM || "-"
                )}
              </td>
            </tr>
          `;
        }
      ).join("");
  }

  function renderBelumAbsen() {

    const tbody =
      document.getElementById(
        "tableBelumBody"
      );

    if (!tbody) return;

    const sudahIDs =
      new Set(
        presensiHariIni.map(
          item =>
            String(item.ID || "")
        )
      );

    const belum =
      siswaData.filter(
        siswa =>
          !sudahIDs.has(
            String(siswa.ID || "")
          )
      );

    if (!belum.length) {

      tbody.innerHTML = `
        <tr>
          <td
            colspan="4"
            class="empty"
          >
            Semua siswa sudah melakukan presensi.
          </td>
        </tr>
      `;

      return;
    }

    tbody.innerHTML =
      belum.map(
        function (
          siswa,
          index
        ) {

          return `
            <tr>
              <td>${index + 1}</td>

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
            </tr>
          `;
        }
      ).join("");
  }

  function countStatus(status) {

    return presensiHariIni.filter(
      item =>
        String(
          item.STATUS || ""
        ).toUpperCase() === status
    ).length;
  }

  function persen(
    jumlah,
    total
  ) {

    if (!total) {
      return "0%";
    }

    return (
      (
        jumlah /
        total *
        100
      ).toFixed(1) +
      "%"
    );
  }

  function sameToday(value) {

    if (!value) return false;

    const today =
      formatLocalDate(
        new Date()
      );

    const text =
      String(value);

    if (
      /^\d{4}-\d{2}-\d{2}$/
        .test(text)
    ) {
      return text === today;
    }

    const date =
      new Date(value);

    if (
      !isNaN(
        date.getTime()
      )
    ) {
      return (
        formatLocalDate(
          date
        ) === today
      );
    }

    return (
      text.substring(
        0,
        10
      ) === today
    );
  }

  function formatLocalDate(date) {

    return [
      date.getFullYear(),

      String(
        date.getMonth() + 1
      ).padStart(
        2,
        "0"
      ),

      String(
        date.getDate()
      ).padStart(
        2,
        "0"
      )
    ].join("-");
  }

  function setText(
    id,
    value
  ) {

    const element =
      document.getElementById(
        id
      );

    if (element) {
      element.textContent =
        value ?? "";
    }
  }

  function setTableError(
    id,
    colspan,
    message
  ) {

    const element =
      document.getElementById(
        id
      );

    if (!element) return;

    element.innerHTML = `
      <tr>
        <td
          colspan="${colspan}"
          class="error"
        >
          ${escapeHTML(message)}
        </td>
      </tr>
    `;
  }

  window.filterTable =
    function (
      tableId,
      keyword
    ) {

      const table =
        document.getElementById(
          tableId
        );

      if (!table) return;

      keyword =
        String(
          keyword || ""
        )
          .toLowerCase()
          .trim();

      table
        .querySelectorAll(
          "tbody tr"
        )
        .forEach(
          function (row) {

            row.style.display =
              row.textContent
                .toLowerCase()
                .includes(
                  keyword
                )
                ? ""
                : "none";
          }
        );
    };

})();
