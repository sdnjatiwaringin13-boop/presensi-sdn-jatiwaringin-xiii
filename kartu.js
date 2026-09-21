"use strict";


/* =========================================================
   KARTU SISWA
   SD NEGERI JATIWARINGIN XIII

   - Tidak menampilkan KELAS
   - Tidak menampilkan ID
   - QR hanya dibuat SATU kali
   - QR tetap membawa ID + NISN
   - Print 9 kartu / A4
========================================================= */


(function () {


    let semuaSiswa = [];


    const $ = function (id) {
        return document.getElementById(id);
    };


    /* =====================================================
       INIT
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        init
    );


    async function init() {


        /*
         * Pastikan user sudah login.
         *
         * Jangan menggunakan Auth.requireAdmin()
         * karena halaman ini menggunakan layout dashboard.
         */

        const user =
            typeof Auth !== "undefined" &&
            Auth.requireLogin
                ? Auth.requireLogin()
                : getCurrentUser();


        if (!user) {
            return;
        }


        bindEvents();


        await loadSiswa();

    }


    /* =====================================================
       EVENT
    ===================================================== */

    function bindEvents() {


        $("searchInput")
            ?.addEventListener(
                "input",
                renderSiswa
            );


        $("kelasFilter")
            ?.addEventListener(
                "change",
                renderSiswa
            );


        $("refreshButton")
            ?.addEventListener(
                "click",
                function () {

                    loadSiswa(true);

                }
            );


        $("printButton")
            ?.addEventListener(
                "click",
                function () {

                    window.print();

                }
            );

    }


    /* =====================================================
       LOAD SISWA
    ===================================================== */

    async function loadSiswa(forceRefresh) {


        const box =
            $("kartuContainer");


        if (box) {

            box.innerHTML = `

                <div class="kartu-loading">

                    <i class="fa-solid fa-spinner fa-spin"></i>

                    Memuat data siswa...

                </div>

            `;

        }


        try {


            const response =
                await callAPI({

                    action:
                        "getSiswa",

                    aktifOnly:
                        true,

                    forceRefresh:
                        !!forceRefresh

                });


            if (!response) {

                throw new Error(
                    "Server tidak memberikan respons."
                );

            }


            if (!response.success) {

                throw new Error(
                    response.message ||
                    "Data siswa gagal dimuat."
                );

            }


            semuaSiswa =
                Array.isArray(
                    response.data
                )
                    ? response.data
                    : [];


            loadKelasFilter();


            renderSiswa();


        } catch (error) {


            console.error(
                "Kartu siswa:",
                error
            );


            if (box) {

                box.innerHTML = `

                    <div class="kartu-empty">

                        <i
                            class="fa-solid fa-circle-exclamation"
                            style="color:#e74c3c;font-size:25px"
                        ></i>

                        <br><br>

                        <strong>
                            Data siswa gagal dimuat
                        </strong>

                        <br>

                        <small>
                            ${escapeHTML(
                                error.message ||
                                "Terjadi kesalahan."
                            )}
                        </small>

                    </div>

                `;

            }

        }

    }


    /* =====================================================
       FILTER KELAS
    ===================================================== */

    function loadKelasFilter() {


        const select =
            $("kelasFilter");


        if (!select) {
            return;
        }


        const daftarKelas =
            [
                ...new Set(

                    semuaSiswa
                        .map(function (siswa) {

                            return String(
                                siswa.KELAS ||
                                siswa.kelas ||
                                ""
                            ).trim();

                        })

                        .filter(Boolean)

                )
            ];


        daftarKelas.sort(
            function (a, b) {

                return a.localeCompare(
                    b,
                    "id",
                    {
                        numeric: true
                    }
                );

            }
        );


        select.innerHTML = `

            <option value="">
                Semua Kelas
            </option>

        `;


        daftarKelas.forEach(
            function (kelas) {


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    kelas;


                option.textContent =
                    kelas;


                select.appendChild(
                    option
                );

            }
        );

    }


    /* =====================================================
       FILTER + RENDER
    ===================================================== */

    function renderSiswa() {


        const box =
            $("kartuContainer");


        if (!box) {
            return;
        }


        const keyword =
            String(
                $("searchInput")?.value ||
                ""
            )
                .toLowerCase()
                .trim();


        const kelas =
            String(
                $("kelasFilter")?.value ||
                ""
            )
                .toLowerCase()
                .trim();


        const data =
            semuaSiswa.filter(
                function (siswa) {


                    const nama =
                        String(
                            siswa.NAMA ||
                            siswa.nama ||
                            ""
                        )
                            .toLowerCase();


                    const nisn =
                        String(
                            siswa.NISN ||
                            siswa.nisn ||
                            ""
                        )
                            .toLowerCase();


                    const kelasSiswa =
                        String(
                            siswa.KELAS ||
                            siswa.kelas ||
                            ""
                        )
                            .toLowerCase();


                    const cocokSearch =
                        !keyword ||
                        nama.includes(keyword) ||
                        nisn.includes(keyword);


                    const cocokKelas =
                        !kelas ||
                        kelasSiswa === kelas;


                    return (
                        cocokSearch &&
                        cocokKelas
                    );

                }
            );


        if (!data.length) {

            box.innerHTML = `

                <div class="kartu-empty">

                    <i
                        class="fa-solid fa-user-slash"
                        style="font-size:25px"
                    ></i>

                    <br><br>

                    Data siswa tidak ditemukan.

                </div>

            `;

            return;
        }


        /*
         * Bersihkan container TERLEBIH DAHULU.
         *
         * Ini penting agar QR lama tidak ikut tertinggal.
         */

        box.innerHTML = "";


        /*
         * Buat kartu satu per satu.
         */

        data.forEach(
            function (siswa, index) {

                const kartu =
                    createStudentCard(
                        siswa,
                        index
                    );

                box.appendChild(kartu);

            }
        );

    }


    /* =====================================================
       CREATE STUDENT CARD
    ===================================================== */

    function createStudentCard(
        siswa,
        index
    ) {


        const id =
            siswa.ID ??
            siswa.id ??
            "";


        const nisn =
            siswa.NISN ??
            siswa.nisn ??
            "-";


        const nama =
            siswa.NAMA ??
            siswa.nama ??
            "-";


        const tanggalLahir =
            siswa.TANGGAL_LAHIR ??
            siswa.tanggal_lahir ??
            siswa.tanggalLahir ??
            siswa.TGL_LAHIR ??
            siswa.tgl_lahir ??
            siswa.tglLahir ??
            "-";


        const card =
            document.createElement(
                "article"
            );


        card.className =
            "student-card";


        /*
         * SATU ID QR SAJA
         */

        const qrId =
            "qr-card-" +
            index +
            "-" +
            String(id)
                .replace(
                    /[^a-zA-Z0-9_-]/g,
                    ""
                );


        card.innerHTML = `


            <!-- HEADER -->

            <div class="card-red"></div>

            <div class="card-gray"></div>

            <div class="card-yellow"></div>


            <!-- BULATAN -->

            <div class="card-circles">

                <span></span>
                <span></span>
                <span></span>
                <span></span>

            </div>


            <!-- DOT -->

            <div class="card-dots"></div>


            <!-- NAMA SEKOLAH -->

            <div class="school-name">

                SD NEGERI<br>
                JATIWARINGIN XIII

            </div>


            <!-- JUDUL -->

            <div class="card-heading">

                KARTU PELAJAR

            </div>


            <!-- QR -->

            <div class="qr-box">

                <div
                    class="qr-code"
                    id="${qrId}"
                ></div>

            </div>


            <!-- DATA -->

            <div class="student-data">


                <div class="data-row">

                    <div class="data-label">
                        NAMA
                    </div>

                    <div class="data-colon">
                        :
                    </div>

                    <div
                        class="data-value"
                        title="${escapeAttr(nama)}"
                    >
                        ${escapeHTML(nama)}
                    </div>

                </div>


                <div class="data-row">

                    <div class="data-label">
                        NISN
                    </div>

                    <div class="data-colon">
                        :
                    </div>

                    <div class="data-value">

                        ${escapeHTML(nisn)}

                    </div>

                </div>


                <div class="data-row">

                    <div class="data-label">
                        TGL LAHIR
                    </div>

                    <div class="data-colon">
                        :
                    </div>

                    <div class="data-value">

                        ${escapeHTML(
                            formatTanggal(
                                tanggalLahir
                            )
                        )}

                    </div>

                </div>


            </div>


            <!-- FOOTER -->

            <div class="card-chevron">

                <span></span>
                <span></span>
                <span></span>

            </div>


            <div class="card-footer-red"></div>

            <div class="card-footer-yellow"></div>


        `;


        /*
         * BUAT QR HANYA SATU KALI
         */

        const qrElement =
            card.querySelector(
                "#" + qrId
            );


        if (
            qrElement &&
            typeof QRCode !== "undefined"
        ) {


            /*
             * QR membawa ID + NISN.
             *
             * ID TIDAK DITAMPILKAN
             * pada kartu.
             */

            const qrData =
                JSON.stringify({

                    id:
                        String(id),

                    nisn:
                        String(nisn)

                });


            new QRCode(
                qrElement,
                {

                    text:
                        qrData,

                    width:
                        180,

                    height:
                        180,

                    colorDark:
                        "#000000",

                    colorLight:
                        "#ffffff",

                    correctLevel:
                        QRCode.CorrectLevel.M

                }
            );

        }


        return card;

    }


    /* =====================================================
       FORMAT TANGGAL
    ===================================================== */

    function formatTanggal(value) {


        if (
            !value ||
            value === "-" ||
            value === "null" ||
            value === "undefined"
        ) {

            return "-";

        }


        const text =
            String(value)
                .trim();


        /*
         * Jika sudah berupa:
         * 26 Agustus 2017
         */

        if (
            /[A-Za-z]/.test(text)
        ) {

            return text;

        }


        /*
         * YYYY-MM-DD
         */

        const match =
            text.match(
                /^(\d{4})-(\d{1,2})-(\d{1,2})/
            );


        if (match) {


            const tahun =
                Number(
                    match[1]
                );


            const bulan =
                Number(
                    match[2]
                );


            const hari =
                Number(
                    match[3]
                );


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


            return (
                hari +
                " " +
                (
                    namaBulan[bulan] ||
                    ""
                ) +
                " " +
                tahun
            );

        }


        /*
         * Jika Google Sheet mengirim
         * Date string.
         */

        const date =
            new Date(text);


        if (
            !isNaN(
                date.getTime()
            )
        ) {


            const hari =
                date.getDate();


            const bulan =
                date.getMonth() + 1;


            const tahun =
                date.getFullYear();


            const namaBulan = [

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


            return (
                hari +
                " " +
                namaBulan[
                    bulan - 1
                ] +
                " " +
                tahun
            );

        }


        return text;

    }


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHTML(value) {

        return String(
            value ?? ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }


    function escapeAttr(value) {

        return escapeHTML(
            value
        );

    }


    /* =====================================================
       PUBLIC REFRESH
    ===================================================== */

    window.loadKartuSiswa =
        function () {

            loadSiswa(true);

        };


})();
