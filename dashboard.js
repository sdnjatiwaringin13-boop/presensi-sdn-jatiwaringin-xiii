(function () {
  "use strict";

  const API_URL =
    "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";

  const user = Auth.requireLogin();

  document.addEventListener("DOMContentLoaded", initDashboard);


  async function initDashboard() {

    tampilkanUser();

    tampilkanTanggal();

    buatMenu();

    if (user.role === "ADMIN") {
      await loadAdminData();
    }

    if (user.role === "GURU") {
      await loadGuruData();
    }

    await loadPresensiHariIni();
  }


  function tampilkanUser() {

    const nama =
      user.nama ||
      user.username ||
      "Pengguna";

    const role =
      user.role ||
      "-";

    document.getElementById("dashboardUserName")
      .textContent = nama;

    document.getElementById("dashboardRole")
      .textContent = role;

    document.getElementById("dashboardGreeting")
      .textContent =
      "Selamat datang, " + nama + ".";
  }


  function tampilkanTanggal() {

    const sekarang = new Date();

    const tanggal =
      sekarang.toLocaleDateString(
        "id-ID",
        {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric"
        }
      );

    document.getElementById("tanggalHariIni")
      .textContent = tanggal;
  }


  function buatMenu() {

    const menuGrid =
      document.getElementById("menuGrid");

    let menu = [];


    if (user.role === "ADMIN") {

      menu = [

        {
          icon: "⚙️",
          title: "Administrasi",
          description: "Menu administrasi sistem",
          url: "admin.html"
        },

        {
          icon: "👨‍🎓",
          title: "Data Siswa",
          description: "Kelola data siswa",
          url: "siswa.html"
        },

        {
          icon: "👨‍🏫",
          title: "Data Guru",
          description: "Kelola data guru",
          url: "guru.html"
        },

        {
          icon: "🏫",
          title: "Data Kelas",
          description: "Kelola data kelas",
          url: "kelas.html"
        },

        {
          icon: "📱",
          title: "Kartu QR Siswa",
          description: "Cetak kartu QR siswa",
          url: "kartu.html"
        },

        {
          icon: "📷",
          title: "Scan Presensi",
          description: "Presensi menggunakan QR",
          url: "scan.html"
        },

        {
          icon: "📊",
          title: "Rekap Bulanan",
          description: "Lihat rekap absensi",
          url: "absen-bulanan.html"
        },

        {
          icon: "⚙️",
          title: "Pengaturan",
          description: "Pengaturan sekolah",
          url: "pengaturan.html"
        }

      ];

    } else {

      menu = [

        {
          icon: "📝",
          title: "Presensi Siswa",
          description: "Input presensi siswa",
          url: "presensi.html"
        },

        {
          icon: "📷",
          title: "Scan QR",
          description: "Presensi dengan QR siswa",
          url: "scan.html"
        },

        {
          icon: "📊",
          title: "Rekap Bulanan",
          description: "Lihat rekap presensi",
          url: "absen-bulanan.html"
        }

      ];

    }


    menuGrid.innerHTML = menu.map(item => `

      <a
        href="${item.url}"
        class="menu-card"
      >

        <div class="menu-icon">
          ${item.icon}
        </div>

        <div>
          <h3>${escapeHTML(item.title)}</h3>

          <p>
            ${escapeHTML(item.description)}
          </p>
        </div>

      </a>

    `).join("");
  }


  async function loadAdminData() {

    document.getElementById("adminStats")
      .style.display = "block";

    try {

      const [
        siswa,
        guru,
        kelas
      ] = await Promise.all([

        callAPI({
          action: "getSiswa",
          aktifOnly: false
        }),

        callAPI({
          action: "getGuru"
        }),

        callAPI({
          action: "getKelas"
        })

      ]);


      if (siswa.success) {

        document.getElementById("totalSiswa")
          .textContent =
          siswa.data.length;

      }


      if (guru.success) {

        document.getElementById("totalGuru")
          .textContent =
          guru.data.length;

      }


      if (kelas.success) {

        document.getElementById("totalKelas")
          .textContent =
          kelas.data.length;

      }

    } catch (error) {

      console.error(error);

    }

  }


  async function loadGuruData() {

    document.getElementById("guruInfoCard")
      .style.display = "block";


    try {

      const result =
        await callAPI({

          action: "getKelasGuru",

          idGuru: user.idGuru

        });


      if (
        !result.success ||
        !result.data ||
        !result.data.length
      ) {

        document.getElementById("guruName")
          .textContent =
          user.nama || "-";

        document.getElementById("guruClass")
          .textContent =
          "Belum ada kelas";

        return;
      }


      const kelas = result.data[0];


      document.getElementById("guruName")
        .textContent =
        user.nama || "-";


      document.getElementById("guruClass")
        .textContent =
        kelas.NAMA_KELAS || "-";

    } catch (error) {

      console.error(error);

    }

  }


  async function loadPresensiHariIni() {

    try {

      const tanggal =
        getToday();


      const payload = {
        action: "getRekap",
        tanggal: tanggal
      };


      if (user.role === "GURU") {

        try {

          const kelasResult =
            await callAPI({

              action: "getKelasGuru",

              idGuru: user.idGuru

            });


          if (
            kelasResult.success &&
            kelasResult.data &&
            kelasResult.data.length
          ) {

            payload.kelas =
              kelasResult.data[0].NAMA_KELAS;

          }

        } catch (error) {

          console.error(error);

        }

      }


      const result =
        await callAPI(payload);


      if (!result.success) {
        return;
      }


      const counts =
        result.counts || {};


      document.getElementById("attendanceHadir")
        .textContent =
        counts.HADIR || 0;


      document.getElementById("attendanceIzin")
        .textContent =
        counts.IZIN || 0;


      document.getElementById("attendanceSakit")
        .textContent =
        counts.SAKIT || 0;


      document.getElementById("attendanceAlpa")
        .textContent =
        counts.ALPA || 0;

    } catch (error) {

      console.error(error);

    }

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

          body: JSON.stringify(payload)
        }
      );


    return await response.json();

  }


  function getToday() {

    const now = new Date();

    const year =
      now.getFullYear();

    const month =
      String(now.getMonth() + 1)
        .padStart(2, "0");

    const day =
      String(now.getDate())
        .padStart(2, "0");

    return `${year}-${month}-${day}`;

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
