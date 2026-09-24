/* =========================================================
   SCAN QR PRESENSI - FINAL
   SD NEGERI JATIWARINGIN XIII

   COCOK DENGAN scan.html USER

   ID HTML:
   #reader
   #scanStatus
   #startCamera
   #stopCamera
   #result
   #guruNama
   #guruRole

   QR KARTU:
   HANYA BERISI ID SISWA

   Contoh:
   50001

   Alur:
   QR 50001
      ↓
   scanPresensi
      ↓
   Apps Script
      ↓
   cari ID 50001
      ↓
   simpan HADIR
      ↓
   PRESENSI
   ========================================================= */

(function () {

    "use strict";

    let scanner = null;

    let scannerAktif = false;

    let sedangMemproses = false;

    let qrTerakhir = "";

    let waktuQRTerakhir = 0;

    const JEDA_SCAN = 3000;


    /* =====================================================
       INIT
       ===================================================== */

    function init() {

        const user =
            typeof Auth !== "undefined" && Auth.requireRole
                ? Auth.requireRole(["ADMIN", "GURU"])
                : null;

        if (!user && typeof Auth !== "undefined") {
            return;
        }

        console.log("================================");
        console.log("SCAN PRESENSI FINAL");
        console.log("================================");

        const startButton =
            document.getElementById("startCamera");

        const stopButton =
            document.getElementById("stopCamera");


        /*
         * Tampilkan data guru
         */

        tampilkanUser();


        /*
         * Tombol buka kamera
         */

        if (startButton) {

            startButton.addEventListener(
                "click",
                mulaiKamera
            );

        }


        /*
         * Tombol stop
         */

        if (stopButton) {

            stopButton.addEventListener(
                "click",
                hentikanKamera
            );

        }


        /*
         * Pastikan library tersedia
         */

        if (
            typeof Html5Qrcode === "undefined"
        ) {

            setStatus(
                "Library QR scanner belum tersedia.",
                "error"
            );

            console.error(
                "Html5Qrcode tidak ditemukan."
            );

            return;

        }


        /*
         * Cek HTTPS
         */

        if (
            location.protocol !== "https:" &&
            location.hostname !== "localhost" &&
            location.hostname !== "127.0.0.1"
        ) {

            setStatus(
                "Website harus menggunakan HTTPS agar kamera dapat digunakan.",
                "error"
            );

            return;

        }


        setStatus(
            "Siap. Klik Buka Kamera.",
            "info"
        );

    }


    /* =====================================================
       USER LOGIN
       ===================================================== */

    function tampilkanUser() {

        const namaElement =
            document.getElementById("guruNama");

        const roleElement =
            document.getElementById("guruRole");


        try {

            const raw =
                localStorage.getItem(
                    "presensiUser"
                );


            if (!raw) {

                if (namaElement) {
                    namaElement.textContent =
                        "Pengguna";
                }

                if (roleElement) {
                    roleElement.textContent =
                        "-";
                }

                return;

            }


            const user =
                JSON.parse(raw);


            if (namaElement) {

                namaElement.textContent =
                    user.nama ||
                    user.username ||
                    "Pengguna";

            }


            if (roleElement) {

                roleElement.textContent =
                    user.role ||
                    "GURU";

            }

        }
        catch (error) {

            console.warn(
                "Gagal membaca user:",
                error
            );

        }

    }


    /* =====================================================
       AMBIL ID GURU
       ===================================================== */

    function ambilIdGuru() {

        try {

            const raw =
                localStorage.getItem(
                    "presensiUser"
                );


            if (!raw) {
                return "";
            }


            const user =
                JSON.parse(raw);


            if (!user) {
                return "";
            }


            return String(
                user.idGuru ||
                user.ID_GURU ||
                user.id_guru ||
                ""
            ).trim();

        }
        catch (error) {

            console.warn(
                "Tidak dapat membaca ID guru:",
                error
            );

            return "";

        }

    }


    /* =====================================================
       MULAI KAMERA
       ===================================================== */

    async function mulaiKamera() {

        if (scannerAktif) {

            setStatus(
                "Kamera sudah aktif.",
                "info"
            );

            return;

        }


        if (
            typeof Html5Qrcode === "undefined"
        ) {

            setStatus(
                "Library scanner tidak ditemukan.",
                "error"
            );

            return;

        }


        const reader =
            document.getElementById("reader");


        if (!reader) {

            setStatus(
                "Area scanner #reader tidak ditemukan.",
                "error"
            );

            return;

        }


        /*
         * Bersihkan scanner lama
         */

        reader.innerHTML = "";


        setStatus(
            "Meminta izin kamera...",
            "info"
        );


        try {

            scanner =
                new Html5Qrcode(
                    "reader"
                );


            /*
             * Konfigurasi scanner
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
                                180,
                                Math.min(
                                    ukuran,
                                    360
                                )
                            ),

                        height:
                            Math.max(
                                180,
                                Math.min(
                                    ukuran,
                                    360
                                )
                            )

                    };

                },

                aspectRatio: 1.0,

                disableFlip: false

            };


            /*
             * Prioritas kamera belakang
             */

            try {

                await scanner.start(

                    {
                        facingMode: {
                            exact: "environment"
                        }
                    },

                    config,

                    ketikaQRBerhasil,

                    ketikaFrameGagal

                );

            }
            catch (errorEnvironment) {

                console.warn(
                    "Kamera belakang gagal:",
                    errorEnvironment
                );


                /*
                 * Fallback kamera
                 */

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


                let cameraId =
                    cameras[0].id;


                /*
                 * Cari kamera belakang
                 */

                for (
                    let i = 0;
                    i < cameras.length;
                    i++
                ) {

                    const label =
                        String(
                            cameras[i].label ||
                            ""
                        ).toLowerCase();


                    if (
                        label.includes("back") ||
                        label.includes("rear") ||
                        label.includes("environment")
                    ) {

                        cameraId =
                            cameras[i].id;

                        break;

                    }

                }


                await scanner.start(

                    cameraId,

                    config,

                    ketikaQRBerhasil,

                    ketikaFrameGagal

                );

            }


            scannerAktif = true;


            setStatus(
                "Kamera aktif. Arahkan ke QR kartu siswa.",
                "success"
            );


            console.log(
                "Kamera berhasil aktif."
            );

        }
        catch (error) {

            console.error(
                "Gagal membuka kamera:",
                error
            );


            scannerAktif = false;


            if (scanner) {

                try {

                    await scanner.clear();

                }
                catch (e) {}

            }


            scanner = null;


            setStatus(
                pesanErrorKamera(error),
                "error"
            );

        }

    }


    /* =====================================================
       QR BERHASIL DIBACA
       ===================================================== */

    async function ketikaQRBerhasil(
        decodedText,
        decodedResult
    ) {

        /*
         * Jangan proses dua kali bersamaan.
         */

        if (sedangMemproses) {
            return;
        }


        const nilai =
            String(
                decodedText || ""
            ).trim();


        if (!nilai) {
            return;
        }


        const sekarang =
            Date.now();


        /*
         * Cegah QR yang sama
         * masuk berkali-kali.
         */

        if (
            nilai === qrTerakhir &&
            (
                sekarang -
                waktuQRTerakhir
            ) < JEDA_SCAN
        ) {

            return;

        }


        qrTerakhir =
            nilai;

        waktuQRTerakhir =
            sekarang;


        console.log("================================");
        console.log("QR BERHASIL DIBACA");
        console.log("ISI QR:", nilai);
        console.log("================================");


        /*
         * QR kartu seharusnya hanya ID.
         *
         * Contoh:
         * 50001
         */


        sedangMemproses = true;


        setStatus(
            "QR terbaca: " +
            nilai +
            " — menyimpan presensi...",
            "info"
        );


        /*
         * Tampilkan proses di panel kanan.
         */

        tampilkanProses(
            nilai
        );


        try {

            if (
                typeof callAPI !== "function"
            ) {

                throw new Error(
                    "callAPI tidak ditemukan. Pastikan api.js dimuat."
                );

            }


            /*
             * ID GURU
             */

            const idGuru =
                ambilIdGuru();


            console.log(
                "ID GURU:",
                idGuru
            );


            /*
             * Kirim ke Apps Script
             */

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
                "HASIL API:",
                response
            );


            if (!response) {

                throw new Error(
                    "Server tidak memberikan response."
                );

            }


            /*
             * BERHASIL
             */

            if (
                response.success === true
            ) {

                const siswa =
                    response.siswa ||
                    response.data ||
                    {};


                const nama =
                    siswa.nama ||
                    siswa.NAMA ||
                    response.nama ||
                    "";


                const kelas =
                    siswa.kelas ||
                    siswa.KELAS ||
                    response.kelas ||
                    "";


                const nisn =
                    siswa.nisn ||
                    siswa.NISN ||
                    response.nisn ||
                    "";


                const id =
                    siswa.id ||
                    siswa.ID ||
                    response.id ||
                    nilai;


                tampilkanBerhasil({

                    id:
                        id,

                    nama:
                        nama,

                    nisn:
                        nisn,

                    kelas:
                        kelas,

                    message:
                        response.message ||
                        "Presensi berhasil disimpan."

                });


            }
            else {

                tampilkanGagal(

                    response.message ||
                    "Presensi gagal disimpan."

                );

            }

        }
        catch (error) {

            console.error(
                "ERROR PRESENSI:",
                error
            );


            tampilkanGagal(

                error.message ||
                "Terjadi kesalahan saat menyimpan presensi."

            );

        }


        /*
         * Setelah 3 detik,
         * scanner boleh membaca QR lagi.
         */

        setTimeout(
            function () {

                sedangMemproses =
                    false;

            },
            JEDA_SCAN
        );

    }


    /* =====================================================
       FRAME GAGAL
       ===================================================== */

    function ketikaFrameGagal(
        errorMessage
    ) {

        /*
         * Jangan menampilkan error setiap frame.
         *
         * html5-qrcode memang akan terus
         * memanggil callback ini ketika
         * belum menemukan QR.
         */

    }


    /* =====================================================
       HASIL PROSES
       ===================================================== */

    function tampilkanProses(id) {

        const result =
            document.getElementById(
                "result"
            );


        if (!result) {
            return;
        }


        result.innerHTML = `

            <div
                class="result-success"
                style="
                    border-color:#d8e6f5;
                "
            >

                <div
                    class="result-success-head"
                    style="
                        background:#eef6ff;
                    "
                >

                    <small
                        style="
                            color:#2363a1;
                        "
                    >
                        MEMPROSES
                    </small>

                    <h3>
                        QR Terbaca
                    </h3>

                </div>


                <div class="result-data">

                    <div class="result-row">

                        <div class="result-label">
                            ID
                        </div>

                        <div>
                            :
                        </div>

                        <div>
                            ${escapeHTML(id)}
                        </div>

                    </div>


                    <div
                        style="
                            padding-top:15px;
                            text-align:center;
                            color:#777;
                        "
                    >
                        Menyimpan presensi...
                    </div>

                </div>

            </div>
        `;

    }


    /* =====================================================
       BERHASIL
       ===================================================== */

    function tampilkanBerhasil(data) {

        const result =
            document.getElementById(
                "result"
            );


        setStatus(
            data.message ||
            "Presensi berhasil disimpan.",
            "success"
        );


        if (!result) {
            return;
        }


        result.innerHTML = `

            <div class="result-success">

                <div class="result-success-head">

                    <small>
                        PRESENSI BERHASIL
                    </small>

                    <h3>
                        ${escapeHTML(
                            data.nama ||
                            "Siswa"
                        )}
                    </h3>

                </div>


                <div class="result-data">

                    <div class="result-row">

                        <div class="result-label">
                            ID
                        </div>

                        <div>
                            :
                        </div>

                        <div>
                            ${escapeHTML(
                                data.id ||
                                "-"
                            )}
                        </div>

                    </div>


                    <div class="result-row">

                        <div class="result-label">
                            NISN
                        </div>

                        <div>
                            :
                        </div>

                        <div>
                            ${escapeHTML(
                                data.nisn ||
                                "-"
                            )}
                        </div>

                    </div>


                    <div class="result-row">

                        <div class="result-label">
                            Nama
                        </div>

                        <div>
                            :
                        </div>

                        <div>
                            ${escapeHTML(
                                data.nama ||
                                "-"
                            )}
                        </div>

                    </div>


                    <div class="result-row">

                        <div class="result-label">
                            Kelas
                        </div>

                        <div>
                            :
                        </div>

                        <div>
                            ${escapeHTML(
                                data.kelas ||
                                "-"
                            )}
                        </div>

                    </div>


                    <div class="result-row">

                        <div class="result-label">
                            Status
                        </div>

                        <div>
                            :
                        </div>

                        <div
                            style="
                                color:#198754;
                                font-weight:800;
                            "
                        >
                            HADIR
                        </div>

                    </div>

                </div>

            </div>

        `;


        bunyiBerhasil();

    }


    /* =====================================================
       GAGAL
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
                "result"
            );


        if (!result) {
            return;
        }


        result.innerHTML = `

            <div
                class="result-success"
                style="
                    border-color:#f0c5c5;
                "
            >

                <div
                    class="result-success-head"
                    style="
                        background:#fff0f0;
                    "
                >

                    <small
                        style="
                            color:#b42318;
                        "
                    >
                        GAGAL
                    </small>

                    <h3>
                        Presensi tidak tersimpan
                    </h3>

                </div>


                <div class="result-data">

                    <div
                        style="
                            padding:10px 0;
                            color:#b42318;
                            font-size:13px;
                        "
                    >
                        ${escapeHTML(message)}
                    </div>

                </div>

            </div>
        `;

    }


    /* =====================================================
       STOP KAMERA
       ===================================================== */

    async function hentikanKamera() {

        if (!scanner) {

            scannerAktif =
                false;

            setStatus(
                "Kamera belum aktif.",
                "info"
            );

            return;

        }


        try {

            if (scannerAktif) {

                await scanner.stop();

            }

        }
        catch (error) {

            console.warn(
                "Stop scanner:",
                error
            );

        }


        try {

            await scanner.clear();

        }
        catch (error) {

            console.warn(
                "Clear scanner:",
                error
            );

        }


        scanner = null;

        scannerAktif =
            false;

        sedangMemproses =
            false;


        setStatus(
            "Kamera dihentikan.",
            "info"
        );


        const reader =
            document.getElementById(
                "reader"
            );


        if (reader) {

            reader.innerHTML = "";

        }

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
                "STATUS:",
                message
            );

            return;

        }


        element.textContent =
            message;


        element.className =
            "scan-status";


        if (type === "success") {

            element.classList.add(
                "success"
            );

        }
        else if (
            type === "error"
        ) {

            element.classList.add(
                "error"
            );

        }
        else if (
            type === "warning"
        ) {

            element.classList.add(
                "warning"
            );

        }

    }


    /* =====================================================
       ERROR KAMERA
       ===================================================== */

    function pesanErrorKamera(
        error
    ) {

        const message =
            String(
                error &&
                (
                    error.message ||
                    error
                )
            );


        const lower =
            message.toLowerCase();


        if (
            lower.includes(
                "permission"
            ) ||
            lower.includes(
                "notallowed"
            )
        ) {

            return (
                "Izin kamera ditolak. " +
                "Klik ikon kamera di address bar " +
                "dan izinkan kamera."
            );

        }


        if (
            lower.includes(
                "notfound"
            )
        ) {

            return (
                "Kamera tidak ditemukan."
            );

        }


        if (
            lower.includes(
                "secure"
            ) ||
            lower.includes(
                "https"
            )
        ) {

            return (
                "Kamera membutuhkan HTTPS."
            );

        }


        return (
            "Kamera tidak dapat dibuka. " +
            message
        );

    }


    /* =====================================================
       BEEP
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

    window.mulaiKamera =
        mulaiKamera;


    window.hentikanKamera =
        hentikanKamera;


    window.stopScanner =
        hentikanKamera;


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
