"use strict";

(function () {

    /* =====================================================
       DATA
    ===================================================== */

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


    /* =====================================================
       HELPER
    ===================================================== */

    function $(id) {
        return document.getElementById(id);
    }


    function getUser() {

        try {

            return JSON.parse(
                localStorage.getItem(
                    "presensiUser"
                ) || "null"
            );

        } catch (error) {

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


    /* =====================================================
       INIT
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        init
    );


    async function init() {

        const user = getUser();


        /* -------------------------------------------------
           CEK LOGIN
        ------------------------------------------------- */

        if (!user) {

            location.href =
                "index.html";

            return;

        }


        const role =
            String(
                user.role || ""
            ).toUpperCase();


        /* -------------------------------------------------
           CEK ROLE
        ------------------------------------------------- */

        if (
            role !== "ADMIN" &&
            role !== "GURU"
        ) {

            alert(
                "Anda tidak memiliki akses ke laporan."
            );

            location.href =
                "dashboard.html";

            return;

        }


        /* -------------------------------------------------
           SET TANGGAL DEFAULT
        ------------------------------------------------- */

        const sekarang =
            new Date();


        if ($("bulan")) {

            $("bulan").value =
                sekarang.getMonth() + 1;

        }


        if ($("tahun")) {

            $("tahun").value =
                sekarang.getFullYear();

        }


        /* -------------------------------------------------
           EVENT
        ------------------------------------------------- */

        $("btnTampilkan")?.addEventListener(
            "click",
            tampilkanRekap
        );


        $("btnCetak")?.addEventListener(
            "click",
            function () {

                if (!reportData) {

                    tampilkanPesan(
                        "Tampilkan laporan terlebih dahulu.",
                        "error"
                    );

                    return;

                }

                window.print();

            }
        );


        $("btnExcel")?.addEventListener(
            "click",
            downloadExcel
        );


        /* -------------------------------------------------
           ADMIN
           TAMPILKAN PILIHAN GURU
        ------------------------------------------------- */

        if (role === "ADMIN") {

            await loadGuru();

        }


        /* -------------------------------------------------
           GURU
           SEMBUNYIKAN PILIHAN GURU
        ------------------------------------------------- */

        if (role === "GURU") {

            const wrapper =
                $("guruWrapper");

            if (wrapper) {

                wrapper.style.display =
                    "none";

            }

        }

    }


    /* =====================================================
       LOAD DATA GURU
    ===================================================== */

    async function loadGuru() {

        const select =
            $("pilihGuru");


        if (!select) {

            console.error(
                "Element #pilihGuru tidak ditemukan."
            );

            return;

        }


        select.innerHTML = `
            <option value="">
                Memuat data guru...
            </option>
        `;


        try {

            const result =
                await callAPI({
                    action: "getGuru"
                });


            console.log(
                "RESPON getGuru:",
                result
            );


            if (
                !result ||
                result.success !== true
            ) {

                throw new Error(
                    result?.message ||
                    "Data guru gagal diambil."
                );

            }


            guruList =
                Array.isArray(result.data)
                    ? result.data
                    : [];


            /* -------------------------------------------------
               JIKA TIDAK ADA GURU
            ------------------------------------------------- */

            if (
                guruList.length === 0
            ) {

                select.innerHTML = `
                    <option value="">
                        Tidak ada data guru
                    </option>
                `;

                tampilkanPesan(
                    "Data guru belum tersedia. Silakan periksa sheet GURU.",
                    "error"
                );

                return;

            }


            /* -------------------------------------------------
               BUAT OPTION
            ------------------------------------------------- */

            select.innerHTML = `
                <option value="">
                    Pilih Guru / Wali Kelas
                </option>
            `;


            guruList.forEach(
                function (guru) {

                    const idGuru =
                        String(
                            guru.ID_GURU ??
                            guru.idGuru ??
                            ""
                        ).trim();


                    const nama =
                        String(
                            guru.NAMA ??
                            guru.nama ??
                            idGuru
                        ).trim();


                    if (!idGuru) {

                        return;

                    }


                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        idGuru;


                    option.textContent =
                        nama;


                    select.appendChild(
                        option
                    );

                }
            );


            console.log(
                "Jumlah guru:",
                select.options.length - 1
            );

        } catch (error) {

            console.error(
                "GAGAL LOAD GURU:",
                error
            );


            select.innerHTML = `
                <option value="">
                    Gagal memuat data guru
                </option>
            `;


            tampilkanPesan(
                error.message ||
                "Gagal mengambil data guru.",
                "error"
            );

        }

    }


    /* =====================================================
       TAMPILKAN REKAP
    ===================================================== */

    async function tampilkanRekap() {

        const user =
            getUser();


        if (!user) {

            location.href =
                "index.html";

            return;

        }


        const role =
            String(
                user.role || ""
            ).toUpperCase();


        let idGuru = "";


        /* -------------------------------------------------
           ADMIN
        ------------------------------------------------- */

        if (role === "ADMIN") {

            idGuru =
                String(
                    $("pilihGuru")?.value ||
                    ""
                ).trim();

        }


        /* -------------------------------------------------
           GURU
        ------------------------------------------------- */

        if (role === "GURU") {

            idGuru =
                String(
                    user.idGuru ||
                    ""
                ).trim();

        }


        const bulan =
            Number(
                $("bulan")?.value
            );


        const tahun =
            Number(
                $("tahun")?.value
            );


        /* -------------------------------------------------
           VALIDASI GURU
        ------------------------------------------------- */

        if (!idGuru) {

            tampilkanPesan(
                "Silakan pilih Guru / Wali Kelas terlebih dahulu.",
                "error"
            );

            return;

        }


        /* -------------------------------------------------
           VALIDASI BULAN
        ------------------------------------------------- */

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


        /* -------------------------------------------------
           VALIDASI TAHUN
        ------------------------------------------------- */

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
            $("btnTampilkan");


        if (button) {

            button.disabled =
                true;

            button.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Memuat...
            `;

        }


        try {

            tampilkanLoading();


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


            console.log(
                "RESPON LAPORAN:",
                result
            );


            if (
                !result ||
                result.success !== true
            ) {

                throw new Error(
                    result?.message ||
                    "Gagal mengambil laporan."
                );

            }


            reportData =
                result.data || null;


            if (!reportData) {

                throw new Error(
                    "Data laporan kosong."
                );

            }


            renderReport();


            tampilkanPesan(
                "Laporan berhasil dimuat.",
                "success"
            );

        } catch (error) {

            console.error(
                "ERROR LAPORAN:",
                error
            );


            tampilkanPesan(
                error.message ||
                "Gagal mengambil laporan.",
                "error"
            );

        } finally {

            if (button) {

                button.disabled =
                    false;

                button.innerHTML = `
                    <i class="fa-solid fa-magnifying-glass"></i>
                    Tampilkan Rekap
                `;

            }

        }

    }


    /* =====================================================
       LOADING
    ===================================================== */

    function tampilkanLoading() {

        const tbody =
            $("rekapTableBody");


        const thead =
            $("rekapTableHead");


        if (thead) {

            thead.innerHTML = `
                <tr>
                    <th>No</th>
                    <th>NISN</th>
                    <th>Nama Siswa</th>
                </tr>
            `;

        }


        if (tbody) {

            tbody.innerHTML = `
                <tr>
                    <td
                        colspan="3"
                        style="padding:30px;text-align:center;"
                    >
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        Memuat laporan...
                    </td>
                </tr>
            `;

        }

    }


    /* =====================================================
       RENDER REPORT
    ===================================================== */

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


        /* -------------------------------------------------
           SEKOLAH
        ------------------------------------------------- */

        const namaSekolah =
            sekolah.nama ||
            "SD NEGERI JATIWARINGIN XIII";


        const header =
            document.querySelector(
                ".report-header h2"
            );


        if (header) {

            header.textContent =
                namaSekolah;

        }


        /* -------------------------------------------------
           KELAS
        ------------------------------------------------- */

        if ($("reportKelas")) {

            $("reportKelas").textContent =
                kelas.nama ||
                "-";

        }


        /* -------------------------------------------------
           GURU
        ------------------------------------------------- */

        if ($("reportGuru")) {

            $("reportGuru").textContent =
                guru.nama ||
                "-";

        }


        /* -------------------------------------------------
           BULAN
        ------------------------------------------------- */

        if ($("reportBulan")) {

            $("reportBulan").textContent =
                `${
                    namaBulan[
                        Number(
                            reportData.bulan
                        )
                    ] || "-"
                } ${
                    reportData.tahun || ""
                }`;

        }


        /* -------------------------------------------------
           KEPALA SEKOLAH
        ------------------------------------------------- */

        if ($("kepalaSekolah")) {

            $("kepalaSekolah").textContent =
                kepala.nama ||
                "-";

        }


        if ($("nipKepala")) {

            $("nipKepala").textContent =
                kepala.nip
                    ? `NIP. ${kepala.nip}`
                    : "NIP. -";

        }


        /* -------------------------------------------------
           WALI KELAS
        ------------------------------------------------- */

        if ($("waliKelas")) {

            $("waliKelas").textContent =
                guru.nama ||
                "-";

        }


        if ($("nipWali")) {

            $("nipWali").textContent =
                guru.nip
                    ? `NIP. ${guru.nip}`
                    : "NIP. -";

        }


        renderTable();

    }


    /* =====================================================
       RENDER TABEL
    ===================================================== */

    function renderTable() {

        const thead =
            $("rekapTableHead");


        const tbody =
            $("rekapTableBody");


        if (!thead || !tbody) {

            return;

        }


        const jumlahHari =
            Number(
                reportData.jumlahHari ||
                0
            );


        const siswa =
            Array.isArray(
                reportData.siswa
            )
                ? reportData.siswa
                : [];


        /* -------------------------------------------------
           HEADER
        ------------------------------------------------- */

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


        /* -------------------------------------------------
           DATA KOSONG
        ------------------------------------------------- */

        if (
            siswa.length === 0
        ) {

            tbody.innerHTML = `
                <tr>
                    <td
                        colspan="${jumlahHari + 3}"
                        style="padding:30px;text-align:center;"
                    >
                        Tidak ada data siswa.
                    </td>
                </tr>
            `;

            return;

        }


        /* -------------------------------------------------
           BARIS SISWA
        ------------------------------------------------- */

        tbody.innerHTML =
            siswa.map(
                function (item, index) {

                    let row = `
                        <tr>

                            <td>
                                ${index + 1}
                            </td>

                            <td>
                                ${escapeHTML(
                                    item.nisn ||
                                    ""
                                )}
                            </td>

                            <td class="student-name">
                                ${escapeHTML(
                                    item.nama ||
                                    ""
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
                            <td class="attendance-cell">
                                ${escapeHTML(
                                    status
                                )}
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


    /* =====================================================
       EXCEL
    ===================================================== */

    function downloadExcel() {

        if (!reportData) {

            tampilkanPesan(
                "Tampilkan laporan terlebih dahulu.",
                "error"
            );

            return;

        }


        if (
            typeof XLSX ===
            "undefined"
        ) {

            downloadCSV();

            return;

        }


        const jumlahHari =
            Number(
                reportData.jumlahHari ||
                0
            );


        const siswa =
            Array.isArray(
                reportData.siswa
            )
                ? reportData.siswa
                : [];


        const rows = [];


        rows.push([
            "LAPORAN KEHADIRAN SISWA"
        ]);


        rows.push([
            reportData.sekolah?.nama ||
            "SD NEGERI JATIWARINGIN XIII"
        ]);


        rows.push([]);


        rows.push([
            "Kelas",
            reportData.kelas?.nama ||
            "-"
        ]);


        rows.push([
            "Guru / Wali Kelas",
            reportData.guru?.nama ||
            "-"
        ]);


        rows.push([
            "Bulan",
            `${
                namaBulan[
                    Number(
                        reportData.bulan
                    )
                ] || "-"
            } ${
                reportData.tahun || ""
            }`
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

            header.push(
                String(hari)
            );

        }


        rows.push(header);


        siswa.forEach(
            function (item, index) {

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
                        item.hari?.[hari] ||
                        "-"
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
            XLSX.utils.aoa_to_sheet(
                rows
            );


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
            `Laporan-Absensi-${
                reportData.kelas?.nama ||
                "Kelas"
            }-${bulan}-${
                reportData.tahun
            }.xlsx`;


        XLSX.writeFile(
            workbook,
            namaFile
        );

    }


    /* =====================================================
       CSV
    ===================================================== */

    function downloadCSV() {

        if (!reportData) {

            return;

        }


        const jumlahHari =
            Number(
                reportData.jumlahHari ||
                0
            );


        const siswa =
            Array.isArray(
                reportData.siswa
            )
                ? reportData.siswa
                : [];


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

            header.push(
                String(hari)
            );

        }


        rows.push(header);


        siswa.forEach(
            function (item, index) {

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
                        item.hari?.[hari] ||
                        "-"
                    );

                }


                rows.push(row);

            }
        );


        const csv =
            rows
                .map(
                    function (row) {

                        return row
                            .map(
                                function (value) {

                                    return `"${String(
                                        value
                                    ).replace(
                                        /"/g,
                                        '""'
                                    )}"`;

                                }
                            )
                            .join(",");

                    }
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
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =
            "Laporan-Absensi.csv";


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );

    }


    /* =====================================================
       PESAN
    ===================================================== */

    function tampilkanPesan(
        message,
        type
    ) {

        const element =
            $("rekapMessage");


        if (!element) {

            alert(message);

            return;

        }


        element.textContent =
            message;


        element.className =
            "report-message " +
            (
                type === "success"
                    ? "message-success"
                    : "message-error"
            );


        element.style.display =
            "block";


        clearTimeout(
            element._timer
        );


        element._timer =
            setTimeout(
                function () {

                    element.style.display =
                        "none";

                },
                5000
            );

    }


})();
