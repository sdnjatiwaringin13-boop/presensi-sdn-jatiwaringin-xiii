"use strict";

/* =========================================================
   LAYOUT ADMINISTRATOR
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

  const user = getCurrentUser();

  if (!user) {
    location.href = "index.html";
    return;
  }

  buildLayout(user);

});


/* =========================================================
   BUILD LAYOUT
   ========================================================= */

function buildLayout(user) {

  const role =
    String(user.role || "")
      .toUpperCase();


  const nama =
    user.nama ||
    user.username ||
    "Administrator";


  const username =
    user.username ||
    "-";


  document.body.classList.add(
    "admin-layout"
  );


  /* =======================================================
     SIDEBAR
     ======================================================= */

  const sidebar =
    document.getElementById("sidebar");


  if (sidebar) {

    sidebar.innerHTML = `

      <div class="sidebar-brand">

        <div class="brand-icon">
          <i class="fa-solid fa-school"></i>
        </div>

        <div class="brand-text">

          <strong>Administrator</strong>

          <small>
            Presensi Sekolah
          </small>

        </div>

      </div>


      <div class="sidebar-user">

        <div class="sidebar-user-icon">
          <i class="fa-solid fa-user"></i>
        </div>

        <div>

          <strong>
            ${escapeHTML(nama)}
          </strong>

          <small>
            <span class="online-dot"></span>
            ${role}
          </small>

        </div>

      </div>


      <div class="menu-title">
        MENU UTAMA
      </div>


      <nav class="sidebar-menu">

        <a href="dashboard.html"
           class="menu-item"
           data-page="dashboard.html">

          <i class="fa-solid fa-gauge"></i>
          <span>Dashboard</span>

        </a>


        ${
          role === "ADMIN"
          ? `

          <div class="menu-group">

            <button
              type="button"
              class="menu-item menu-toggle"
              id="dataMasterToggle">

              <i class="fa-solid fa-database"></i>

              <span>Data Master</span>

              <i class="fa-solid fa-chevron-down arrow"></i>

            </button>


            <div
              class="submenu"
              id="dataMasterSubmenu">

              <a href="siswa.html"
                 data-page="siswa.html">

                <i class="fa-solid fa-user-graduate"></i>
                Data Siswa

              </a>


              <a href="guru.html"
                 data-page="guru.html">

                <i class="fa-solid fa-chalkboard-user"></i>
                Data Guru

              </a>


              <a href="kelas.html"
                 data-page="kelas.html">

                <i class="fa-solid fa-school"></i>
                Data Kelas

              </a>

            </div>

          </div>

          `
          : ""
        }


        ${
          role === "ADMIN"
          ? `

          <a href="scan.html"
             class="menu-item"
             data-page="scan.html">

            <i class="fa-solid fa-qrcode"></i>
            <span>Scan QR</span>

          </a>


          <a href="absen-bulanan.html"
             class="menu-item"
             data-page="absen-bulanan.html">

            <i class="fa-solid fa-calendar-days"></i>
            <span>Laporan Bulanan</span>

          </a>


          <a href="kartu.html"
             class="menu-item"
             data-page="kartu.html">

            <i class="fa-solid fa-id-card"></i>
            <span>Kartu Siswa</span>

          </a>


          <a href="pengaturan.html"
             class="menu-item"
             data-page="pengaturan.html">

            <i class="fa-solid fa-gear"></i>
            <span>Pengaturan</span>

          </a>

          `
          : `

          <a href="presensi.html"
             class="menu-item"
             data-page="presensi.html">

            <i class="fa-solid fa-calendar-check"></i>
            <span>Presensi</span>

          </a>


          <a href="scan.html"
             class="menu-item"
             data-page="scan.html">

            <i class="fa-solid fa-qrcode"></i>
            <span>Scan QR</span>

          </a>


          <a href="absen-bulanan.html"
             class="menu-item"
             data-page="absen-bulanan.html">

            <i class="fa-solid fa-calendar-days"></i>
            <span>Laporan Bulanan</span>

          </a>

          `
        }

      </nav>


      <div class="menu-title account-title">
        AKUN
      </div>


      <nav class="sidebar-menu">

        <a href="profil.html"
           class="menu-item">

          <i class="fa-solid fa-user"></i>
          <span>Profil</span>

        </a>


        <button
          type="button"
          id="logoutButton"
          class="menu-item logout-menu">

          <i class="fa-solid fa-right-from-bracket"></i>
          <span>Keluar</span>

        </button>

      </nav>

    `;

  }


  /* =======================================================
     TOPBAR
     ======================================================= */

  const topbar =
    document.getElementById("topbar");


  if (topbar) {

    topbar.innerHTML = `

      <div class="topbar-left">

        <button
          type="button"
          id="sidebarToggle"
          class="sidebar-toggle">

          <i class="fa-solid fa-bars"></i>

        </button>


        <div class="breadcrumb-title">

          <strong>
            Dashboard
          </strong>

          <small>
            Control Panel
          </small>

        </div>

      </div>


      <div class="topbar-right">

        <span class="school-name">
          SD Negeri Jatiwaringin XIII
        </span>


        <div class="profile-menu">

          <div class="profile-avatar">
            <i class="fa-solid fa-user"></i>
          </div>

          <strong>
            ${escapeHTML(nama)}
          </strong>

          <i class="fa-solid fa-chevron-down"></i>

        </div>

      </div>

    `;

  }


  /* =======================================================
     LOGOUT
     ======================================================= */

  const logoutButton =
    document.getElementById(
      "logoutButton"
    );


  if (logoutButton) {

    logoutButton.addEventListener(
      "click",
      function () {

        if (
          confirm(
            "Apakah Anda yakin ingin keluar?"
          )
        ) {

          logout();

        }

      }
    );

  }


  /* =======================================================
     SIDEBAR TOGGLE
     ======================================================= */

  const toggle =
    document.getElementById(
      "sidebarToggle"
    );


  if (toggle) {

    toggle.addEventListener(
      "click",
      function () {

        document.body.classList.toggle(
          "sidebar-collapsed"
        );

      }
    );

  }


  /* =======================================================
     DATA MASTER TOGGLE
     ======================================================= */

  const masterToggle =
    document.getElementById(
      "dataMasterToggle"
    );


  const masterSubmenu =
    document.getElementById(
      "dataMasterSubmenu"
    );


  if (
    masterToggle &&
    masterSubmenu
  ) {

    masterToggle.addEventListener(
      "click",
      function () {

        masterSubmenu.classList.toggle(
          "open"
        );

        masterToggle.classList.toggle(
          "open"
        );

      }
    );

  }


  /* =======================================================
     ACTIVE MENU
     ======================================================= */

  const currentPage =
    location.pathname
      .split("/")
      .pop()
      .toLowerCase();


  document
    .querySelectorAll(
      "[data-page]"
    )
    .forEach(function (item) {

      const page =
        String(
          item.dataset.page || ""
        )
        .toLowerCase();


      if (
        page === currentPage
      ) {

        item.classList.add(
          "active"
        );

      }

    });


  /* =======================================================
     USER NAME
     ======================================================= */

  document
    .querySelectorAll(
      "[data-user-name]"
    )
    .forEach(function (element) {

      element.textContent =
        nama;

    });


  document
    .querySelectorAll(
      "[data-user-role]"
    )
    .forEach(function (element) {

      element.textContent =
        role;

    });

}
