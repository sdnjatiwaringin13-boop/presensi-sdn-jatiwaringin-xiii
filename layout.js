"use strict";

/*
==========================================================
LAYOUT UTAMA
SD NEGERI JATIWARINGIN XIII
==========================================================
*/

(function () {

    const page =
        location.pathname
            .split("/")
            .pop()
            .toLowerCase() || "dashboard.html";


    const PAGE_CONFIG = {

        "dashboard.html": {
            title: "Dashboard",
            subtitle: "Control Panel",
            icon: "fa-gauge-high"
        },

        "admin.html": {
            title: "Administrator",
            subtitle: "Manajemen Pengguna",
            icon: "fa-user-shield"
        },

        "siswa.html": {
            title: "Data Siswa",
            subtitle: "Master Data",
            icon: "fa-user-graduate"
        },

        "guru.html": {
            title: "Data Guru",
            subtitle: "Master Data",
            icon: "fa-chalkboard-user"
        },

        "kelas.html": {
            title: "Data Kelas",
            subtitle: "Master Data",
            icon: "fa-school"
        },

        "presensi.html": {
            title: "Presensi",
            subtitle: "Presensi Siswa",
            icon: "fa-calendar-check"
        },

        "scan.html": {
            title: "Scan QR",
            subtitle: "Presensi QR",
            icon: "fa-qrcode"
        },

        "kartu.html": {
            title: "Kartu Siswa",
            subtitle: "Kartu Identitas",
            icon: "fa-id-card"
        },

        "absen-bulanan.html": {
            title: "Rekap Bulanan",
            subtitle: "Laporan Presensi",
            icon: "fa-calendar-days"
        },

        "pengaturan.html": {
            title: "Pengaturan",
            subtitle: "Konfigurasi Sistem",
            icon: "fa-gear"
        }

    };


    const config =
        PAGE_CONFIG[page] ||
        PAGE_CONFIG["dashboard.html"];


    function getUser() {

        try {

            if (
                window.Auth &&
                typeof Auth.getCurrentUser === "function"
            ) {

                return Auth.getCurrentUser();

            }

            const raw =
                localStorage.getItem(
                    "presensiUser"
                );

            return raw
                ? JSON.parse(raw)
                : null;

        } catch (error) {

            console.error(
                "Gagal membaca user:",
                error
            );

            return null;
        }
    }


    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function createLayout() {

        /*
        Simpan seluruh isi body lama.
        Dengan cara ini halaman lama tidak
        perlu dibangun ulang dari nol.
        */

        const oldContent =
            document.body.innerHTML;


        document.body.innerHTML = `

            <div
                id="appOverlay"
                class="app-overlay"
            ></div>


            <!-- =========================================
                 SIDEBAR
            ========================================== -->

            <aside
                id="appSidebar"
                class="app-sidebar"
            >

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
                        class="app-menu-link menu-parent"
                        id="masterMenuButton"
                    >

                        <i class="fa-solid fa-database"></i>

                        <span>
                            Data Master
                        </span>

                        <i
                            class="fa-solid fa-chevron-down menu-arrow"
                        ></i>

                    </button>


                    <div
                        class="app-submenu"
                        id="masterSubmenu"
                    >

                        <a
                            href="siswa.html"
                            class="app-submenu-link admin-only"
                            data-page="siswa.html"
                        >
                            <i class="fa-solid fa-user-graduate"></i>
                            <span>Data Siswa</span>
                        </a>


                        <a
                            href="guru.html"
                            class="app-submenu-link admin-only"
                            data-page="guru.html"
                        >
                            <i class="fa-solid fa-chalkboard-user"></i>
                            <span>Data Guru</span>
                        </a>


                        <a
                            href="kelas.html"
                            class="app-submenu-link admin-only"
                            data-page="kelas.html"
                        >
                            <i class="fa-solid fa-school"></i>
                            <span>Data Kelas</span>
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


                    <!-- REKAP -->

                    <a
                        href="absen-bulanan.html"
                        class="app-menu-link"
                        data-page="absen-bulanan.html"
                    >

                        <i class="fa-solid fa-calendar-days"></i>

                        <span>
                            Rekap Bulanan
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
                        class="app-menu-link"
                        id="profileButton"
                    >

                        <i class="fa-solid fa-user"></i>

                        <span>
                            Profil
                        </span>

                    </button>


                    <button
                        type="button"
                        class="app-menu-link logout-link"
                        id="logoutButton"
                    >

                        <i class="fa-solid fa-right-from-bracket"></i>

                        <span>
                            Keluar
                        </span>

                    </button>

                </nav>

            </aside>


            <!-- =========================================
                 MAIN
            ========================================== -->

            <div
                id="appMain"
                class="app-main"
            >

                <!-- TOPBAR -->

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

                            <div
                                class="topbar-avatar"
                            >
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


                <!-- PAGE -->

                <main
                    id="appPageContent"
                    class="app-page-content"
                >

                    <div class="page-breadcrumb">

                        <i class="fa-solid fa-house"></i>

                        <span>
                            ${escapeHTML(config.title)}
                        </span>

                        <i class="fa-solid fa-angle-right"></i>

                        <strong>
                            ${escapeHTML(config.subtitle)}
                        </strong>

                    </div>


                    <div
                        id="legacyPageContent"
                        class="legacy-page-content"
                    >
                        ${oldContent}
                    </div>

                </main>

            </div>

        `;

    }


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


        const roleText =
            role === "ADMIN"
                ? "Administrator"
                : "Guru / Wali Kelas";


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


        if (userRole) {

            userRole.innerHTML = `
                <span class="online-dot"></span>
                ${escapeHTML(roleText)}
            `;
        }


        if (topUser) {

            topUser.textContent =
                name;
        }


        /*
        ADMIN
        */

        if (role === "ADMIN") {

            document
                .querySelectorAll(".guru-only")
                .forEach(
                    element => {
                        element.style.display =
                            "none";
                    }
                );
        }


        /*
        GURU
        */

        if (role === "GURU") {

            document
                .querySelectorAll(".admin-only")
                .forEach(
                    element => {
                        element.style.display =
                            "none";
                    }
                );

        }

    }


    function setupActiveMenu() {

        document
            .querySelectorAll(
                "[data-page]"
            )
            .forEach(
                element => {

                    const target =
                        element.getAttribute(
                            "data-page"
                        );


                    if (
                        target === page
                    ) {

                        element.classList.add(
                            "active"
                        );


                        /*
                        Jika submenu aktif,
                        buka Data Master.
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

                    }

                }
            );

    }


    function setupSidebar() {

        const sidebar =
            document.getElementById(
                "appSidebar"
            );


        const main =
            document.getElementById(
                "appMain"
            );


        const overlay =
            document.getElementById(
                "appOverlay"
            );


        const toggle =
            document.getElementById(
                "sidebarToggle"
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

                if (
                    window.innerWidth <= 768
                ) {

                    sidebar.classList.toggle(
                        "mobile-open"
                    );

                    overlay.classList.toggle(
                        "show"
                    );

                } else {

                    sidebar.classList.toggle(
                        "collapsed"
                    );

                    main.classList.toggle(
                        "expanded"
                    );
                }

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

                    overlay.classList.remove(
                        "show"
                    );
                }

            }
        );

    }


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
                    confirm(
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

                } else {

                    localStorage.removeItem(
                        "presensiUser"
                    );

                    location.href =
                        "index.html";
                }

            }
        );

    }


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


                alert(
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
                    (
                        user.role ||
                        "-"
                    )
                );

            }
        );

    }


    function init() {

        /*
        Jangan jalankan layout pada halaman login.
        */

        if (
            page === "index.html" ||
            page === ""
        ) {
            return;
        }


        createLayout();

        setupUser();

        setupActiveMenu();

        setupSidebar();

        setupMasterMenu();

        setupLogout();

        setupProfile();

    }


    /*
    Jalankan setelah DOM tersedia.
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
