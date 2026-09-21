"use strict";

/*
==========================================================
LAYOUT UTAMA
PRESENSI SISWA
SD NEGERI JATIWARINGIN XIII
==========================================================
*/

(function () {

    const currentPage =
        (location.pathname.split("/").pop() || "dashboard.html")
            .toLowerCase();


    /*
    ======================================================
    KONFIGURASI JUDUL SETIAP HALAMAN
    ======================================================
    */

    const PAGE_CONFIG = {

        "dashboard.html": {
            title: "Dashboard",
            subtitle: "Control Panel",
            icon: "fa-gauge-high"
        },

        "admin.html": {
            title: "Administrator",
            subtitle: "Manajemen Administrator",
            icon: "fa-user-shield"
        },

        "siswa.html": {
            title: "Data Siswa",
            subtitle: "Master Data Siswa",
            icon: "fa-user-graduate"
        },

        "guru.html": {
            title: "Data Guru",
            subtitle: "Master Data Guru",
            icon: "fa-chalkboard-user"
        },

        "kelas.html": {
            title: "Data Kelas",
            subtitle: "Master Data Kelas",
            icon: "fa-school"
        },

        "presensi.html": {
            title: "Presensi",
            subtitle: "Presensi Siswa",
            icon: "fa-calendar-check"
        },

        "scan.html": {
            title: "Scan QR",
            subtitle: "Presensi QR Code",
            icon: "fa-qrcode"
        },

        "kartu.html": {
            title: "Kartu Siswa",
            subtitle: "Cetak Kartu Siswa",
            icon: "fa-id-card"
        },

        "absen-bulanan.html": {
            title: "Laporan Kehadiran",
            subtitle: "Daftar Presensi Siswa Per Bulan",
            icon: "fa-calendar-days"
        },

        "pengaturan.html": {
            title: "Pengaturan",
            subtitle: "Pengaturan Sistem",
            icon: "fa-gear"
        }

    };


    const config =
        PAGE_CONFIG[currentPage] ||
        PAGE_CONFIG["dashboard.html"];


    /*
    ======================================================
    BACA USER
    ======================================================
    */

    function getUser() {

        try {

            if (
                window.Auth &&
                typeof Auth.getCurrentUser === "function"
            ) {

                return Auth.getCurrentUser();

            }


            const raw =
                localStorage.getItem("presensiUser");


            if (!raw) {
                return null;
            }


            return JSON.parse(raw);

        } catch (error) {

            console.error(
                "Gagal membaca data pengguna:",
                error
            );

            return null;
        }

    }


    /*
    ======================================================
    ESCAPE HTML
    ======================================================
    */

    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    /*
    ======================================================
    BUAT LAYOUT
    ======================================================
    */

    function buildLayout() {

        /*
        Jangan menjalankan layout pada login.
        */

        if (
            currentPage === "index.html" ||
            currentPage === ""
        ) {

            return;

        }


        /*
        Simpan isi halaman lama.
        Kita hanya memindahkan isi halaman,
        bukan mengubah JavaScript backend/frontend.
        */

        const oldNodes = [];

        Array.from(document.body.children)
            .forEach(function (node) {

                /*
                Script tidak perlu ditampilkan
                di dalam area halaman.
                */

                if (
                    node.tagName === "SCRIPT" ||
                    node.tagName === "STYLE" ||
                    node.tagName === "LINK"
                ) {

                    return;

                }


                oldNodes.push(node);

            });


        /*
        Buat wrapper lama.
        */

        const pageContent =
            document.createElement("div");

        pageContent.id =
            "legacyPageContent";

        pageContent.className =
            "legacy-page-content";


        oldNodes.forEach(function (node) {

            pageContent.appendChild(node);

        });


        /*
        Bersihkan body.
        */

        document.body.innerHTML = "";


        /*
        ==================================================
        SIDEBAR
        ==================================================
        */

        const sidebar =
            document.createElement("aside");

        sidebar.id =
            "appSidebar";

        sidebar.className =
            "app-sidebar";


        sidebar.innerHTML = `

            <div class="sidebar-brand">

                <div class="brand-icon">
                    <i class="fa-solid fa-school"></i>
                </div>

                <div class="brand-text">

                    <div class="brand-title">
                        Administrator
                    </div>

                    <div class="brand-subtitle">
                        Presensi Sekolah
                    </div>

                </div>

            </div>


            <div class="sidebar-user">

                <div class="sidebar-user-avatar">

                    <i class="fa-solid fa-user"></i>

                </div>

                <div class="sidebar-user-info">

                    <div
                        id="layoutUserName"
                        class="sidebar-user-name"
                    >
                        Administrator
                    </div>

                    <div
                        id="layoutUserRole"
                        class="sidebar-user-role"
                    >
                        <span class="online-dot"></span>
                        Online
                    </div>

                </div>

            </div>


            <nav class="app-menu">

                <div class="menu-section-title">
                    MENU UTAMA
                </div>


                <!-- DASHBOARD -->

                <a
                    href="dashboard.html"
                    class="app-menu-link"
                    data-page="dashboard.html"
                >

                    <i class="fa-solid fa-gauge-high"></i>

                    <span>
                        Dashboard
                    </span>

                </a>


                <!-- DATA MASTER -->

                <button
                    type="button"
                    id="masterMenuButton"
                    class="app-menu-link menu-parent"
                >

                    <i class="fa-solid fa-database"></i>

                    <span>
                        Data Master
                    </span>

                    <i class="fa-solid fa-chevron-down menu-arrow"></i>

                </button>


                <div
                    id="masterSubmenu"
                    class="app-submenu"
                >

                    <a
                        href="siswa.html"
                        class="app-submenu-link admin-only"
                        data-page="siswa.html"
                    >

                        <i class="fa-solid fa-user-graduate"></i>

                        <span>
                            Data Siswa
                        </span>

                    </a>


                    <a
                        href="guru.html"
                        class="app-submenu-link admin-only"
                        data-page="guru.html"
                    >

                        <i class="fa-solid fa-chalkboard-user"></i>

                        <span>
                            Data Guru
                        </span>

                    </a>


                    <a
                        href="kelas.html"
                        class="app-submenu-link admin-only"
                        data-page="kelas.html"
                    >

                        <i class="fa-solid fa-school"></i>

                        <span>
                            Data Kelas
                        </span>

                    </a>

                </div>


                <!-- PRESENSI -->

                <a
                    href="presensi.html"
                    class="app-menu-link guru-only"
                    data-page="presensi.html"
                >

                    <i class="fa-solid fa-calendar-check"></i>

                    <span>
                        Presensi
                    </span>

                </a>


                <!-- SCAN -->

                <a
                    href="scan.html"
                    class="app-menu-link"
                    data-page="scan.html"
                >

                    <i class="fa-solid fa-qrcode"></i>

                    <span>
                        Scan QR
                    </span>

                </a>


                <!-- LAPORAN -->

                <a
                    href="absen-bulanan.html"
                    class="app-menu-link"
                    data-page="absen-bulanan.html"
                >

                    <i class="fa-solid fa-calendar-days"></i>

                    <span>
                        Laporan Bulanan
                    </span>

                </a>


                <!-- KARTU -->

                <a
                    href="kartu.html"
                    class="app-menu-link admin-only"
                    data-page="kartu.html"
                >

                    <i class="fa-solid fa-id-card"></i>

                    <span>
                        Kartu Siswa
                    </span>

                </a>


                <!-- PENGATURAN -->

                <a
                    href="pengaturan.html"
                    class="app-menu-link admin-only"
                    data-page="pengaturan.html"
                >

                    <i class="fa-solid fa-gear"></i>

                    <span>
                        Pengaturan
                    </span>

                </a>


                <div class="menu-section-title account-title">
                    AKUN
                </div>


                <button
                    type="button"
                    id="profileButton"
                    class="app-menu-link"
                >

                    <i class="fa-solid fa-user"></i>

                    <span>
                        Profil
                    </span>

                </button>


                <button
                    type="button"
                    id="logoutButton"
                    class="app-menu-link logout-link"
                >

                    <i class="fa-solid fa-right-from-bracket"></i>

                    <span>
                        Keluar
                    </span>

                </button>

            </nav>

        `;


        /*
        ==================================================
        MAIN
        ==================================================
        */

        const main =
            document.createElement("div");

        main.id =
            "appMain";

        main.className =
            "app-main";


        main.innerHTML = `

            <header class="app-topbar">

                <div class="topbar-left">

                    <button
                        type="button"
                        id="sidebarToggle"
                        class="sidebar-toggle"
                        title="Menu"
                    >

                        <i class="fa-solid fa-bars"></i>

                    </button>


                    <div class="topbar-heading">

                        <div
                            id="layoutPageTitle"
                            class="topbar-title"
                        >
                            ${escapeHTML(config.title)}
                        </div>

                        <div
                            id="layoutPageSubtitle"
                            class="topbar-subtitle"
                        >
                            ${escapeHTML(config.subtitle)}
                        </div>

                    </div>

                </div>


                <div class="topbar-right">

                    <div class="topbar-school">
                        SD Negeri Jatiwaringin XIII
                    </div>


                    <div class="topbar-user">

                        <div class="topbar-avatar">

                            <i class="fa-solid fa-user"></i>

                        </div>

                        <div
                            id="layoutTopUserName"
                            class="topbar-user-name"
                        >
                            Administrator
                        </div>

                        <i
                            class="fa-solid fa-chevron-down topbar-chevron"
                        ></i>

                    </div>

                </div>

            </header>


            <main class="app-page-content">

                <div class="page-breadcrumb">

                    <i class="fa-solid fa-house"></i>

                    <span>
                        Dashboard
                    </span>

                    <i class="fa-solid fa-angle-right"></i>

                    <strong>
                        ${escapeHTML(config.title)}
                    </strong>

                </div>

            </main>

        `;


        /*
        Masukkan isi halaman lama
        ke dalam area konten.
        */

        main
            .querySelector(".app-page-content")
            .appendChild(pageContent);


        /*
        Overlay mobile.
        */

        const overlay =
            document.createElement("div");

        overlay.id =
            "appOverlay";

        overlay.className =
            "app-overlay";


        /*
        Masukkan semuanya ke body.
        */

        document.body.appendChild(sidebar);

        document.body.appendChild(main);

        document.body.appendChild(overlay);

    }


    /*
    ======================================================
    SET USER
    ======================================================
    */

    function setupUser() {

        const user =
            getUser();


        if (!user) {
            return;
        }


        const name =
            user.nama ||
            user.username ||
            "Pengguna";


        const role =
            String(
                user.role || ""
            ).toUpperCase();


        let roleText =
            "Pengguna";


        if (role === "ADMIN") {

            roleText =
                "Administrator";

        } else if (role === "GURU") {

            roleText =
                "Guru / Wali Kelas";

        }


        const userName =
            document.getElementById(
                "layoutUserName"
            );


        const userRole =
            document.getElementById(
                "layoutUserRole"
            );


        const topUser =
            document.getElementById(
                "layoutTopUserName"
            );


        if (userName) {

            userName.textContent =
                name;

        }


        if (topUser) {

            topUser.textContent =
                name;

        }


        if (userRole) {

            userRole.innerHTML = `
                <span class="online-dot"></span>
                ${escapeHTML(roleText)}
            `;

        }


        /*
        ==============================================
        MENU ADMIN
        ==============================================
        */

        if (role === "ADMIN") {

            document
                .querySelectorAll(".guru-only")
                .forEach(function (element) {

                    element.style.display =
                        "none";

                });

        }


        /*
        ==============================================
        MENU GURU
        ==============================================
        */

        if (role === "GURU") {

            document
                .querySelectorAll(".admin-only")
                .forEach(function (element) {

                    element.style.display =
                        "none";

                });

        }

    }


    /*
    ======================================================
    ACTIVE MENU
    ======================================================
    */

    function setupActiveMenu() {

        document
            .querySelectorAll("[data-page]")
            .forEach(function (element) {

                const target =
                    element.getAttribute(
                        "data-page"
                    );


                if (
                    target !== currentPage
                ) {

                    return;

                }


                element.classList.add(
                    "active"
                );


                /*
                Jika halaman berada di
                submenu Data Master,
                buka submenu.
                */

                if (
                    element.classList.contains(
                        "app-submenu-link"
                    )
                ) {

                    const submenu =
                        document.getElementById(
                            "masterSubmenu"
                        );


                    const button =
                        document.getElementById(
                            "masterMenuButton"
                        );


                    if (submenu) {

                        submenu.classList.add(
                            "open"
                        );

                    }


                    if (button) {

                        button.classList.add(
                            "active-parent"
                        );

                    }

                }

            });

    }


    /*
    ======================================================
    SIDEBAR
    ======================================================
    */

    function setupSidebar() {

        const sidebar =
            document.getElementById(
                "appSidebar"
            );


        const main =
            document.getElementById(
                "appMain"
            );


        const toggle =
            document.getElementById(
                "sidebarToggle"
            );


        const overlay =
            document.getElementById(
                "appOverlay"
            );


        if (
            !sidebar ||
            !main ||
            !toggle
        ) {

            return;

        }


        toggle.addEventListener(
            "click",
            function () {

                /*
                MOBILE
                */

                if (
                    window.innerWidth <= 768
                ) {

                    sidebar.classList.toggle(
                        "mobile-open"
                    );


                    if (overlay) {

                        overlay.classList.toggle(
                            "show"
                        );

                    }

                    return;

                }


                /*
                DESKTOP
                */

                sidebar.classList.toggle(
                    "collapsed"
                );


                main.classList.toggle(
                    "expanded"
                );

            }
        );


        if (overlay) {

            overlay.addEventListener(
                "click",
                function () {

                    sidebar.classList.remove(
                        "mobile-open"
                    );


                    overlay.classList.remove(
                        "show"
                    );

                }
            );

        }


        window.addEventListener(
            "resize",
            function () {

                if (
                    window.innerWidth > 768
                ) {

                    sidebar.classList.remove(
                        "mobile-open"
                    );


                    if (overlay) {

                        overlay.classList.remove(
                            "show"
                        );

                    }

                }

            }
        );

    }


    /*
    ======================================================
    DATA MASTER DROPDOWN
    ======================================================
    */

    function setupMasterMenu() {

        const button =
            document.getElementById(
                "masterMenuButton"
            );


        const submenu =
            document.getElementById(
                "masterSubmenu"
            );


        if (
            !button ||
            !submenu
        ) {

            return;

        }


        button.addEventListener(
            "click",
            function () {

                submenu.classList.toggle(
                    "open"
                );


                button.classList.toggle(
                    "open"
                );

            }
        );

    }


    /*
    ======================================================
    LOGOUT
    ======================================================
    */

    function setupLogout() {

        const button =
            document.getElementById(
                "logoutButton"
            );


        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            function () {

                const yakin =
                    window.confirm(
                        "Apakah Anda yakin ingin keluar?"
                    );


                if (!yakin) {
                    return;
                }


                if (
                    window.Auth &&
                    typeof Auth.logout === "function"
                ) {

                    Auth.logout();

                    return;

                }


                localStorage.removeItem(
                    "presensiUser"
                );


                window.location.href =
                    "index.html";

            }
        );

    }


    /*
    ======================================================
    PROFILE
    ======================================================
    */

    function setupProfile() {

        const button =
            document.getElementById(
                "profileButton"
            );


        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            function () {

                const user =
                    getUser();


                if (!user) {
                    return;
                }


                const role =
                    String(
                        user.role || "-"
                    ).toUpperCase();


                window.alert(
                    "PROFIL PENGGUNA\n\n" +
                    "Nama: " +
                    (
                        user.nama ||
                        "-"
                    ) +
                    "\nUsername: " +
                    (
                        user.username ||
                        "-"
                    ) +
                    "\nRole: " +
                    role +
                    "\nID Guru: " +
                    (
                        user.idGuru ||
                        "-"
                    )
                );

            }
        );

    }


    /*
    ======================================================
    INIT
    ======================================================
    */

    function init() {

        if (
            currentPage === "index.html" ||
            currentPage === ""
        ) {

            return;

        }


        buildLayout();

        setupUser();

        setupActiveMenu();

        setupSidebar();

        setupMasterMenu();

        setupLogout();

        setupProfile();

    }


    /*
    ======================================================
    JALANKAN
    ======================================================
    */

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    } else {

        init();

    }

})();
