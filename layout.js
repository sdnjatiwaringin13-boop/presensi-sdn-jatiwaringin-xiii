"use strict";

(function () {
  document.addEventListener("DOMContentLoaded", initLayout);

  function initLayout() {
    const user = Auth.requireLogin();
    if (!user) return;

    const page = (location.pathname.split("/").pop() || "dashboard.html").toLowerCase();
    if (page === "index.html") return;

    ensureLayout();
    renderSidebar(user);
    renderTopbar(user);
    bindLayoutEvents();
    setActiveMenu();
    startLiveClock();
  }

  function ensureLayout() {
    if (document.querySelector(".app-sidebar") && document.querySelector(".app-main")) return;

    const body = document.body;
    const scripts = Array.from(body.querySelectorAll("script"));
    const contentNodes = Array.from(body.childNodes).filter(node => !scripts.includes(node));

    const sidebar = document.createElement("aside");
    sidebar.id = "sidebar";
    sidebar.className = "app-sidebar";

    const main = document.createElement("div");
    main.id = "appMain";
    main.className = "app-main";

    const topbar = document.createElement("header");
    topbar.id = "topbar";
    topbar.className = "app-topbar";

    const content = document.createElement("main");
    content.className = "app-page-content";

    const legacy = document.createElement("div");
    legacy.className = "legacy-page-content";

    contentNodes.forEach(node => legacy.appendChild(node));
    content.appendChild(legacy);
    main.appendChild(topbar);
    main.appendChild(content);

    body.innerHTML = "";
    body.appendChild(sidebar);
    body.appendChild(main);
    const overlay = document.createElement("div");
    overlay.id = "mobileOverlay";
    overlay.className = "mobile-overlay";
    body.appendChild(overlay);
    scripts.forEach(script => body.appendChild(script));
  }

  function renderSidebar(user) {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;
    const role = Auth.getRole(user);
    const nama = user.nama || user.username || "Pengguna";

    sidebar.innerHTML = `
      <div class="sidebar-brand">
        <div class="brand-icon"><i class="fa-solid fa-school"></i></div>
        <div class="brand-text"><div class="brand-title">Presensi Sekolah</div><div class="brand-subtitle">SDN Jatiwaringin XIII</div></div>
      </div>
      <div class="sidebar-user">
        <div class="sidebar-user-avatar"><i class="fa-solid fa-user"></i></div>
        <div class="sidebar-user-info">
          <div class="sidebar-user-name">${escapeHTML(nama)}</div>
          <div class="sidebar-user-role"><span class="online-dot"></span>${escapeHTML(role)}</div>
        </div>
      </div>
      <nav class="app-menu">
        <div class="menu-section-title">MENU UTAMA</div>
        <a href="dashboard.html" class="app-menu-link" data-page="dashboard.html"><i class="fa-solid fa-gauge-high"></i><span>Dashboard</span></a>
        ${role === "ADMIN" ? `
          <button type="button" class="app-menu-link menu-parent" id="masterMenuButton"><i class="fa-solid fa-database"></i><span>Data Master</span><i class="fa-solid fa-chevron-down menu-arrow"></i></button>
          <div class="app-submenu" id="masterSubmenu">
            <a href="siswa.html" class="app-submenu-link" data-page="siswa.html"><i class="fa-solid fa-user-graduate"></i>Data Siswa</a>
            <a href="guru.html" class="app-submenu-link" data-page="guru.html"><i class="fa-solid fa-chalkboard-user"></i>Data Guru</a>
            <a href="kelas.html" class="app-submenu-link" data-page="kelas.html"><i class="fa-solid fa-school"></i>Data Kelas</a>
          </div>` : ""}
        ${(role === "GURU" || role === "ADMIN") ? `<a href="presensi.html" class="app-menu-link" data-page="presensi.html"><i class="fa-solid fa-calendar-check"></i><span>Presensi Manual</span></a>` : ""}
        <a href="scan.html" class="app-menu-link" data-page="scan.html"><i class="fa-solid fa-qrcode"></i><span>Scan QR</span></a>
        <a href="absen-bulanan.html" class="app-menu-link" data-page="absen-bulanan.html"><i class="fa-solid fa-calendar-days"></i><span>Laporan Bulanan</span></a>
        ${role === "ADMIN" ? `<a href="kartu.html" class="app-menu-link" data-page="kartu.html"><i class="fa-solid fa-id-card"></i><span>Kartu Siswa</span></a><a href="pengaturan.html" class="app-menu-link" data-page="pengaturan.html"><i class="fa-solid fa-gear"></i><span>Pengaturan</span></a>` : ""}
        <div class="menu-section-title account-title">AKUN</div>
        <button type="button" class="app-menu-link" id="logoutButton"><i class="fa-solid fa-right-from-bracket"></i><span>Keluar</span></button>
      </nav>`;
  }

  function renderTopbar(user) {
    const topbar = document.getElementById("topbar");
    if (!topbar) return;
    const nama = user.nama || user.username || "Pengguna";
    topbar.innerHTML = `
      <div class="topbar-left">
        <button type="button" id="sidebarToggle" class="sidebar-toggle"><i class="fa-solid fa-bars"></i></button>
        <div class="topbar-heading"><div class="topbar-title">${escapeHTML(getPageTitle())}</div><div class="topbar-subtitle">Control Panel</div></div>
      </div>
      <div class="topbar-right">
        <div class="live-clock" id="liveClock">--:--:--</div>
        <div class="topbar-school">SD Negeri Jatiwaringin XIII</div>
        <div class="topbar-user"><div class="topbar-avatar"><i class="fa-solid fa-user"></i></div><div class="topbar-user-name">${escapeHTML(nama)}</div></div>
      </div>`;
  }

  function bindLayoutEvents() {
    const sidebar = document.getElementById("sidebar");
    const main = document.getElementById("appMain");
    const overlay = document.getElementById("mobileOverlay");

    document.getElementById("sidebarToggle")?.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        sidebar?.classList.toggle("mobile-open");
        overlay?.classList.toggle("show");
      } else {
        sidebar?.classList.toggle("collapsed");
        main?.classList.toggle("expanded");
      }
    });

    overlay?.addEventListener("click", () => {
      sidebar?.classList.remove("mobile-open");
      overlay?.classList.remove("show");
    });

    const master = document.getElementById("masterMenuButton");
    const submenu = document.getElementById("masterSubmenu");
    master?.addEventListener("click", () => {
      master.classList.toggle("open");
      submenu?.classList.toggle("open");
    });

    document.getElementById("logoutButton")?.addEventListener("click", () => {
      if (confirm("Apakah Anda yakin ingin keluar?")) Auth.logout();
    });
  }

  function setActiveMenu() {
    const current = (location.pathname.split("/").pop() || "dashboard.html").toLowerCase();
    document.querySelectorAll("[data-page]").forEach(el => {
      if (String(el.dataset.page).toLowerCase() === current) el.classList.add("active");
    });
    if (["siswa.html","guru.html","kelas.html"].includes(current)) {
      document.getElementById("masterMenuButton")?.classList.add("open","active-parent");
      document.getElementById("masterSubmenu")?.classList.add("open");
    }
  }

  function startLiveClock() {
    const tick = () => {
      const el = document.getElementById("liveClock");
      if (!el) return;
      const now = new Date();
      el.textContent = new Intl.DateTimeFormat("id-ID", { hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false }).format(now);
    };
    tick();
    if (window.__presensiClock) clearInterval(window.__presensiClock);
    window.__presensiClock = setInterval(tick, 1000);
  }

  function getPageTitle() {
    const page = location.pathname.split("/").pop();
    return ({"dashboard.html":"Dashboard","admin.html":"Administrasi","siswa.html":"Data Siswa","guru.html":"Data Guru","kelas.html":"Data Kelas","presensi.html":"Presensi Manual","scan.html":"Scan QR","kartu.html":"Kartu Siswa","absen-bulanan.html":"Laporan Bulanan","pengaturan.html":"Pengaturan"})[page] || "Presensi Sekolah";
  }
})();
