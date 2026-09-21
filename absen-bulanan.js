(function () {
  "use strict";

  const API_URL =
    "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";

  const currentUser = Auth.requireRole([
    "ADMIN",
    "GURU"
  ]);

  let reportData = null;
  let guruList = [];

  const namaBulan = [
    "",
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember"
  ];

  document.addEventListener(
    "DOMContentLoaded",
    init
  );

  async function init() {

    const sekarang = new Date();

    document.getElementById("bulan").value =
      sekarang.getMonth() + 1;

    document.getElementById("tahun").value =
      sekarang.getFullYear();

    document
      .getElementById("btnTampilkan")
      .addEventListener(
        "click",
        tampilkanRekap
      );

    document
      .getElementById("btnCetak")
      .addEventListener(
        "click",
        () => window.print()
      );

    document
      .getElementById("btnExcel")
      .addEventListener(
        "click",
        downloadExcel
      );

    await loadGuru();

    if (currentUser.role === "GURU") {
      document.getElementById("guruWrapper")
        .style.display = "none";

      await tampilkanRekap();
    }
  }

  async function loadGuru() {

    try {

      const select =
        document.getElementById(
          "pilihGuru"
        );

      if (currentUser.role === "GURU") {

        select.innerHTML = `
          <option value="${escapeHTML(
            currentUser.idGuru
          )}">
            ${escapeHTML(
              currentUser.nama || "Guru"
            )}
          </option>
        `;

        return;
      }

      const result =
        await callAPI({
          action: "getGuru"
        });

      if (!result.success) {
        throw new Error(result.message);
      }

      guruList = result.data || [];

      select.innerHTML = `
        <option value="">
          Pilih guru / wali kelas
        </option>
      `;

      guruList.forEach(guru => {

        const option =
          document.createElement("option");

        option.value =
          guru.ID_GURU;

        option.textContent =
          guru.NAMA;

        select.appendChild(option);

      });

    } catch (error) {

      tampilkanPesan(
        error.message,
        "error"
      );

    }
  }

  async function tampilkanRekap() {

    const idGuru =
      currentUser.role === "GURU"
        ? currentUser.idGuru
        : document.getElementById(
            "pilihGuru"
          ).value;

    const bulan =
      Number(
        document.getElementById(
          "bulan"
        ).value
      );

    const tahun =
      Number(
        document.getElementById(
          "tahun"
        ).value
      );

    if (!idGuru) {

      tampilkanPesan(
        "Silakan pilih guru / wali kelas.",
        "error"
      );

      return;
    }

    if (
      !bulan ||
      bulan < 1 ||
      bulan > 12
    ) {

      tampilkanPesan(
        "Bulan tidak valid.",
        "error"
      );

      return;
    }

    if (
      !tahun ||
      tahun < 2020
    ) {

      tampilkanPesan(
        "Tahun tidak valid.",
        "error"
      );

      return;
    }

    const button =
      document.getElementById(
        "btnTampilkan"
      );

    button.disabled = true;
    button.textContent =
      "Memuat...";

    try {

      const result =
        await callAPI({

          action:
            "getAbsenBulanan",

          idGuru:
            idGuru,

          bulan:
            bulan,

          tahun:
            tahun

        });

      if (!result.success) {
        throw new Error(
          result.message
        );
      }

      reportData =
        result.data;

      renderReport();

    } catch (error) {

      tampilkanPesan(
        error.message,
        "error"
      );

    } finally {

      button.disabled = false;
      button.textContent =
        "Tampilkan Rekap";
    }
  }

  function renderReport() {

    if (!reportData) {
      return;
    }

    const sekolah =
      reportData.sekolah || {};

    const kelas =
      reportData.kelas || {};

    const guru =
      reportData.guru || {};

    const kepala =
      reportData.kepalaSekolah || {};

    document.getElementById(
      "reportKelas"
    ).textContent =
      kelas.nama || "-";

    document.getElementById(
      "reportGuru"
    ).textContent =
      guru.nama || "-";

    document.getElementById(
      "reportBulan"
    ).textContent =
      `${namaBulan[reportData.bulan] || "-"} ${
        reportData.tahun || ""
      }`;

    document.getElementById(
      "kepalaSekolah"
    ).textContent =
      kepala.nama || "-";

    document.getElementById(
      "nipKepala"
    ).textContent =
      kepala.nip
        ? "NIP. " + kepala.nip
        : "NIP. -";

    document.getElementById(
      "waliKelas"
    ).textContent =
      guru.nama || "-";

    document.getElementById(
      "nipWali"
    ).textContent =
      guru.nip
        ? "NIP. " + guru.nip
        : "NIP. -";

    const sekolahName =
      sekolah.nama ||
      "SD NEGERI JATIWARINGIN XIII";

    const header =
      document.querySelector(
        ".report-header h2"
      );

    if (header) {
      header.textContent =
        sekolahName;
    }

    renderTable();
  }

  function renderTable() {

    const thead =
      document.getElementById(
        "rekapTableHead"
      );

    const tbody =
      document.getElementById(
        "rekapTableBody"
      );

    const jumlahHari =
      Number(
        reportData.jumlahHari || 0
      );

    const siswa =
      reportData.siswa || [];

    let headHTML = `
      <tr>
        <th>No</th>
        <th>NISN</th>
        <th>Nama Siswa</th>
    `;

    for (
      let hari = 1;
      hari <= jumlahHari;
      hari++
    ) {

      headHTML += `
        <th>${hari}</th>
      `;

    }

    headHTML += `
      </tr>
    `;

    thead.innerHTML =
      headHTML;

    if (!siswa.length) {

      tbody.innerHTML = `
        <tr>
          <td
            colspan="${jumlahHari + 3}"
            class="text-center"
          >
            Tidak ada data siswa.
          </td>
        </tr>
      `;

      return;
    }

    tbody.innerHTML =
      siswa.map(
        (item, index) => {

          let row = `
            <tr>

              <td>
                ${index + 1}
              </td>

              <td>
                ${escapeHTML(
                  item.nisn
                )}
              </td>

              <td class="student-name">
                ${escapeHTML(
                  item.nama
                )}
              </td>
          `;

          for (
            let hari = 1;
            hari <= jumlahHari;
            hari++
          ) {

            const status =
              item.hari &&
              item.hari[hari]
                ? item.hari[hari]
                : "-";

            row += `
              <td class="attendance-cell status-${String(
                status
              ).toLowerCase()}">
                ${escapeHTML(status)}
              </td>
            `;

          }

          row += `
            </tr>
          `;

          return row;

        }
      ).join("");
  }

  function downloadExcel() {

    if (!reportData) {

      tampilkanPesan(
        "Tampilkan rekap terlebih dahulu.",
        "error"
      );

      return;
    }

    if (
      typeof XLSX === "undefined"
    ) {

      downloadCSV();

      return;
    }

    const jumlahHari =
      Number(
        reportData.jumlahHari || 0
      );

    const siswa =
      reportData.siswa || [];

    const rows = [];

    rows.push([
      "DAFTAR ABSENSI SISWA"
    ]);

    rows.push([
      reportData.sekolah?.nama ||
      "SD NEGERI JATIWARINGIN XIII"
    ]);

    rows.push([]);

    rows.push([
      "Kelas",
      reportData.kelas?.nama || "-"
    ]);

    rows.push([
      "Wali Kelas",
      reportData.guru?.nama || "-"
    ]);

    rows.push([
      "Bulan",
      `${namaBulan[
        reportData.bulan
      ] || "-"} ${reportData.tahun || ""}`
    ]);

    rows.push([]);

    const header = [
      "No",
      "NISN",
      "Nama Siswa"
    ];

    for (
      let hari = 1;
      hari <= jumlahHari;
      hari++
    ) {
      header.push(String(hari));
    }

    rows.push(header);

    siswa.forEach(
      (item, index) => {

        const row = [
          index + 1,
          item.nisn || "",
          item.nama || ""
        ];

        for (
          let hari = 1;
          hari <= jumlahHari;
          hari++
        ) {

          row.push(
            item.hari?.[hari] || "-"
          );

        }

        rows.push(row);
      }
    );

    rows.push([]);

    rows.push([
      "Keterangan",
      "H = Hadir, I = Izin, S = Sakit, A = Alpa, - = Belum ada data"
    ]);

    const worksheet =
      XLSX.utils.aoa_to_sheet(rows);

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Absensi"
    );

    const bulan =
      String(
        reportData.bulan
      ).padStart(2, "0");

    const namaFile =
      `Absensi-${reportData.kelas?.nama || "Kelas"}-${bulan}-${reportData.tahun}.xlsx`;

    XLSX.writeFile(
      workbook,
      namaFile
    );
  }

  function downloadCSV() {

    if (!reportData) {
      return;
    }

    const jumlahHari =
      Number(
        reportData.jumlahHari || 0
      );

    const siswa =
      reportData.siswa || [];

    const rows = [];

    const header = [
      "No",
      "NISN",
      "Nama Siswa"
    ];

    for (
      let hari = 1;
      hari <= jumlahHari;
      hari++
    ) {
      header.push(String(hari));
    }

    rows.push(header);

    siswa.forEach(
      (item, index) => {

        const row = [
          index + 1,
          item.nisn || "",
          item.nama || ""
        ];

        for (
          let hari = 1;
          hari <= jumlahHari;
          hari++
        ) {

          row.push(
            item.hari?.[hari] || "-"
          );

        }

        rows.push(row);
      }
    );

    const csv =
      rows
        .map(row =>
          row.map(value =>
            `"${String(value)
              .replace(/"/g, '""')}"`
          ).join(",")
        )
        .join("\n");

    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8;"
        }
      );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      "rekap-absensi.csv";

    link.click();

    URL.revokeObjectURL(url);
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
        "rekapMessage"
      );

    element.textContent =
      message;

    element.className =
      "message " +
      (
        type === "success"
          ? "message-success"
          : "message-error"
      );

    element.style.display =
      "block";

    setTimeout(() => {

      element.style.display =
        "none";

    }, 5000);
  }

  function escapeHTML(value) {

    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

})();
