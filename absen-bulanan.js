/* =========================================================
   ABSEN BULANAN
   SD NEGERI JATIWARINGIN XIII
   ========================================================= */

(function () {

  "use strict";


  /* =======================================================
     VARIABEL GLOBAL
     ======================================================= */

  let dataLaporan = null;
  let dataSiswa = [];

  let currentUser = null;


  /* =======================================================
     SAAT HALAMAN SELESAI DIMUAT
     ======================================================= */

  document.addEventListener("DOMContentLoaded", function () {

    console.log("absen-bulanan.js aktif.");

    initHalaman();

  });


  /* =======================================================
     INISIALISASI HALAMAN
     ======================================================= */

  function initHalaman() {

    if (typeof Auth !== "undefined" && Auth.requireRole) {
      currentUser = Auth.requireRole(["ADMIN", "GURU"]);
      if (!currentUser) return;
    }

    setDefaultTanggal();

    ambilUserLogin();

    pasangEvent();

  }


  /* =======================================================
     AMBIL USER LOGIN
     ======================================================= */

  function ambilUserLogin() {

    try {

      /*
       * Beberapa versi auth.js menggunakan:
       * localStorage.getItem("user")
       *
       * Kita cek beberapa kemungkinan agar lebih kompatibel.
       */

      let user = null;

      // auth.js adalah sumber utama user login aplikasi ini.
      if (typeof Auth !== "undefined" && Auth.getCurrentUser) {
        user = Auth.getCurrentUser();
      }

      const kandidat = [
        "presensiUser",
        "user",
        "currentUser",
        "loggedUser",
        "loginUser"
      ];

      for (let i = 0; i < kandidat.length && !user; i++) {

        const value = localStorage.getItem(kandidat[i]);

        if (!value) {
          continue;
        }

        try {

          const parsed = JSON.parse(value);

          if (parsed) {
            user = parsed;
            break;
          }

        } catch (err) {

          console.warn(
            "Tidak dapat membaca localStorage:",
            kandidat[i]
          );

        }

      }


      /*
       * Jika auth.js menyediakan variabel global
       */

      if (!user && typeof window.currentUser !== "undefined") {
        user = window.currentUser;
      }


      if (!user && typeof window.user !== "undefined") {
        user = window.user;
      }


      currentUser = user || {};


      console.log(
        "User laporan:",
        currentUser
      );


      loadGuru();

    } catch (error) {

      console.error(
        "Gagal mengambil user login:",
        error
      );

      loadGuru();

    }

  }


  /* =======================================================
     DEFAULT BULAN DAN TAHUN
     ======================================================= */

  function setDefaultTanggal() {

    const sekarang = new Date();

    const bulan = sekarang.getMonth() + 1;

    const tahun = sekarang.getFullYear();


    const pilihBulan = document.getElementById(
      "pilihBulan"
    );

    const pilihTahun = document.getElementById(
      "pilihTahun"
    );


    if (pilihBulan) {

      pilihBulan.value = String(bulan);

    }


    if (pilihTahun) {

      pilihTahun.value = String(tahun);

    }

  }


  /* =======================================================
     EVENT
     ======================================================= */

  function pasangEvent() {

    const btnTampilkan =
      document.getElementById("btnTampilkan");

    const btnExport =
      document.getElementById("btnExport");

    const btnPrint =
      document.getElementById("btnPrint");


    if (btnTampilkan) {

      btnTampilkan.addEventListener(
        "click",
        function () {

          tampilkanRekap();

        }
      );

    }


    if (btnExport) {

      btnExport.addEventListener(
        "click",
        function () {

          exportExcel();

        }
      );

    }


    if (btnPrint) {

      btnPrint.addEventListener(
        "click",
        function () {

          cetakLaporan();

        }
      );

    }

  }


  /* =======================================================
     LOAD GURU
     ======================================================= */

  function loadGuru() {

    const select =
      document.getElementById("pilihGuru");


    if (!select) {

      console.error(
        "Element #pilihGuru tidak ditemukan."
      );

      return;

    }


    select.innerHTML =
      '<option value="">Memuat data guru...</option>';



    /*
     * Tentukan role.
     */

    const role = String(
      currentUser.role ||
      currentUser.ROLE ||
      ""
    ).toUpperCase();


    const idGuru =
      currentUser.idGuru ||
      currentUser.ID_GURU ||
      currentUser.id_guru ||
      "";


    /*
     * Jika user adalah GURU,
     * cukup tampilkan guru yang sedang login.
     */

    if (
      role === "GURU" ||
      role === "WALI KELAS" ||
      role === "WALIKELAS"
    ) {

      if (idGuru) {

        loadGuruLogin(
          String(idGuru)
        );

        return;

      }

    }


    /*
     * ADMIN:
     * Ambil semua guru.
     */

    callAPI({
      action: "getGuru"
    })
      .then(function (response) {

        console.log(
          "Response getGuru:",
          response
        );


        if (
          !response ||
          response.success === false
        ) {

          throw new Error(
            response && response.message
              ? response.message
              : "Gagal mengambil data guru."
          );

        }


        const guru =
          Array.isArray(response.data)
            ? response.data
            : [];


        renderGuruSelect(guru);

      })
      .catch(function (error) {

        console.error(
          "Gagal load guru:",
          error
        );


        select.innerHTML =
          '<option value="">Gagal memuat guru</option>';


        showStatus(
          "Gagal memuat daftar guru: " +
          getErrorMessage(error),
          "error"
        );

      });

  }


  /* =======================================================
     GURU LOGIN
     ======================================================= */

  function loadGuruLogin(idGuru) {

    const select =
      document.getElementById("pilihGuru");


    /*
     * Kita tetap mengambil daftar guru,
     * lalu mencari ID guru yang sedang login.
     */

    callAPI({
      action: "getGuru"
    })
      .then(function (response) {

        if (
          !response ||
          response.success === false
        ) {

          throw new Error(
            response && response.message
              ? response.message
              : "Gagal mengambil data guru."
          );

        }


        const semuaGuru =
          Array.isArray(response.data)
            ? response.data
            : [];


        const guru =
          semuaGuru.find(function (item) {

            return String(
              item.ID_GURU ||
              item.idGuru ||
              item.id_guru ||
              item.id ||
              ""
            ) === String(idGuru);

          });


        if (!guru) {

          select.innerHTML =
            '<option value="">Guru tidak ditemukan</option>';

          return;

        }


        renderGuruSelect(
          [guru]
        );


        select.value =
          String(
            guru.ID_GURU ||
            guru.idGuru ||
            guru.id_guru ||
            guru.id
          );


        /*
         * GURU hanya boleh menggunakan dirinya sendiri.
         */

        select.disabled = true;


      })
      .catch(function (error) {

        console.error(
          "Gagal load guru login:",
          error
        );


        select.innerHTML =
          '<option value="">Gagal memuat guru</option>';


        showStatus(
          "Gagal memuat data guru: " +
          getErrorMessage(error),
          "error"
        );

      });

  }


  /* =======================================================
     RENDER SELECT GURU
     ======================================================= */

  function renderGuruSelect(guruList) {

    const select =
      document.getElementById("pilihGuru");


    if (!select) {
      return;
    }


    select.disabled = false;


    select.innerHTML =
      '<option value="">-- Pilih Guru / Wali Kelas --</option>';


    if (
      !Array.isArray(guruList) ||
      guruList.length === 0
    ) {

      select.innerHTML =
        '<option value="">Belum ada data guru</option>';

      return;

    }


    guruList.forEach(function (guru) {

      const id =
        guru.ID_GURU ??
        guru.idGuru ??
        guru.id_guru ??
        guru.id ??
        "";


      const nama =
        guru.NAMA ??
        guru.nama ??
        guru.NAMA_GURU ??
        guru.namaGuru ??
        "Tanpa Nama";


      const status =
        guru.STATUS ??
        guru.status ??
        "";


      /*
       * Jika status tidak aktif,
       * tetap tidak ditampilkan.
       */

      if (
        String(status).toUpperCase() ===
        "NONAKTIF"
      ) {

        return;

      }


      const option =
        document.createElement("option");


      option.value = String(id);

      option.textContent =
        String(nama);


      select.appendChild(option);

    });

  }


  /* =======================================================
     TAMPILKAN REKAP
     ======================================================= */

  function tampilkanRekap() {

    const pilihGuru =
      document.getElementById("pilihGuru");

    const pilihBulan =
      document.getElementById("pilihBulan");

    const pilihTahun =
      document.getElementById("pilihTahun");


    const idGuru =
      pilihGuru
        ? String(pilihGuru.value || "").trim()
        : "";


    const bulan =
      pilihBulan
        ? parseInt(pilihBulan.value, 10)
        : NaN;


    const tahun =
      pilihTahun
        ? parseInt(pilihTahun.value, 10)
        : NaN;


    /*
     * Validasi
     */

    if (!idGuru) {

      showStatus(
        "Silakan pilih guru / wali kelas terlebih dahulu.",
        "error"
      );

      return;

    }


    if (
      !Number.isInteger(bulan) ||
      bulan < 1 ||
      bulan > 12
    ) {

      showStatus(
        "Bulan tidak valid.",
        "error"
      );

      return;

    }


    if (
      !Number.isInteger(tahun) ||
      tahun < 2000 ||
      tahun > 2100
    ) {

      showStatus(
        "Tahun tidak valid.",
        "error"
      );

      return;

    }


    /*
     * Sembunyikan laporan lama
     */

    const reportContainer =
      document.getElementById(
        "reportContainer"
      );


    if (reportContainer) {

      reportContainer.style.display =
        "none";

    }


    showStatus(
      "Sedang memuat laporan...",
      "info"
    );


    setLoadingButton(true);


    console.log(
      "Meminta laporan:",
      {
        idGuru: idGuru,
        bulan: bulan,
        tahun: tahun
      }
    );


    callAPI({
      action: "getAbsenBulanan",
      idGuru: idGuru,
      bulan: bulan,
      tahun: tahun
    })
      .then(function (response) {

        console.log(
          "Response getAbsenBulanan:",
          response
        );


        if (
          !response ||
          response.success === false
        ) {

          throw new Error(
            response && response.message
              ? response.message
              : "Laporan gagal dimuat."
          );

        }


        /*
         * Backend mengembalikan:
         *
         * {
         *   success: true,
         *   data: {...}
         * }
         */

        const data =
          response.data ||
          response;


        dataLaporan = data;


        dataSiswa =
          Array.isArray(data.siswa)
            ? data.siswa
            : [];


        renderInformasi(data);

        renderTable(data);

        loadPengaturanTambahan(data);


        if (reportContainer) {

          reportContainer.style.display =
            "block";

        }


        showStatus(
          "Laporan berhasil dimuat.",
          "success"
        );


      })
      .catch(function (error) {

        console.error(
          "Gagal mengambil laporan:",
          error
        );


        showStatus(
          "Gagal memuat laporan: " +
          getErrorMessage(error),
          "error"
        );


        clearTable();

      })
      .finally(function () {

        setLoadingButton(false);

      });

  }


  /* =======================================================
     RENDER INFORMASI LAPORAN
     ======================================================= */

  function renderInformasi(data) {

    const sekolah =
      data.sekolah || {};


    const kelas =
      data.kelas || {};


    const guru =
      data.guru || {};


    const bulan =
      Number(data.bulan) || 1;


    const tahun =
      Number(data.tahun) ||
      new Date().getFullYear();


    const jumlahHari =
      Number(data.jumlahHari) ||
      getJumlahHari(
        tahun,
        bulan
      );


    /*
     * Nama sekolah
     */

    setText(
      "namaSekolah",
      sekolah.nama ||
      sekolah.NAMA ||
      sekolah.namaSekolah ||
      "SD NEGERI JATIWARINGIN XIII"
    );


    /*
     * Periode
     */

    setText(
      "periodeLaporan",
      "Bulan " +
      namaBulan(bulan) +
      " " +
      tahun
    );


    /*
     * Kelas
     */

    setText(
      "infoKelas",
      kelas.nama ||
      kelas.NAMA_KELAS ||
      kelas.namaKelas ||
      "-"
    );


    /*
     * Guru
     */

    const namaGuru =
      guru.nama ||
      guru.NAMA ||
      guru.namaGuru ||
      "-";


    const nipGuru =
      guru.nip ||
      guru.NIP ||
      "-";


    setText(
      "infoGuru",
      namaGuru
    );


    setText(
      "infoNipGuru",
      nipGuru
    );


    /*
     * Jumlah hari
     */

    setText(
      "infoJumlahHari",
      jumlahHari +
      " hari"
    );


    /*
     * Signature guru
     */

    setText(
      "namaGuruSignature",
      namaGuru
    );


    setText(
      "nipGuruSignature",
      "NIP. " + nipGuru
    );


    /*
     * Kepala sekolah jika tersedia
     */

    const kepala =
      data.kepalaSekolah ||
      {};


    const namaKepala =
      kepala.nama ||
      kepala.NAMA ||
      "-";


    const nipKepala =
      kepala.nip ||
      kepala.NIP ||
      "-";


    setText(
      "namaKepalaSekolah",
      namaKepala
    );


    setText(
      "nipKepalaSekolah",
      "NIP. " + nipKepala
    );

  }


  /* =======================================================
     RENDER TABLE
     ======================================================= */

  function renderTable(data) {

    const table =
      document.getElementById(
        "rekapTable"
      );


    const colGroup =
      document.getElementById(
        "rekapColGroup"
      );


    const thead =
      document.getElementById(
        "rekapTableHead"
      );


    const tbody =
      document.getElementById(
        "rekapTableBody"
      );


    if (
      !table ||
      !thead ||
      !tbody
    ) {

      console.error(
        "Elemen tabel laporan tidak lengkap."
      );

      return;

    }


    const tahun =
      Number(data.tahun) ||
      new Date().getFullYear();


    const bulan =
      Number(data.bulan) || 1;


    const jumlahHari =
      Number(data.jumlahHari) ||
      getJumlahHari(
        tahun,
        bulan
      );


    const siswa =
      Array.isArray(data.siswa)
        ? data.siswa
        : [];


    /*
     * ============================================
     * BUAT COLGROUP
     * ============================================
     */

    if (colGroup) {

      colGroup.innerHTML = "";


      /*
       * No
       */

      colGroup.appendChild(
        createCol(38)
      );


      /*
       * NISN
       */

      colGroup.appendChild(
        createCol(105)
      );


      /*
       * Nama
       */

      colGroup.appendChild(
        createCol(190)
      );


      /*
       * Tanggal
       */

      for (
        let i = 1;
        i <= jumlahHari;
        i++
      ) {

        colGroup.appendChild(
          createCol(30)
        );

      }


      /*
       * Akumulasi
       */

      for (
        let i = 0;
        i < 4;
        i++
      ) {

        colGroup.appendChild(
          createCol(58)
        );

      }

    }


    /*
     * ============================================
     * HEADER
     * ============================================
     */

    const headerRow1 =
      thead.querySelector(
        "tr:first-child"
      );


    const headerRow2 =
      document.getElementById(
        "rekapSubHeader"
      );


    if (
      !headerRow1 ||
      !headerRow2
    ) {

      return;

    }


    /*
     * Buang header tanggal lama.
     *
     * Header awal mempunyai:
     *
     * No
     * NISN
     * Nama
     * TANGGAL
     * AKUMULASI
     */

    while (
      headerRow1.children.length > 4
    ) {

      headerRow1.removeChild(
        headerRow1.children[3]
      );

    }


    /*
     * Pastikan header tanggal ada.
     */

    let tanggalHeader =
      document.getElementById(
        "tanggalHeader"
      );


    if (!tanggalHeader) {

      tanggalHeader =
        document.createElement("th");

      tanggalHeader.id =
        "tanggalHeader";

      headerRow1.insertBefore(
        tanggalHeader,
        headerRow1.children[3]
      );

    }


    tanggalHeader.textContent =
      "TANGGAL";


    tanggalHeader.colSpan =
      jumlahHari;


    tanggalHeader.rowSpan = 1;


    /*
     * ============================================
     * HEADER TANGGAL
     * ============================================
     */

    headerRow2.innerHTML = "";


    for (
      let hari = 1;
      hari <= jumlahHari;
      hari++
    ) {

      const th =
        document.createElement("th");


      th.className =
        "date-header";


      th.textContent =
        String(hari);


      th.style.width =
        "30px";


      th.style.minWidth =
        "30px";


      th.style.maxWidth =
        "30px";


      /*
       * Minggu
       */

      const tanggal =
        new Date(
          tahun,
          bulan - 1,
          hari
        );


      if (
        tanggal.getDay() === 0
      ) {

        th.classList.add(
          "hari-minggu"
        );

      }


      headerRow2.appendChild(th);

    }


    /*
     * Tambahkan header akumulasi
     */

    const summaryHeaders = [
      {
        text: "Hadir",
        className:
          "summary-header summary-hadir"
      },
      {
        text: "Sakit",
        className:
          "summary-header summary-sakit"
      },
      {
        text: "Izin",
        className:
          "summary-header summary-izin"
      },
      {
        text: "Alpa",
        className:
          "summary-header summary-alpa"
      }
    ];


    summaryHeaders.forEach(
      function (item) {

        const th =
          document.createElement("th");


        th.className =
          item.className;


        th.textContent =
          item.text;


        th.style.width =
          "58px";


        th.style.minWidth =
          "58px";


        th.style.maxWidth =
          "58px";


        headerRow2.appendChild(th);

      }
    );


    /*
     * ============================================
     * BODY
     * ============================================
     */

    tbody.innerHTML = "";


    if (siswa.length === 0) {

      const tr =
        document.createElement("tr");


      const td =
        document.createElement("td");


      td.colSpan =
        3 +
        jumlahHari +
        4;


      td.textContent =
        "Tidak ada data siswa.";


      td.style.padding =
        "20px";


      td.style.textAlign =
        "center";


      tr.appendChild(td);

      tbody.appendChild(tr);

      return;

    }


    siswa.forEach(
      function (siswaItem, index) {

        const tr =
          document.createElement("tr");


        /*
         * -----------------------------------------
         * NO
         * -----------------------------------------
         */

        const tdNo =
          document.createElement("td");


        tdNo.textContent =
          String(index + 1);


        tr.appendChild(tdNo);


        /*
         * -----------------------------------------
         * NISN
         * -----------------------------------------
         */

        const tdNisn =
          document.createElement("td");


        tdNisn.textContent =
          siswaItem.nisn ??
          siswaItem.NISN ??
          "";


        tr.appendChild(tdNisn);


        /*
         * -----------------------------------------
         * NAMA
         * -----------------------------------------
         */

        const tdNama =
          document.createElement("td");


        tdNama.textContent =
          siswaItem.nama ??
          siswaItem.NAMA ??
          "";


        tdNama.title =
          tdNama.textContent;


        tr.appendChild(tdNama);


        /*
         * -----------------------------------------
         * DATA HARI
         * -----------------------------------------
         */

        const hariData =
          normalisasiHari(
            siswaItem.hari
          );


        let totalHadir = 0;
        let totalSakit = 0;
        let totalIzin = 0;
        let totalAlpa = 0;


        for (
          let hari = 1;
          hari <= jumlahHari;
          hari++
        ) {

          const td =
            document.createElement("td");


          td.className =
            "attendance-cell";


          td.style.width =
            "30px";


          td.style.minWidth =
            "30px";


          td.style.maxWidth =
            "30px";


          const nilai =
            ambilStatusHari(
              hariData,
              hari
            );


          const status =
            normalisasiStatus(
              nilai
            );


          /*
           * Tampilkan simbol
           */

          let simbol = "-";


          if (status === "HADIR") {

            simbol = "H";

            totalHadir++;

            td.classList.add(
              "status-hadir"
            );

          }

          else if (
            status === "SAKIT"
          ) {

            simbol = "S";

            totalSakit++;

            td.classList.add(
              "status-sakit"
            );

          }

          else if (
            status === "IZIN"
          ) {

            simbol = "I";

            totalIzin++;

            td.classList.add(
              "status-izin"
            );

          }

          else if (
            status === "ALPA"
          ) {

            simbol = "A";

            totalAlpa++;

            td.classList.add(
              "status-alpa"
            );

          }


          td.textContent =
            simbol;


          /*
           * Tooltip
           */

          td.title =
            "Tanggal " +
            hari +
            ": " +
            statusLabel(status);


          /*
           * Tandai Minggu
           */

          const tanggal =
            new Date(
              tahun,
              bulan - 1,
              hari
            );


          if (
            tanggal.getDay() === 0
          ) {

            td.classList.add(
              "hari-minggu"
            );

          }


          tr.appendChild(td);

        }


        /*
         * -----------------------------------------
         * AKUMULASI HADIR
         * -----------------------------------------
         */

        tr.appendChild(
          createSummaryCell(
            totalHadir,
            "summary-cell summary-hadir"
          )
        );


        /*
         * -----------------------------------------
         * AKUMULASI SAKIT
         * -----------------------------------------
         */

        tr.appendChild(
          createSummaryCell(
            totalSakit,
            "summary-cell summary-sakit"
          )
        );


        /*
         * -----------------------------------------
         * AKUMULASI IZIN
         * -----------------------------------------
         */

        tr.appendChild(
          createSummaryCell(
            totalIzin,
            "summary-cell summary-izin"
          )
        );


        /*
         * -----------------------------------------
         * AKUMULASI ALPA
         * -----------------------------------------
         */

        tr.appendChild(
          createSummaryCell(
            totalAlpa,
            "summary-cell summary-alpa"
          )
        );


        tbody.appendChild(tr);

      }
    );

  }


  /* =======================================================
     NORMALISASI DATA HARI
     ======================================================= */

  function normalisasiHari(hari) {

    if (!hari) {
      return {};
    }


    /*
     * Jika object:
     */

    if (
      typeof hari === "object" &&
      !Array.isArray(hari)
    ) {

      return hari;

    }


    /*
     * Jika array:
     */

    if (Array.isArray(hari)) {

      const result = {};


      hari.forEach(
        function (item, index) {

          /*
           * Array bisa berupa:
           *
           * ["H","H","I"]
           *
           * atau:
           *
           * [
           *   {hari:1,status:"H"},
           *   ...
           * ]
           */

          if (
            item &&
            typeof item === "object"
          ) {

            const nomor =
              item.hari ??
              item.tanggal ??
              item.day ??
              index + 1;


            const status =
              item.status ??
              item.STATUS ??
              item.nilai ??
              item.value ??
              "";


            result[String(nomor)] =
              status;

          }

          else {

            result[String(index + 1)] =
              item;

          }

        }
      );


      return result;

    }


    return {};

  }


  /* =======================================================
     AMBIL STATUS HARI
     ======================================================= */

  function ambilStatusHari(
    hariData,
    hari
  ) {

    if (!hariData) {
      return "";
    }


    /*
     * Bentuk:
     *
     * {1:"H",2:"I"}
     */

    const direct =
      hariData[String(hari)];


    if (
      direct !== undefined &&
      direct !== null
    ) {

      return direct;

    }


    /*
     * Bentuk number key
     */

    if (
      hariData[hari] !== undefined &&
      hariData[hari] !== null
    ) {

      return hariData[hari];

    }


    /*
     * Beberapa kemungkinan nama property
     */

    const kandidat = [
      "tanggal" + hari,
      "hari" + hari,
      "day" + hari
    ];


    for (
      let i = 0;
      i < kandidat.length;
      i++
    ) {

      if (
        hariData[kandidat[i]] !==
        undefined
      ) {

        return hariData[kandidat[i]];

      }

    }


    return "";

  }


  /* =======================================================
     NORMALISASI STATUS
     ======================================================= */

  function normalisasiStatus(value) {

    if (
      value === null ||
      value === undefined
    ) {

      return "";

    }


    /*
     * Jika value object
     */

    if (
      typeof value === "object"
    ) {

      value =
        value.status ??
        value.STATUS ??
        value.nilai ??
        value.value ??
        "";

    }


    const status =
      String(value)
        .trim()
        .toUpperCase();


    /*
     * HADIR
     */

    if (
      status === "H" ||
      status === "HADIR" ||
      status === "PRESENT"
    ) {

      return "HADIR";

    }


    /*
     * SAKIT
     */

    if (
      status === "S" ||
      status === "SAKIT"
    ) {

      return "SAKIT";

    }


    /*
     * IZIN
     */

    if (
      status === "I" ||
      status === "IZIN"
    ) {

      return "IZIN";

    }


    /*
     * ALPA
     */

    if (
      status === "A" ||
      status === "ALPA" ||
      status === "ALPHA"
    ) {

      return "ALPA";

    }


    return "";

  }


  /* =======================================================
     LABEL STATUS
     ======================================================= */

  function statusLabel(status) {

    switch (status) {

      case "HADIR":
        return "Hadir";

      case "SAKIT":
        return "Sakit";

      case "IZIN":
        return "Izin";

      case "ALPA":
        return "Alpa";

      default:
        return "Tidak ada data";

    }

  }


  /* =======================================================
     LOAD PENGATURAN TAMBAHAN
     ======================================================= */

  function loadPengaturanTambahan(data) {

    /*
     * Jika backend sudah mengirim kepala sekolah,
     * tidak perlu request lagi.
     */

    if (
      data &&
      data.kepalaSekolah
    ) {

      return;

    }


    callAPI({
      action: "getPengaturan"
    })
      .then(function (response) {

        console.log(
          "Response pengaturan:",
          response
        );


        if (
          !response ||
          response.success === false
        ) {

          return;

        }


        const setting =
          response.data ||
          {};


        const nama =
          setting.namaKepalaSekolah ||
          setting.NAMA_KEPALA_SEKOLAH ||
          "-";


        const nip =
          setting.nipKepalaSekolah ||
          setting.NIP_KEPALA_SEKOLAH ||
          "-";


        setText(
          "namaKepalaSekolah",
          nama
        );


        setText(
          "nipKepalaSekolah",
          "NIP. " + nip
        );

      })
      .catch(function (error) {

        console.warn(
          "Pengaturan tidak berhasil dimuat:",
          error
        );

      });

  }


  /* =======================================================
     EXPORT EXCEL
     ======================================================= */

  function exportExcel() {

    if (
      !dataLaporan ||
      !Array.isArray(
        dataLaporan.siswa
      )
    ) {

      showStatus(
        "Tampilkan laporan terlebih dahulu.",
        "error"
      );

      return;

    }


    /*
     * Pastikan XLSX tersedia.
     */

    if (
      typeof XLSX === "undefined"
    ) {

      showStatus(
        "Library Excel belum dimuat. Periksa koneksi internet.",
        "error"
      );

      return;

    }


    const data =
      dataLaporan;


    const tahun =
      Number(data.tahun);


    const bulan =
      Number(data.bulan);


    const jumlahHari =
      Number(data.jumlahHari) ||
      getJumlahHari(
        tahun,
        bulan
      );


    const rows = [];


    /*
     * HEADER
     */

    const header1 = [
      "No",
      "NISN",
      "Nama Siswa"
    ];


    for (
      let hari = 1;
      hari <= jumlahHari;
      hari++
    ) {

      header1.push(
        String(hari)
      );

    }


    header1.push(
      "Hadir",
      "Sakit",
      "Izin",
      "Alpa"
    );


    rows.push(header1);


    /*
     * DATA SISWA
     */

    data.siswa.forEach(
      function (siswaItem, index) {

        const row = [
          index + 1,

          siswaItem.nisn ??
          siswaItem.NISN ??
          "",

          siswaItem.nama ??
          siswaItem.NAMA ??
          ""
        ];


        const hariData =
          normalisasiHari(
            siswaItem.hari
          );


        let hadir = 0;
        let sakit = 0;
        let izin = 0;
        let alpa = 0;


        for (
          let hari = 1;
          hari <= jumlahHari;
          hari++
        ) {

          const nilai =
            ambilStatusHari(
              hariData,
              hari
            );


          const status =
            normalisasiStatus(
              nilai
            );


          let simbol = "";


          if (status === "HADIR") {

            simbol = "H";

            hadir++;

          }

          else if (
            status === "SAKIT"
          ) {

            simbol = "S";

            sakit++;

          }

          else if (
            status === "IZIN"
          ) {

            simbol = "I";

            izin++;

          }

          else if (
            status === "ALPA"
          ) {

            simbol = "A";

            alpa++;

          }


          row.push(simbol);

        }


        row.push(
          hadir,
          sakit,
          izin,
          alpa
        );


        rows.push(row);

      }
    );


    /*
     * BUAT WORKBOOK
     */

    const workbook =
      XLSX.utils.book_new();


    const worksheet =
      XLSX.utils.aoa_to_sheet(
        rows
      );


    /*
     * Lebar kolom
     */

    const widths = [
      { wch: 5 },
      { wch: 16 },
      { wch: 30 }
    ];


    for (
      let i = 0;
      i < jumlahHari;
      i++
    ) {

      widths.push({
        wch: 5
      });

    }


    widths.push(
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 }
    );


    worksheet["!cols"] =
      widths;


    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Absensi Bulanan"
    );


    /*
     * Nama file
     */

    const namaGuru =
      data.guru &&
      (
        data.guru.nama ||
        data.guru.NAMA
      )
        ? (
          data.guru.nama ||
          data.guru.NAMA
        )
        : "Guru";


    const namaFile =
      "Laporan_Absensi_" +
      bersihkanNamaFile(
        namaGuru
      ) +
      "_" +
      namaBulan(bulan) +
      "_" +
      tahun +
      ".xlsx";


    XLSX.writeFile(
      workbook,
      namaFile
    );


    showStatus(
      "File Excel berhasil dibuat.",
      "success"
    );

  }


  /* =======================================================
     CETAK
     ======================================================= */

  function cetakLaporan() {

    if (!dataLaporan) {

      showStatus(
        "Tampilkan laporan terlebih dahulu.",
        "error"
      );

      return;

    }


    window.print();

  }


  /* =======================================================
     CLEAR TABLE
     ======================================================= */

  function clearTable() {

    const tbody =
      document.getElementById(
        "rekapTableBody"
      );


    if (!tbody) {
      return;
    }


    tbody.innerHTML = "";


    const tr =
      document.createElement("tr");


    const td =
      document.createElement("td");


    const jumlahHari =
      dataLaporan &&
      dataLaporan.jumlahHari
        ? Number(
            dataLaporan.jumlahHari
          )
        : 31;


    td.colSpan =
      3 +
      jumlahHari +
      4;


    td.textContent =
      "Tidak ada data laporan.";


    td.style.padding =
      "20px";


    td.style.textAlign =
      "center";


    tr.appendChild(td);


    tbody.appendChild(tr);

  }


  /* =======================================================
     CREATE COL
     ======================================================= */

  function createCol(width) {

    const col =
      document.createElement("col");


    col.style.width =
      width + "px";


    col.style.minWidth =
      width + "px";


    col.style.maxWidth =
      width + "px";


    return col;

  }


  /* =======================================================
     CREATE SUMMARY CELL
     ======================================================= */

  function createSummaryCell(
    value,
    className
  ) {

    const td =
      document.createElement("td");


    td.className =
      className;


    td.textContent =
      String(value);


    td.style.width =
      "58px";


    td.style.minWidth =
      "58px";


    td.style.maxWidth =
      "58px";


    return td;

  }


  /* =======================================================
     JUMLAH HARI
     ======================================================= */

  function getJumlahHari(
    tahun,
    bulan
  ) {

    return new Date(
      tahun,
      bulan,
      0
    ).getDate();

  }


  /* =======================================================
     NAMA BULAN
     ======================================================= */

  function namaBulan(bulan) {

    const daftar = [
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


    return daftar[
      Number(bulan)
    ] || "";

  }


  /* =======================================================
     SET TEXT
     ======================================================= */

  function setText(
    id,
    value
  ) {

    const element =
      document.getElementById(id);


    if (!element) {
      return;
    }


    element.textContent =
      value == null
        ? ""
        : String(value);

  }


  /* =======================================================
     STATUS MESSAGE
     ======================================================= */

  function showStatus(
    message,
    type
  ) {

    const element =
      document.getElementById(
        "statusMessage"
      );


    if (!element) {

      console.log(
        "[" + type + "]",
        message
      );

      return;

    }


    element.className = "";


    element.classList.add(
      type || "info"
    );


    element.textContent =
      message;


    element.style.display =
      "block";

  }


  /* =======================================================
     BUTTON LOADING
     ======================================================= */

  function setLoadingButton(
    loading
  ) {

    const button =
      document.getElementById(
        "btnTampilkan"
      );


    if (!button) {
      return;
    }


    if (loading) {

      button.disabled = true;

      button.dataset.oldText =
        button.textContent;


      button.textContent =
        "Memuat...";

    }

    else {

      button.disabled = false;


      button.textContent =
        button.dataset.oldText ||
        "Tampilkan";

    }

  }


  /* =======================================================
     ERROR MESSAGE
     ======================================================= */

  function getErrorMessage(
    error
  ) {

    if (!error) {
      return "Kesalahan tidak diketahui.";
    }


    if (
      typeof error === "string"
    ) {

      return error;

    }


    if (
      error.message
    ) {

      return error.message;

    }


    try {

      return JSON.stringify(
        error
      );

    } catch (e) {

      return String(error);

    }

  }


  /* =======================================================
     BERSIHKAN NAMA FILE
     ======================================================= */

  function bersihkanNamaFile(
    nama
  ) {

    return String(nama || "Guru")
      .replace(
        /[\\\/:*?"<>|]/g,
        "_"
      )
      .replace(
        /\s+/g,
        "_"
      );

  }


})();
