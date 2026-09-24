/* =========================================================
   SCAN PRESENSI - FINAL
   SD NEGERI JATIWARINGIN XIII

   QR DARI KARTU SISWA:
   HANYA BERISI ID SISWA

   Contoh:
   50001

   Scanner:
   50001
      ↓
   Apps Script
      ↓
   cari ID SISWA
      ↓
   HADIR
   ========================================================= */

(function () {

    "use strict";


    let scanner = null;

    let sedangScan = false;

    let scannerBerjalan = false;

    let scanTerakhir = "";

    let waktuScanTerakhir = 0;


    const JEDA_SCAN = 3000;


    /* =====================================================
       INIT
       ===================================================== */

    function init() {

        console.log("================================");
        console.log("SCAN PRESENSI FINAL");
        console.log("================================");


        const status =
            document.getElementById(
                "scanStatus"
            );


        const startButton =
            document.getElementById(
                "startScanButton"
            );


        const stopButton =
            document.getElementById(
                "stopScanButton"
            );


        /*
         * Beberapa versi HTML menggunakan
         * tombol dengan ID berbeda.
         */

        if (startButton) {

            startButton.addEventListener(
                "click",
                mulaiScanner
            );

        }


        if (stopButton) {

            stopButton.addEventListener(
                "click",
                hentikanScanner
            );

        }


        /*
         * Cek HTTPS.
         */

        if (
            location.protocol !== "https:" &&
            location.hostname !== "localhost" &&
            location.hostname !== "127.0.0.1"
        ) {

            setStatus(
                "Scanner membutuhkan HTTPS.",
                "error"
            );

        }


        /*
         * Pastikan library tersedia.
         */

        if (
            typeof Html5Qrcode === "undefined"
        ) {

            console.error(
                "Html5Qrcode tidak ditemukan."
            );


            setStatus(
                "Library scanner belum dimuat.",
                "error"
            );


            return;

        }


        /*
         * Jika elemen scanner tersedia,
         * langsung coba mulai kamera.
         */

        if (
            document.getElementById(
                "reader"
            )
        ) {

            setStatus(
                "Siap membuka kamera.",
                "info"
            );

        }

    }


    /* =====================================================
       START SCANNER
       ===================================================== */

    async function mulaiScanner() {

        if (scannerBerjalan) {

            return;

        }


        if (
            typeof Html5Qrcode === "undefined"
        ) {

            setStatus(
                "Library scanner tidak tersedia.",
                "error"
            );

            return;

        }


        const reader =
            document.getElementById(
                "reader"
            );


        if (!reader) {

            setStatus(
                "Elemen #reader tidak ditemukan.",
                "error"
            );

            console.error(
                "Element #reader tidak ada."
            );

            return;

        }


        /*
         * Browser harus HTTPS untuk kamera.
         */

        if (
            location.protocol !== "https:" &&
            location.hostname !== "localhost" &&
            location.hostname !== "127.0.0.1"
        ) {

            setStatus(
                "Buka website menggunakan HTTPS agar kamera dapat digunakan.",
                "error"
            );

            return;

        }


        try {

            sedangScan = false;

            scanTerakhir = "";

            waktuScanTerakhir = 0;


            setStatus(
                "Meminta izin kamera...",
                "info"
            );


            /*
             * Buat object scanner.
             */

            scanner =
                new Html5Qrcode(
                    "reader"
                );


            /*
             * Kamera belakang.
             */

            const config = {

                fps: 15,

                qrbox: function (
                    width,
                    height
                ) {

                    const ukuran =
                        Math.floor(
                            Math.min(
                                width,
                                height
                            ) * 0.70
                        );

                    return {
                        width:
                            Math.max(
                                220,
                                Math.min(
                                    ukuran,
                                    500
                                )
                            ),

                        height:
                            Math.max(
                                220,
                                Math.min(
                                    ukuran,
                                    500
                                )
                            )
                    };

                },

                aspectRatio: 1.0,

                disableFlip: false

            };


            await scanner.start(

                {
                    facingMode: {
                        exact: "environment"
                    }
                },

                config,

                ketikaQRTerbaca,

                function (errorMessage) {

                    /*
                     * Jangan tampilkan error
                     * frame-by-frame.
                     */

                }

            );


            scannerBerjalan = true;


            setStatus(
                "Kamera aktif. Arahkan kamera ke QR siswa.",
                "success"
            );


            console.log(
                "Scanner berjalan."
            );


        }
        catch (error) {

            console.warn(
                "Kamera environment gagal:",
                error
            );


            /*
             * Fallback:
             * ambil daftar kamera.
             */

            try {

                await fallbackKamera();

            }
            catch (fallbackError) {

                console.error(
                    "Semua kamera gagal:",
                    fallbackError
                );


                setStatus(
                    pesanErrorKamera(
                        fallbackError
                    ),
                    "error"
                );


                scannerBerjalan = false;


                try {

                    if (scanner) {

                        await scanner.clear();

                    }

                }
                catch (e) {}

                scanner = null;

            }

        }

    }


    /* =====================================================
       FALLBACK CAMERA
       ===================================================== */

    async function fallbackKamera() {

        if (!scanner) {

            scanner =
                new Html5Qrcode(
                    "reader"
                );

        }


        const cameras =
            await Html5Qrcode.getCameras();


        if (
            !cameras ||
            cameras.length === 0
        ) {

            throw new Error(
                "Kamera tidak ditemukan."
            );

        }


        /*
         * Cari kamera belakang.
         */

        let cameraId =
            cameras[0].id;


        for (
            let i = 0;
            i < cameras.length;
            i++
        ) {

            const label =
                String(
                    cameras[i].label || ""
                ).toLowerCase();


            if (
                label.includes(
                    "back"
                ) ||
                label.includes(
                    "rear"
                ) ||
                label.includes(
                    "environment"
                )
            ) {

                cameraId =
                    cameras[i].id;

                break;

            }

        }


        const config = {

            fps: 15,

            qrbox: function (
                width,
                height
            ) {

                const ukuran =
                    Math.floor(
                        Math.min(
                            width,
                            height
                        ) * 0.70
                    );


                return {

                    width:
                        Math.max(
                            220,
                            Math.min(
                                ukuran,
                                500
                            )
                        ),

                    height:
                        Math.max(
                            220,
                            Math.min(
                                ukuran,
                                500
                            )
                        )

                };

            },

            aspectRatio: 1.0,

            disableFlip: false

        };


        await scanner.start(

            cameraId,

            config,

            ketikaQRTerbaca,

            function () {}

        );


        scannerBerjalan = true;


        setStatus(
            "Kamera aktif. Arahkan kamera ke QR siswa.",
            "success"
        );

    }


    /* =====================================================
       QR BERHASIL DIBACA
       ===================================================== */

    async function ketikaQRTerbaca(
        decodedText,
        decodedResult
    ) {

        if (sedangScan) {

            return;

        }


        const sekarang =
            Date.now();


        const nilai =
            String(
                decodedText || ""
            ).trim();


        if (!nilai) {

            return;

        }


        /*
         * Jangan scan QR yang sama berulang-ulang.
         */

        if (
            nilai === scanTerakhir &&
            (
                sekarang -
                waktuScanTerakhir
            ) <
            JEDA_SCAN
        ) {

            return;

        }


        scanTerakhir = nilai;

        waktuScanTerakhir = sekarang;


        console.log(
            "================================"
        );

        console.log(
            "QR TERBACA"
        );

        console.log(
            "RAW:",
            nilai
        );

        console.log(
            "================================"
        );


        sedangScan = true;


        setStatus(
            "QR terbaca: " + nilai +
            " — memproses...",
            "info"
        );


        /*
         * Ambil ID guru yang sedang login.
         */

        const idGuru =
            ambilIdGuru();


        try {

            /*
             * Kirim QR mentah ke backend.
             *
             * Backend akan mencari ID siswa.
             */

            if (
                typeof callAPI !==
                "function"
            ) {

                throw new Error(
                    "callAPI tidak ditemukan."
                );

            }


            const response =
                await callAPI({

                    action:
                        "scanPresensi",

                    qr:
                        nilai,

                    idGuru:
                        idGuru

                });


            console.log(
                "Response scanPresensi:",
                response
            );


            if (
                !response
            ) {

                throw new Error(
                    "Server tidak memberikan response."
                );

            }


            if (
                response.success
            ) {

                const siswa =
                    response.siswa ||
                    response.data ||
                    {};


                const nama =
                    siswa.nama ||
                    response.nama ||
                    "";


                const kelas =
                    siswa.kelas ||
                    response.kelas ||
                    "";


                tampilkanBerhasil(
                    nama,
                    kelas,
                    nilai,
                    response.message ||
                    "Presensi berhasil."
                );


            }
            else {

                tampilkanGagal(
                    response.message ||
                    "Presensi gagal."
                );

            }

        }
        catch (error) {

            console.error(
                "Error scan:",
                error
            );


            tampilkanGagal(
                error.message ||
                "Terjadi kesalahan saat menyimpan presensi."
            );

        }


        /*
         * Beri jeda sebelum QR berikutnya.
         */

        setTimeout(
            function () {

                sedangScan = false;

            },
            JEDA_SCAN
        );

    }


    /* =====================================================
       ID GURU
       ===================================================== */

    function ambilIdGuru() {

        /*
         * Coba beberapa kemungkinan
         * penyimpanan login.
         */

        try {

            const raw =
                localStorage.getItem(
                    "presensiUser"
                );


            if (raw) {

                const user =
                    JSON.parse(raw);


                if (user) {

                    return (
                        user.idGuru ||
                        user.ID_GURU ||
                        user.id_guru ||
                        ""
                    );

                }

            }

        }
        catch (error) {

            console.warn(
                "Gagal membaca presensiUser:",
                error
            );

        }


        return "";

    }


    /* =====================================================
       TAMPIL BERHASIL
       ===================================================== */

    function tampilkanBerhasil(
        nama,
        kelas,
        id,
        message
    ) {

        const namaAman =
            nama || "Siswa";


        const kelasAman =
            kelas
                ? "Kelas " + kelas
                : "";


        setStatus(
            message,
            "success"
        );


        /*
         * Update elemen hasil jika tersedia.
         */

        const result =
            document.getElementById(
                "scanResult"
            );


        if (result) {

            result.innerHTML = `

                <div
                    style="
                        padding:18px;
                        border-radius:12px;
                        background:#eaf8ef;
                        border:1px solid #b9e6c8;
                        text-align:center;
                    "
                >

                    <div
                        style="
                            font-size:34px;
                            color:#1b9e4b;
                            margin-bottom:8px;
                        "
                    >
                        ✓
                    </div>

                    <div
                        style="
                            font-size:18px;
                            font-weight:800;
                        "
                    >
                        ${escapeHTML(
                            namaAman
                        )}
                    </div>

                    <div
                        style="
                            margin-top:4px;
                            font-size:13px;
                            color:#555;
                        "
                    >
                        ${escapeHTML(
                            kelasAman
                        )}
                    </div>

                    <div
                        style="
                            margin-top:5px;
                            font-size:12px;
                            color:#777;
                        "
                    >
                        ID: ${escapeHTML(id)}
                    </div>

                    <div
                        style="
                            margin-top:10px;
                            font-size:13px;
                            font-weight:700;
                            color:#198754;
                        "
                    >
                        Presensi BERHASIL
                    </div>

                </div>

            `;

        }


        /*
         * Suara beep sederhana.
         */

        bunyiBerhasil();

    }


    /* =====================================================
       TAMPIL GAGAL
       ===================================================== */

    function tampilkanGagal(
        message
    ) {

        setStatus(
            message,
            "error"
        );


        const result =
            document.getElementById(
                "scanResult"
            );


        if (result) {

            result.innerHTML = `

                <div
                    style="
                        padding:15px;
                        border-radius:12px;
                        background:#fff0f0;
                        border:1px solid #f0b7b7;
                        text-align:center;
                    "
                >

                    <div
                        style="
                            font-size:28px;
                            color:#dc3545;
                            margin-bottom:7px;
                        "
                    >
                        !
                    </div>

                    <div
                        style="
                            font-weight:700;
                            color:#b02a37;
                        "
                    >
                        ${escapeHTML(message)}
                    </div>

                </div>

            `;

        }

    }


    /* =====================================================
       STOP
       ===================================================== */

    async function hentikanScanner() {

        if (!scanner) {

            return;

        }


        try {

            if (scannerBerjalan) {

                await scanner.stop();

            }

        }
        catch (error) {

            console.warn(
                "Gagal stop scanner:",
                error
            );

        }


        try {

            await scanner.clear();

        }
        catch (error) {

            console.warn(
                "Gagal clear scanner:",
                error
            );

        }


        scanner = null;

        scannerBerjalan = false;

        sedangScan = false;


        setStatus(
            "Kamera dihentikan.",
            "info"
        );

    }


    /* =====================================================
       STATUS
       ===================================================== */

    function setStatus(
        message,
        type
    ) {

        const element =
            document.getElementById(
                "scanStatus"
            );


        if (!element) {

            console.log(
                "SCAN STATUS:",
                message
            );

            return;

        }


        element.textContent =
            message;


        element.className =
            "scan-status " +
            (
                type || "info"
            );


        /*
         * Tambahkan style langsung
         * supaya tetap terlihat walaupun
         * CSS lama belum memiliki class.
         */

        if (type === "success") {

            element.style.color =
                "#198754";

        }
        else if (
            type === "error"
        ) {

            element.style.color =
                "#dc3545";

        }
        else {

            element.style.color =
                "#555";

        }

    }


    /* =====================================================
       ERROR KAMERA
       ===================================================== */

    function pesanErrorKamera(
        error
    ) {

        const text =
            String(
                error &&
                (
                    error.message ||
                    error
                )
            ).toLowerCase();


        if (
            text.includes(
                "permission"
            ) ||
            text.includes(
                "notallowed"
            )
        ) {

            return (
                "Izin kamera ditolak. " +
                "Izinkan kamera pada browser."
            );

        }


        if (
            text.includes(
                "notfound"
            ) ||
            text.includes(
                "camera"
            )
        ) {

            return (
                "Kamera tidak ditemukan. " +
                "Pastikan perangkat memiliki kamera."
            );

        }


        return (
            "Kamera tidak dapat digunakan. " +
            (
                error &&
                error.message
                    ? error.message
                    : "Periksa izin kamera."
            )
        );

    }


    /* =====================================================
       BUNYI
       ===================================================== */

    function bunyiBerhasil() {

        try {

            const AudioContext =
                window.AudioContext ||
                window.webkitAudioContext;


            if (!AudioContext) {

                return;

            }


            const audio =
                new AudioContext();


            const oscillator =
                audio.createOscillator();


            const gain =
                audio.createGain();


            oscillator.connect(
                gain
            );


            gain.connect(
                audio.destination
            );


            oscillator.frequency.value =
                880;


            gain.gain.value =
                0.08;


            oscillator.start();


            oscillator.stop(
                audio.currentTime +
                0.12
            );

        }
        catch (error) {

            console.warn(
                "Beep gagal:",
                error
            );

        }

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


    /* =====================================================
       GLOBAL
       ===================================================== */

    window.mulaiScanner =
        mulaiScanner;


    window.hentikanScanner =
        hentikanScanner;


    window.stopScanner =
        hentikanScanner;


    /* =====================================================
       START
       ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    }
    else {

        init();

    }

})();
