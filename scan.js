"use strict";


(function () {


    /* =====================================================
       VARIABLE
    ===================================================== */

    let scanner = null;

    let kameraAktif = false;

    let sedangMemproses = false;

    let semuaSiswa = [];

    let userLogin = null;

    let idGuruLogin = "";

    let scanTerakhir = "";

    let waktuScanTerakhir = 0;


    const $ = id =>
        document.getElementById(id);


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
            .trim()
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
            )
            .trim();


        /*
         * TAMPILKAN USER
         */

        tampilkanUser();


        /*
         * BUTTON
         */

        $("startScanButton")
            ?.addEventListener(
                "click",
                mulaiScanner
            );


        $("stopScanButton")
            ?.addEventListener(
                "click",
                stopScanner
            );


        /*
         * CEK LIBRARY
         */

        if (
            typeof Html5Qrcode ===
            "undefined"
        ) {

            tampilkanStatus(
                "Library kamera belum berhasil dimuat.",
                "error"
            );

            return;

        }


        /*
         * LOAD SISWA DAN KAMERA
         * SECARA BERSAMAAN
         *
         * Jadi kamera tidak menunggu
         * data siswa selesai dimuat.
         */

        loadSiswa();


        /*
         * OTOMATIS BUKA KAMERA
         */

        setTimeout(
            function () {

                mulaiScanner();

            },
            300
        );

    }


    /* =====================================================
       USER
    ===================================================== */

    function tampilkanUser() {


        const nama =
            userLogin.nama ||
            userLogin.username ||
            "Pengguna";


        const role =
            String(
                userLogin.role || ""
            )
            .toUpperCase();


        if ($("guruNama")) {

            $("guruNama")
                .textContent =
                nama;

        }


        if ($("guruRole")) {

            $("guruRole")
                .textContent =
                role === "GURU"
                    ? "Guru / Wali Kelas"
                    : "Administrator";

        }

    }


    /* =====================================================
       LOAD SISWA
    ===================================================== */

    async function loadSiswa() {


        try {


            const result =
                await callAPI({

                    action:
                        "getSiswa",

                    aktifOnly:
                        true

                });


            if (
                !result ||
                result.success === false
            ) {

                throw new Error(

                    result?.message ||

                    "Data siswa gagal dimuat."

                );

            }


            semuaSiswa =
                Array.isArray(
                    result.data
                )
                    ? result.data
                    : [];


            console.log(
                "DATA SISWA SCAN:",
                semuaSiswa
            );


            if (
                semuaSiswa.length === 0
            ) {

                tampilkanStatus(
                    "Data siswa kosong.",
                    "warning"
                );

                return;

            }


            if (!kameraAktif) {

                tampilkanStatus(
                    "Kamera aktif. Arahkan QR kartu siswa ke kamera.",
                    "info"
                );

            }


        } catch (error) {


            console.error(
                "getSiswa:",
                error
            );


            tampilkanStatus(
                "Data siswa gagal dimuat: " +
                error.message,
                "error"
            );

        }

    }


    /* =====================================================
       MULAI KAMERA
    ===================================================== */

    async function mulaiScanner() {


        if (kameraAktif) {

            return;

        }


        if (
            typeof Html5Qrcode ===
            "undefined"
        ) {

            tampilkanStatus(
                "Library QR Scanner belum tersedia.",
                "error"
            );

            return;

        }


        const reader =
            $("reader");


        if (!reader) {

            return;

        }


        /*
         * Bersihkan reader jika
         * ada instance lama.
         */

        reader.innerHTML = "";


        scanner =
            new Html5Qrcode(
                "reader"
            );


        tampilkanStatus(
            "Meminta izin kamera...",
            "info"
        );


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

            rememberLastUsedCamera: true,

            showTorchButtonIfSupported: true

        };


        try {


            /*
             * COBA KAMERA BELAKANG
             */

            await scanner.start(

                {
                    facingMode:
                        {
                            exact:
                                "environment"
                        }
                },

                config,

                onScanSuccess,

                onScanError

            );


            kameraAktif = true;


            tampilkanStatus(
                "Kamera aktif. Arahkan QR kartu siswa ke kamera.",
                "info"
            );


            return;


        } catch (error1) {


            console.warn(
                "Kamera environment gagal:",
                error1
            );


            /*
             * STOP INSTANCE
             */

            try {

                await scanner.clear();

            } catch (_) {}


            reader.innerHTML = "";


            scanner =
                new Html5Qrcode(
                    "reader"
                );

        }


        /*
         * FALLBACK:
         * AMBIL DAFTAR KAMERA
         */

        try {


            tampilkanStatus(
                "Mencari kamera perangkat...",
                "info"
            );


            const cameras =
                await Html5Qrcode
                    .getCameras();


            if (
                !cameras ||
                cameras.length === 0
            ) {

                throw new Error(
                    "Tidak ada kamera yang ditemukan."
                );

            }


            /*
             * Prioritaskan kamera yang
             * namanya mengandung back/rear.
             */

            let selectedCamera =
                cameras.find(
                    camera => {

                        const label =
                            String(
                                camera.label ||
                                ""
                            )
                            .toLowerCase();


                        return (

                            label.includes(
                                "back"
                            ) ||

                            label.includes(
                                "rear"
                            ) ||

                            label.includes(
                                "environment"
                            )

                        );

                    }
                );


            if (!selectedCamera) {

                selectedCamera =
                    cameras[
                        cameras.length - 1
                    ];

            }


            await scanner.start(

                selectedCamera.id,

                config,

                onScanSuccess,

                onScanError

            );


            kameraAktif = true;


            tampilkanStatus(
                "Kamera aktif. Arahkan QR kartu siswa ke kamera.",
                "info"
            );


        } catch (error2) {


            console.error(
                "Kamera gagal:",
                error2
            );


            kameraAktif = false;


            tampilkanStatus(

                "Kamera tidak dapat dibuka. " +

                "Pastikan izin kamera diberikan " +

                "kepada Chrome dan website menggunakan HTTPS.",

                "error"

            );

        }

    }


    /* =====================================================
       ERROR FRAME SCAN
       JANGAN TAMPILKAN KE USER
    ===================================================== */

    function onScanError(
        errorMessage
    ) {

        /*
         * html5-qrcode akan memanggil
         * fungsi ini berkali-kali ketika
         * belum menemukan QR.
         *
         * Jangan tampilkan error.
         */

    }


    /* =====================================================
       QR BERHASIL
    ===================================================== */

    async function onScanSuccess(
        decodedText,
        decodedResult
    ) {


        const raw =
            String(
                decodedText || ""
            )
            .trim();


        if (!raw) {

            return;

        }


        /*
         * JANGAN SCAN BERULANG
         */

        const now =
            Date.now();


        if (
            sedangMemproses
        ) {

            return;

        }


        if (

            raw === scanTerakhir &&

            (
                now -
                waktuScanTerakhir
            ) < 3000

        ) {

            return;

        }


        scanTerakhir =
            raw;


        waktuScanTerakhir =
            now;


        sedangMemproses =
            true;


        console.log(
            "QR TERBACA:",
            raw
        );


        try {


            tampilkanStatus(
                "QR berhasil terbaca. Memproses...",
                "info"
            );


            /*
             * MATIKAN KAMERA
             * sementara
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
                "PROSES QR:",
                error
            );


            tampilkanError(
                error.message ||
                "QR gagal diproses."
            );


        } finally {


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
       PROSES QR
    ===================================================== */

    async function prosesQR(
        rawQR
    ) {


        let qrData = null;


        /*
         * COBA PARSE JSON
         */

        try {

            qrData =
                JSON.parse(
                    rawQR
                );

        } catch (_) {

            qrData = null;

        }


        let idSiswa = "";

        let nisnQR = "";


        /*
         * =================================================
         * QR FORMAT BARU
         *
         * {"id":"50001","nisn":"3197504114"}
         * =================================================
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
         * =================================================
         * QR BIASA
         *
         * 50001
         * =================================================
         */

        if (!idSiswa) {

            idSiswa =
                rawQR.trim();

        }


        console.log(
            "ID DARI QR:",
            idSiswa
        );


        console.log(
            "NISN DARI QR:",
            nisnQR
        );


        /*
         * =================================================
         * CARI SISWA BERDASARKAN ID
         * =================================================
         */

        let siswa =
            semuaSiswa.find(
                item => {

                    return String(
                        item.ID || ""
                    )
                    .trim() ===
                    idSiswa;

                }
            );


        /*
         * =================================================
         * JIKA TIDAK KETEMU,
         * CARI BERDASARKAN NISN
         * =================================================
         */

        if (
            !siswa &&
            nisnQR
        ) {

            siswa =
                semuaSiswa.find(
                    item => {

                        return String(
                            item.NISN || ""
                        )
                        .trim() ===
                        nisnQR;

                    }
                );

        }


        /*
         * =================================================
         * JIKA QR HANYA ANGKA,
         * COBA SEBAGAI NISN
         * =================================================
         */

        if (
            !siswa &&
            /^\d+$/.test(
                rawQR
            )
        ) {

            siswa =
                semuaSiswa.find(
                    item => {

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


            throw new Error(

                "QR terbaca, tetapi siswa tidak ditemukan. " +

                "ID: " +

                idSiswa

            );

        }


        console.log(
            "SISWA DITEMUKAN:",
            siswa
        );


        /*
         * SIMPAN PRESENSI
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


        const payload = {

            action:
                "simpanPresensi",

            /*
             * ID SISWA
             */

            id:
                String(
                    siswa.ID || ""
                )
                .trim(),

            /*
             * DATA SISWA
             */

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

            /*
             * STATUS OTOMATIS
             */

            status:
                "HADIR",

            /*
             * SUMBER QR
             */

            sumber:
                "QR",

            /*
             * GURU LOGIN
             */

            idGuru:
                idGuruLogin

        };


        console.log(
            "PAYLOAD PRESENSI:",
            payload
        );


        const result =
            await callAPI(
                payload
            );


        console.log(
            "HASIL SERVER:",
            result
        );


        if (
            !result ||
            result.success !== true
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

    }


    /* =====================================================
       HASIL BERHASIL
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


        const waktu =
            new Intl.DateTimeFormat(
                "id-ID",
                {

                    hour:
                        "2-digit",

                    minute:
                        "2-digit",

                    second:
                        "2-digit"

                }
            )
            .format(
                new Date()
            );


        resultBox.innerHTML = `

            <div
                class="student-success"
            >

                <div
                    class="student-success-head"
                >

                    <div
                        class="student-success-status"
                    >

                        <i
                            class="fa-solid fa-circle-check"
                        ></i>

                        PRESENSI BERHASIL

                    </div>


                    <div
                        class="student-success-name"
                    >

                        ${escapeHTML(
                            siswa.NAMA
                        )}

                    </div>

                </div>


                <div
                    class="student-info"
                >


                    <div class="info-row">

                        <div
                            class="info-label"
                        >
                            ID
                        </div>

                        <div>
                            :
                        </div>

                        <div
                            class="info-value"
                        >
                            ${escapeHTML(
                                siswa.ID ||
                                "-"
                            )}
                        </div>

                    </div>


                    <div class="info-row">

                        <div
                            class="info-label"
                        >
                            NISN
                        </div>

                        <div>
                            :
                        </div>

                        <div
                            class="info-value"
                        >
                            ${escapeHTML(
                                siswa.NISN ||
                                "-"
                            )}
                        </div>

                    </div>


                    <div class="info-row">

                        <div
                            class="info-label"
                        >
                            Kelas
                        </div>

                        <div>
                            :
                        </div>

                        <div
                            class="info-value"
                        >
                            ${escapeHTML(
                                siswa.KELAS ||
                                "-"
                            )}
                        </div>

                    </div>


                    <div class="info-row">

                        <div
                            class="info-label"
                        >
                            Status
                        </div>

                        <div>
                            :
                        </div>

                        <div
                            class="info-value"
                            style="color:#218648"
                        >
                            HADIR
                        </div>

                    </div>


                    <div class="info-row">

                        <div
                            class="info-label"
                        >
                            Waktu
                        </div>

                        <div>
                            :
                        </div>

                        <div
                            class="info-value"
                        >
                            ${waktu}
                        </div>

                    </div>


                </div>

            </div>

        `;


        tampilkanStatus(
            "Presensi " +
            siswa.NAMA +
            " berhasil disimpan.",
            "success"
        );


        /*
         * AKTIFKAN KAMERA LAGI
         */

        setTimeout(
            function () {

                if (
                    !kameraAktif &&
                    !sedangMemproses
                ) {

                    mulaiScanner();

                }

            },
            1800
        );

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


        } catch (error) {


            console.warn(
                "stop camera:",
                error
            );

        }


        kameraAktif =
            false;

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
            "scan-status";


        if (
            type === "success"
        ) {

            element.classList.add(
                "success"
            );

        }


        if (
            type === "error"
        ) {

            element.classList.add(
                "error"
            );

        }


        if (
            type === "warning"
        ) {

            element.classList.add(
                "warning"
            );

        }


        element.textContent =
            message;

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

            result.innerHTML = `

                <div
                    style="
                        padding:20px;
                        text-align:center;
                        color:#b42318;
                    "
                >

                    <i
                        class="fa-solid fa-circle-exclamation"
                        style="
                            font-size:35px;
                            margin-bottom:10px;
                        "
                    ></i>


                    <div
                        style="
                            font-weight:800;
                            margin-bottom:7px;
                        "
                    >
                        Presensi Gagal
                    </div>


                    <div
                        style="
                            font-size:11px;
                        "
                    >
                        ${escapeHTML(
                            message
                        )}
                    </div>

                </div>

            `;

        }


        tampilkanStatus(
            message,
            "error"
        );


        /*
         * Kamera hidup lagi
         */

        setTimeout(
            function () {

                if (
                    !kameraAktif &&
                    !sedangMemproses
                ) {

                    mulaiScanner();

                }

            },
            1800
        );

    }


    /* =====================================================
       ESCAPE
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


})();
