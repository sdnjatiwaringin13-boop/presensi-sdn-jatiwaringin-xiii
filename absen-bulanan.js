/* =========================================================
   LAPORAN ABSENSI BULANAN
   SD NEGERI JATIWARINGIN XIII
========================================================= */

(function () {

    "use strict";

    const BULAN_NAMA = [
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

    let currentReport = null;
    let currentUser = null;


    /* =====================================================
       HELPER
    ===================================================== */

    function $(id) {
        return document.getElementById(id);
    }


    function getUser() {

        try {

            const raw = localStorage.getItem("presensiUser");

            if (!raw) {
                return null;
            }

            return JSON.parse(raw);

        } catch (error) {

            console.error(
                "Gagal membaca presensiUser:",
                error
            );

            return null;
        }
    }


    function setMessage(message, type) {

        const el = $("rekapMessage");

        if (!el) {
            return;
        }

        el.className = "report-message";

        if (!message) {
            el.style.display = "none";
            el.innerHTML = "";
            return;
        }

        el.classList.add(
            type === "error"
                ? "message-error"
                : "message-success"
        );

        el.innerHTML = message;
        el.style.display = "block";
    }


    function hideMessage() {

        const el = $("rekapMessage");

        if (!el) {
            return;
        }

        el.style.display = "none";
        el.innerHTML = "";
        el.className = "report-message";
    }


    function setButtonLoading(button, loading, textNormal) {

        if (!button) {
            return;
        }

        if (loading) {

            button.disabled = true;

            button.dataset.originalText =
                button.innerHTML;

            button.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Memuat...';

        } else {

            button.disabled = false;

            button.innerHTML =
                button.dataset.originalText ||
                textNormal;
        }
    }


    /* =====================================================
       INISIALISASI
    ===================================================== */

    function init() {

        console.log(
            "Laporan Absensi Bulanan: mulai..."
        );

        currentUser = getUser();

        setDefaultTanggal();

        bindEvents();

        /*
         * Jangan menunggu API di sini.
         * Halaman langsung ditampilkan.
         */
        setTimeout(function () {

            loadGuru();

        }, 50);
    }


    /* =====================================================
       DEFAULT BULAN & TAHUN
    ===================================================== */

    function setDefaultTanggal() {

        const sekarang = new Date();

        const bulan = sekarang.getMonth() + 1;

        const tahun = sekarang.getFullYear();

        const bulanEl = $("bulan");

        const tahunEl = $("tahun");

        if (bulanEl) {
            bulanEl.value = String(bulan);
        }

        if (tahunEl) {
            tahunEl.value = tahun;
        }
    }


    /* =====================================================
       EVENT
    ===================================================== */

    function bindEvents() {

        const btnTampilkan =
            $("btnTampilkan");

        const btnCetak =
            $("btnCetak");

        const btnExcel =
            $("btnExcel");

        if (btnTampilkan) {

            btnTampilkan.addEventListener(
                "click",
                tampilkanRekap
            );
        }

        if (btnCetak) {

            btnCetak.addEventListener(
                "click",
                cetakLaporan
            );
        }

        if (btnExcel) {

            btnExcel.addEventListener(
                "click",
                exportExcel
            );
        }
    }


    /* =====================================================
       LOAD GURU
    ===================================================== */

    async function loadGuru() {

        const guruWrapper =
            $("guruWrapper");

        const pilihGuru =
            $("pilihGuru");


        /*
         * Jika tidak ada user,
         * jangan terus memanggil API.
         */

        if (!currentUser) {

            if (pilihGuru) {

                pilihGuru.innerHTML =
                    '<option value="">Silakan login terlebih dahulu</option>';

                pilihGuru.disabled = true;
            }

            return;
        }


        /*
         * ROLE GURU
         */

        if (
            String(currentUser.role || "")
                .toUpperCase() === "GURU"
        ) {

            if (guruWrapper) {
                guruWrapper.style.display = "none";
            }

            return;
        }


        /*
         * ROLE ADMIN
         */

        if (!pilihGuru) {
            return;
        }

        pilihGuru.disabled = true;

        pilihGuru.innerHTML =
            '<option value="">Memuat data guru...</option>';


        try {

            const response =
                await callAPI({
                    action: "getGuru"
                });


            console.log(
                "Response getGuru:",
                response
            );


            if (
                !response ||
                response.success !== true
            ) {

                throw new Error(
                    response?.message ||
                    "Data guru tidak dapat dimuat."
                );
            }


            const guruList =
                Array.isArray(response.data)
                    ? response.data
                    : [];


            pilihGuru.innerHTML =
                '<option value="">-- Pilih Guru / Wali Kelas --</option>';


            guruList.forEach(function (guru) {

                const option =
                    document.createElement("option");

                option.value =
                    guru.idGuru ||
                    guru.ID_GURU ||
                    guru.id ||
                    "";

                option.textContent =
                    guru.nama ||
                    guru.NAMA ||
                    "-";


                if (currentUser.idGuru &&
                    String(option.value) ===
                    String(currentUser.idGuru)) {

                    option.selected = true;
                }


                pilihGuru.appendChild(option);

            });


            if (guruList.length === 0) {

                pilihGuru.innerHTML =
                    '<option value="">Belum ada data guru</option>';
            }


            pilihGuru.disabled = false;


        } catch (error) {

            console.error(
                "Gagal memuat guru:",
                error
            );


            pilihGuru.innerHTML =
                '<option value="">Gagal memuat data guru</option>';

            pilihGuru.disabled = false;


            setMessage(
                "Data guru belum berhasil dimuat. " +
                "Silakan coba lagi.",
                "error"
            );
        }
    }


    /* =====================================================
       AMBIL ID GURU
    ===================================================== */

    function getSelectedGuruId() {

        /*
         * GURU
         */

        if (
            String(currentUser?.role || "")
                .toUpperCase() === "GURU"
        ) {

            return (
                currentUser.idGuru ||
                currentUser.ID_GURU ||
                ""
            );
        }


        /*
         * ADMIN
         */

        const select =
            $("pilihGuru");

        return select
            ? select.value
            : "";
    }


    /* =====================================================
       TAMPILKAN REKAP
    ===================================================== */

    async function tampilkanRekap() {

        hideMessage();


        if (!currentUser) {

            setMessage(
                "Silakan login terlebih dahulu.",
                "error"
            );

            return;
        }


        const idGuru =
            getSelectedGuruId();


        const bulan =
            Number(
                $("bulan")?.value
            );


        const tahun =
            Number(
                $("tahun")?.value
            );


        if (!idGuru) {

            setMessage(
                "Silakan pilih Guru / Wali Kelas terlebih dahulu.",
                "error"
            );

            return;
        }


        if (
            !bulan ||
            bulan < 1 ||
            bulan > 12
        ) {

            setMessage(
                "Bulan tidak valid.",
                "error"
            );

            return;
        }


        if (
            !tahun ||
            tahun < 2020 ||
            tahun > 2100
        ) {

            setMessage(
                "Tahun tidak valid.",
                "error"
            );

            return;
        }


        const button =
            $("btnTampilkan");


        setButtonLoading(
            button,
            true,
            "Tampilkan Rekap"
        );


        try {

            console.log(
                "Mengambil laporan:",
                {
                    idGuru,
                    bulan,
                    tahun
                }
            );


            const response =
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
                "Response laporan:",
                response
            );


            if (
                !response ||
                response.success !== true
            ) {

                throw new Error(
                    response?.message ||
                    "Laporan tidak dapat dimuat."
                );
            }


            currentReport =
                response.data;


            renderReport(
                currentReport
            );


            setMessage(
                "Laporan berhasil dimuat.",
                "success"
            );


        } catch (error) {

            console.error(
                "Gagal memuat laporan:",
                error
            );


            currentReport = null;


            setMessage(
                error.message ||
                "Terjadi kesalahan saat memuat laporan.",
                "error"
            );


        } finally {

            setButtonLoading(
                button,
                false,
                "Tampilkan Rekap"
            );
        }
    }


    /* =====================================================
       RENDER LAPORAN
    ===================================================== */

    function renderReport(data) {

        if (!data) {
            return;
        }


        const sekolah =
            data.sekolah || {};

        const kelas =
            data.kelas || {};

        const guru =
            data.guru || {};

        const kepala =
            data.kepalaSekolah || {};


        /*
         * INFORMASI
         */

        setText(
            "reportKelas",
            kelas.nama ||
            kelas.NAMA_KELAS ||
            "-"
        );


        setText(
            "reportGuru",
            guru.nama ||
            guru.NAMA ||
            "-"
        );


        setText(
            "kepalaSekolah",
            kepala.nama ||
            kepala.NAMA ||
            "-"
        );


        setText(
            "nipKepala",
            "NIP. " +
            (
                kepala.nip ||
                kepala.NIP ||
                "-"
            )
        );


        setText(
            "waliKelas",
            guru.nama ||
            guru.NAMA ||
            "-"
        );


        setText(
            "nipWali",
            "NIP. " +
            (
                guru.nip ||
                guru.NIP ||
                "-"
            )
        );


        /*
         * BULAN
         */

        const bulan =
            Number(data.bulan);


        const tahun =
            Number(data.tahun);


        setText(
            "reportBulan",
            "Bulan " +
            (BULAN_NAMA[bulan] || "-") +
            " " +
            tahun
        );


        /*
         * RENDER TABEL
         */

        renderTable(
            data.siswa || [],
            Number(data.jumlahHari) || 31
        );
    }


    /* =====================================================
       RENDER TABLE
    ===================================================== */

    function renderTable(
        siswa,
        jumlahHari
    ) {

        const head =
            $("rekapTableHead");

        const body =
            $("rekapTableBody");


        if (!head || !body) {
            return;
        }


        /*
         * HEADER
         */

        head.innerHTML = "";


        const row1 =
            document.createElement("tr");


        row1.innerHTML = `
            <th rowspan="2">No</th>
            <th rowspan="2">NISN</th>
            <th rowspan="2">Nama Siswa</th>

            <th
                colspan="${jumlahHari}"
                class="summary-title"
            >
                TANGGAL
            </th>

            <th
                colspan="4"
                class="summary-title"
            >
                AKUMULASI KEHADIRAN
            </th>
        `;


        head.appendChild(row1);


        const row2 =
            document.createElement("tr");


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
                hari;

            row2.appendChild(th);
        }


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

                row2.appendChild(th);
            }
        );


        head.appendChild(row2);


        /*
         * BODY
         */

        body.innerHTML = "";


        if (!siswa.length) {

            const tr =
                document.createElement("tr");


            const td =
                document.createElement("td");


            td.colSpan =
                3 +
                jumlahHari +
                4;


            td.style.padding =
                "30px";


            td.textContent =
                "Tidak ada data siswa.";


            tr.appendChild(td);

            body.appendChild(tr);

            return;
        }


        siswa.forEach(
            function (siswaItem, index) {

                const tr =
                    document.createElement("tr");


                /*
                 * NO
                 */

                addCell(
                    tr,
                    index + 1
                );


                /*
                 * NISN
                 */

                addCell(
                    tr,
                    siswaItem.nisn ||
                    siswaItem.NISN ||
                    "-"
                );


                /*
                 * NAMA
                 */

                const namaTd =
                    document.createElement("td");

                namaTd.className =
                    "student-name";

                namaTd.textContent =
                    siswaItem.nama ||
                    siswaItem.NAMA ||
                    "-";

                tr.appendChild(namaTd);


                /*
                 * HITUNG AKUMULASI
                 */

                let hadir = 0;
                let sakit = 0;
                let izin = 0;
                let alpa = 0;


                const hariData =
                    siswaItem.hari ||
                    siswaItem.HARI ||
                    {};


                /*
                 * TANGGAL
                 */

                for (
                    let hari = 1;
                    hari <= jumlahHari;
                    hari++
                ) {

                    const status =
                        String(
                            hariData[hari] ||
                            "-"
                        )
                        .trim()
                        .toUpperCase();


                    if (
                        status === "H" ||
                        status === "HADIR"
                    ) {

                        hadir++;

                    } else if (
                        status === "S" ||
                        status === "SAKIT"
                    ) {

                        sakit++;

                    } else if (
                        status === "I" ||
                        status === "IZIN"
                    ) {

                        izin++;

                    } else if (
                        status === "A" ||
                        status === "ALPA"
                    ) {

                        alpa++;
                    }


                    const td =
                        document.createElement("td");

                    td.className =
                        "attendance-cell";

                    td.textContent =
                        status === "-"
                            ? ""
                            : status;

                    tr.appendChild(td);
                }


                /*
                 * AKUMULASI HADIR
                 */

                addSummaryCell(
                    tr,
                    hadir,
                    "summary-cell summary-hadir"
                );


                /*
                 * AKUMULASI SAKIT
                 */

                addSummaryCell(
                    tr,
                    sakit,
                    "summary-cell summary-sakit"
                );


                /*
                 * AKUMULASI IZIN
                 */

                addSummaryCell(
                    tr,
                    izin,
                    "summary-cell summary-izin"
                );


                /*
                 * AKUMULASI ALPA
                 */

                addSummaryCell(
                    tr,
                    alpa,
                    "summary-cell summary-alpa"
                );


                body.appendChild(tr);

            }
        );
    }


    /* =====================================================
       CELL
    ===================================================== */

    function addCell(
        tr,
        value
    ) {

        const td =
            document.createElement("td");

        td.textContent =
            value;

        tr.appendChild(td);
    }


    function addSummaryCell(
        tr,
        value,
        className
    ) {

        const td =
            document.createElement("td");

        td.className =
            className;

        td.textContent =
            value;

        tr.appendChild(td);
    }


    /* =====================================================
       SET TEXT
    ===================================================== */

    function setText(
        id,
        value
    ) {

        const el =
            $(id);

        if (el) {
            el.textContent =
                value;
        }
    }


    /* =====================================================
       CETAK
    ===================================================== */

    function cetakLaporan() {

        if (!currentReport) {

            setMessage(
                "Tampilkan laporan terlebih dahulu sebelum mencetak.",
                "error"
            );

            return;
        }


        window.print();
    }


    /* =====================================================
       EXPORT EXCEL
    ===================================================== */

    function exportExcel() {

        if (!currentReport) {

            setMessage(
                "Tampilkan laporan terlebih dahulu sebelum export Excel.",
                "error"
            );

            return;
        }


        if (
            typeof XLSX === "undefined"
        ) {

            setMessage(
                "Library Excel belum siap. Silakan tunggu sebentar lalu coba lagi.",
                "error"
            );

            return;
        }


        const table =
            $("rekapTable");


        if (!table) {
            return;
        }


        const workbook =
            XLSX.utils.book_new();


        const worksheet =
            XLSX.utils.table_to_sheet(
                table
            );


        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Rekap Absensi"
        );


        const bulan =
            Number(
                currentReport.bulan
            );


        const tahun =
            Number(
                currentReport.tahun
            );


        const namaKelas =
            currentReport.kelas?.nama ||
            "Kelas";


        const fileName =
            "Laporan_Absensi_" +
            namaKelas +
            "_" +
            (BULAN_NAMA[bulan] || "") +
            "_" +
            tahun +
            ".xlsx";


        XLSX.writeFile(
            workbook,
            fileName
        );
    }


    /* =====================================================
       JALANKAN
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    } else {

        init();
    }

})();
