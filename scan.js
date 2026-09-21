"use strict";


(function () {


    /* =====================================================
       VARIABLE
    ===================================================== */

    let semuaSiswa = [];

    let scanner = null;

    let kameraAktif = false;

    let sedangMemproses = false;

    let scanTerakhir = "";

    let waktuScanTerakhir = 0;

    let userLogin = null;

    let idGuruLogin = "";


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
         * CEK LOGIN
         */

        userLogin =
            getCurrentUser();


        if (!userLogin) {

            location.href =
                "index.html";

            return;

        }


        /*
         * ROLE
         */

        const role =
            String(
                userLogin.role || ""
            )
            .toUpperCase();


        if (
            role !== "GURU" &&
            role !== "ADMIN"
        ) {

            location.href =
                "dashboard.html";

            return;

        }


        idGuruLogin =
            String(
                userLogin.idGuru || ""
            );


        /*
         * TAMPILKAN GURU
         */

        tampilkanGuru();


        /*
         * BUTTON
         */

        bindEvents();


        /*
         * PENTING:
         *
         * DATA SISWA HARUS SELESAI
         * DIMUAT SEBELUM SCANNER DIMULAI.
         *
         * Ini mencegah QR terbaca ketika
         * array siswa masih kosong.
         */

        await loadSiswa();


        /*
         * Setelah data tersedia,
         * baru mulai kamera.
         */

        if (
            typeof Html5Qrcode ===
            "undefined"
        ) {

            tampilkanError(
                "Library QR Scanner tidak berhasil dimuat."
            );

            return;

        }


        mulaiScanner();

    }


    /* =====================================================
       EVENT
    ===================================================== */

    function bindEvents() {


        const startButton =
            $("startScanButton");


        const stopButton =
            $("stopScanButton");


        if (startButton) {

            startButton.addEventListener(
                "click",
                mulaiScanner
            );

        }


        if (stopButton) {

            stopButton.addEventListener(
                "click",
                stopScanner
            );

        }

    }


    /* =====================================================
       INFO GURU
    ===================================================== */

    function tampilkanGuru() {


        const nama =
            userLogin.nama ||
            userLogin.username ||
            "Pengguna";


        const role =
            String(
                userLogin.role || ""
            )
            .toUpperCase();


        const namaElement =
            $("guruNama");


        const roleElement =
            $("guruRole");


        if (namaElement) {

            namaElement.textContent =
                nama;

        }


        if (roleElement) {

            roleElement.textContent =
                role === "GURU"
                    ? "Guru / Wali Kelas"
                    : "Administrator";

        }

    }


    /* =====================================================
       LOAD SISWA
    ===================================================== */

    async function loadSiswa() {


        tampilkanStatus(
            "Memuat data siswa...",
            "info"
        );


        try {


            const result =
                await callAPI({

                    action:
                        "getSiswa",

                    aktifOnly:
                        true,

                    forceRefresh:
                        true

                });


            if (
                !result ||
                !result.success
            ) {

                throw new Error(
                    result?.message ||
                    "Gagal mengambil data siswa."
                );

            }


            semuaSiswa =
                Array.isArray(
                    result.data
                )
                    ? result.data
                    : [];


            if (
                semuaSiswa.length === 0
            ) {

                throw new Error(
                    "Data siswa kosong."
                );

            }


            tampilkanStatus(
                "Data siswa siap. Silakan arahkan QR ke kamera.",
                "info"
            );


            console.log(
                "Jumlah siswa:",
                semuaSiswa.length
            );


        } catch (error) {


            console.error(
                "loadSiswa:",
                error
            );


            tampilkanError(
                error.message
            );

        }

    }


    /* =====================================================
       START CAMERA
    ===================================================== */

    async function mulaiScanner() {


        if (kameraAktif) {

            return;

        }


        if (
            typeof Html5Qrcode ===
            "undefined"
        ) {

            tampilkanError(
                "Library QR Scanner belum tersedia."
            );

            return;

        }


        const reader =
            $("reader");


        if (!reader) {

            tampilkanError(
                "Elemen kamera tidak ditemukan."
            );

            return;

        }


        /*
         * Jangan membuat scanner
         * berkali-kali.
         */

        if (!scanner) {

            scanner =
                new Html5Qrcode(
                    "reader"
                );

        }


        tampilkanStatus(
            "Memulai kamera...",
            "info"
        );


        try {


            /*
             * Pastikan kamera lama
             * benar-benar berhenti.
             */

            if (kameraAktif) {

                await stopScanner();

            }


            const config = {

                fps: 10,

                qrbox: function (
                    width,
                    height
                ) {

                    const size =
                        Math.floor(
                            Math.min(
                                width,
                                height
                            ) * 0.65
                        );

                    return {

                        width:
                            Math.min(
                                280,
                                size
                            ),

                        height:
                            Math.min(
                                280,
                                size
                            )

                    };

                },

                aspectRatio: 1.0,

                disableFlip: false

            };


            /*
             * Kamera belakang
             */

            await scanner.start(

                {
                    facingMode:
                        "environment"
                },

                config,

                onScanSuccess,

                function () {
                    /*
                     * Jangan tampilkan error
                     * untuk setiap frame yang
                     * belum membaca QR.
                     */
                }

            );


            kameraAktif = true;


            tampilkanStatus(
                "Kamera aktif. Arahkan QR kartu siswa ke kotak scanner.",
                "info"
            );


        } catch (error) {


            console.error(
                "start camera:",
                error
            );


            kameraAktif = false;


            /*
             * Jika facingMode environment
             * gagal, coba daftar kamera.
             */

            try {

                const cameras =
                    await Html5Qrcode
                        .getCameras();


                if (
                    cameras &&
                    cameras.length
                ) {


                    /*
                     * Ambil kamera terakhir
                     * sebagai fallback.
                     */

                    const cameraId =
                        cameras[
                            cameras.length - 1
                        ].id;


                    await scanner.start(

                        cameraId,

                        {

                            fps: 10,

                            qrbox: {
                                width: 250,
                                height: 250
                            },

                            aspectRatio: 1.0

                        },

                        onScanSuccess,

                        function () {}

                    );


                    kameraAktif = true;


                    tampilkanStatus(
                        "Kamera aktif. Silakan scan QR siswa.",
                        "info"
                    );


                    return;

                }


            } catch (
                fallbackError
            ) {

                console.error(
                    "fallback camera:",
                    fallbackError
                );

            }


            tampilkanError(
                "Kamera tidak dapat digunakan. " +
                "Pastikan browser memiliki izin kamera " +
                "dan website dibuka melalui HTTPS."
            );

        }

    }


    /* =====================================================
       STOP CAMERA
    ===================================================== */

    async function stopScanner() {


        if (
            !scanner ||
            !kameraAktif
        ) {

            return;

        }


        try {


            await scanner.stop();


            kameraAktif = false;


        } catch (error) {


            console.error(
                "stop scanner:",
                error
            );


            kameraAktif = false;

        }

    }


    /* =====================================================
       QR BERHASIL DIBACA
    ===================================================== */

    async function onScanSuccess(
        decodedText,
        decodedResult
    ) {


        /*
         * Jangan memproses QR yang sama
         * berkali-kali.
         */

        const raw =
            String(
                decodedText || ""
            )
            .trim();


        if (!raw) {

            return;

        }


        const sekarang =
            Date.now();


        if (
            sedangMemproses
        ) {

            return;

        }


        if (
            raw === scanTerakhir &&
            (
                sekarang -
                waktuScanTerakhir
            ) < 3000
        ) {

            return;

        }


        scanTerakhir =
            raw;


        waktuScanTerakhir =
            sekarang;


        sedangMemproses = true;


        try {


            tampilkanStatus(
                "QR terbaca. Mencari data siswa...",
                "info"
            );


            /*
             * BERHENTI SEBENTAR
             * supaya kamera tidak
             * membaca QR yang sama.
             */

            await stopScanner();


            /*
             * PROSES QR
             */

            await prosesQR(
                raw
            );


        } catch (error) {


            console.error(
                "scan:",
                error
            );


            tampilkanError(
                error.message ||
                "QR gagal diproses."
            );


        } finally {


            /*
             * Beri jeda sebelum
             * scanner boleh membaca
             * QR lagi.
             */

            setTimeout(
                function () {

                    sedangMemproses =
                        false;

                },
                1500
            );

        }

    }


    /* =====================================================
       PROSES ISI QR
    ===================================================== */

    async function prosesQR(
        rawQR
    ) {


        let qrData =
            null;


        /*
         * ==================================================
         * FORMAT 1
         *
         * QR BARU:
         *
         * {"id":"50001","nisn":"3197504114"}
         * ==================================================
         */

        try {


            qrData =
                JSON.parse(
                    rawQR
                );


        } catch (error) {


            /*
             * Bukan JSON.
             *
             * Tidak masalah.
             * Bisa jadi QR lama
             * hanya berisi ID.
             */

            qrData = null;

        }


        let idSiswa =
            "";


        let nisnQR =
            "";


        /*
         * Kalau JSON
         */

        if (
            qrData &&
            typeof qrData === "object"
        ) {


            idSiswa =
                String(
                    qrData.id ||
                    qrData.ID ||
                    qrData.idSiswa ||
                    qrData.ID_SISWA ||
                    ""
                )
                .trim();


            nisnQR =
                String(
                    qrData.nisn ||
                    qrData.NISN ||
                    ""
                )
                .trim();

        }


        /*
         * Kalau QR biasa
         */

        if (!idSiswa) {

            idSiswa =
                rawQR.trim();

        }


        /*
         * ==================================================
         * CARI SISWA
         * ==================================================
         */

        let siswa = null;


        /*
         * Prioritas:
         *
         * 1. ID
         * 2. NISN
         */

        if (idSiswa) {


            siswa =
                semuaSiswa.find(
                    function (item) {

                        return String(
                            item.ID || ""
                        )
                        .trim() ===
                        idSiswa;

                    }
                );

        }


        /*
         * Kalau ID tidak ditemukan,
         * coba NISN.
         */

        if (
            !siswa &&
            nisnQR
        ) {

            siswa =
                semuaSiswa.find(
                    function (item) {

                        return String(
                            item.NISN || ""
                        )
                        .trim() ===
                        nisnQR;

                    }
                );

        }


        /*
         * Kalau QR berisi NISN
         * langsung.
         */

        if (
            !siswa &&
            /^\d+$/.test(rawQR)
        ) {

            siswa =
                semuaSiswa.find(
                    function (item) {

                        return String(
                            item.NISN || ""
                        )
                        .trim() ===
                        rawQR;

                    }
                );

        }


        /*
         * SISWA TIDAK DITEMUKAN
         */

        if (!siswa) {


            tampilkanError(

                "Siswa tidak ditemukan. " +

                "Pastikan QR berasal dari " +

                "menu Kartu Siswa."

            );


            jadwalkanScanner();

            return;

        }


        /*
         * ==================================================
         * SIMPAN PRESENSI
         * ==================================================
         */

        await simpanPresensi(
            siswa
        );

    }


    /* =====================================================
       SIMPAN PRESENSI
    ===================================================== */

    async function simpanPresensi(
        siswa
    ) {


        tampilkanStatus(
            "Menyimpan presensi " +
            siswa.NAMA +
            "...",
            "info"
        );


        try {


            const result =
                await callAPI({

                    action:
                        "simpanPresensi",

                    /*
                     * INI YANG PALING PENTING
                     *
                     * Kirim ID SISWA
                     * yang berasal dari
                     * data SISWA.
                     */

                    id:
                        String(
                            siswa.ID
                        )
                        .trim(),

                    nisn:
                        String(
                            siswa.NISN || ""
                        )
                        .trim(),

                    nama:
                        String(
                            siswa.NAMA || ""
                        )
                        .trim(),

                    kelas:
                        String(
                            siswa.KELAS || ""
                        )
                        .trim(),

                    status:
                        "HADIR",

                    sumber:
                        "QR",

                    idGuru:
                        idGuruLogin

                });


            console.log(
                "HASIL SIMPAN PRESENSI:",
                result
            );


            if (
                !result ||
                !result.success
            ) {

                throw new Error(

                    result?.message ||

                    "Presensi gagal disimpan."

                );

            }


            /*
             * BERHASIL
             */

            tampilkanBerhasil(
                siswa,
                result
            );


        } catch (error) {


            console.error(
                "simpanPresensi:",
                error
            );


            tampilkanError(
                error.message ||
                "Presensi gagal disimpan."
            );


            jadwalkanScanner();

        }

    }


    /* =====================================================
       TAMPIL BERHASIL
    ===================================================== */

    function tampilkanBerhasil(
        siswa,
        result
    ) {


        const resultBox =
            $("result");


        if (!resultBox) {

            return;

        }


        const sekarang =
            new Date();


        const waktu =
            sekarang.toLocaleTimeString(
                "id-ID",
                {
                    hour:
                        "2-digit",

                    minute:
                        "2-digit",

                    second:
                        "2-digit"
                }
            );


        resultBox.className =
            "";


        resultBox.innerHTML = `


            <div
                class="student-result"
            >


                <div
                    class="student-result-header"
                >

                    <div class="status">

                        <i
                            class="fa-solid fa-circle-check"
                        ></i>

                        Presensi Berhasil

                    </div>


                    <div class="name">

                        ${escapeHTML(
                            siswa.NAMA
                        )}

                    </div>

                </div>


                <div
                    class="student-result-body"
                >


                    <div class="result-row">

                        <div class="result-label">
                            NISN
                        </div>

                        <div class="result-colon">
                            :
                        </div>

                        <div class="result-value">

                            ${escapeHTML(
                                siswa.NISN ||
                                "-"
                            )}

                        </div>

                    </div>


                    <div class="result-row">

                        <div class="result-label">
                            Kelas
                        </div>

                        <div class="result-colon">
                            :
                        </div>

                        <div class="result-value">

                            ${escapeHTML(
                                siswa.KELAS ||
                                "-"
                            )}

                        </div>

                    </div>


                    <div class="result-row">

                        <div class="result-label">
                            Status
                        </div>

                        <div class="result-colon">
                            :
                        </div>

                        <div
                            class="result-value"
                            style="color:#219653"
                        >

                            HADIR

                        </div>

                    </div>


                    <div class="result-row">

                        <div class="result-label">
                            Waktu
                        </div>

                        <div class="result-colon">
                            :
                        </div>

                        <div class="result-value">

                            ${waktu}

                        </div>

                    </div>


                </div>


            </div>

        `;


        tampilkanStatus(
            "Presensi " +
            siswa.NAMA +
            " berhasil dicatat.",
            "success"
        );


        /*
         * Setelah 2 detik,
         * kamera aktif kembali.
         */

        jadwalkanScanner();

    }


    /* =====================================================
       JADWALKAN SCANNER
    ===================================================== */

    function jadwalkanScanner() {


        setTimeout(
            function () {


                if (
                    !kameraAktif &&
                    !sedangMemproses
                ) {

                    mulaiScanner();

                }


            },
            2000
        );

    }


    /* =====================================================
       STATUS
    ===================================================== */

    function tampilkanStatus(
        message,
        type
    ) {


        const element =
            $("scanStatus");


        if (!element) {

            return;

        }


        element.className =
            "alert alert-" +
            (
                type ||
                "info"
            );


        element.textContent =
            message;


        element.style.display =
            "block";

    }


    /* =====================================================
       ERROR
    ===================================================== */

    function tampilkanError(
        message
    ) {


        const result =
            $("result");


        if (result) {

            result.className =
                "";


            result.innerHTML = `

                <div
                    class="alert alert-danger"
                    style="
                        padding:18px;
                        text-align:center;
                    "
                >

                    <i
                        class="fa-solid fa-circle-exclamation"
                        style="
                            font-size:30px;
                            margin-bottom:10px;
                        "
                    ></i>

                    <br>

                    <strong>
                        Presensi Gagal
                    </strong>

                    <br><br>

                    ${escapeHTML(
                        message ||
                        "Terjadi kesalahan."
                    )}

                </div>

            `;

        }


        tampilkanStatus(
            "Presensi gagal.",
            "danger"
        );

    }


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHTML(
        value
    ) {

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


    /* =====================================================
       PUBLIC FUNCTION
    ===================================================== */

    window.mulaiScanner =
        mulaiScanner;


    window.stopScanner =
        stopScanner;


})();
