/* =========================================================
   KARTU SISWA
   SD NEGERI JATIWARINGIN XIII
   ========================================================= */

(function () {
    "use strict";

    let semuaSiswa = [];
    let siswaTampil = [];

    /* =====================================================
       INIT
       ===================================================== */

    function init() {

        console.log("KARTU SISWA: init");

        const searchInput = document.getElementById("searchInput");
        const kelasFilter = document.getElementById("kelasFilter");
        const refreshButton = document.getElementById("refreshButton");
        const printButton = document.getElementById("printButton");

        if (searchInput) {
            searchInput.addEventListener("input", filterSiswa);
        }

        if (kelasFilter) {
            kelasFilter.addEventListener("change", filterSiswa);
        }

        if (refreshButton) {
            refreshButton.addEventListener("click", loadSiswa);
        }

        if (printButton) {
            printButton.addEventListener("click", function () {
                window.print();
            });
        }

        loadSiswa();
    }


    /* =====================================================
       LOAD SISWA
       ===================================================== */

    async function loadSiswa() {

        const container = document.getElementById("kartuContainer");

        if (!container) {
            console.error("Element #kartuContainer tidak ditemukan.");
            return;
        }

        container.innerHTML = `
            <div class="kartu-loading">
                <i class="fa-solid fa-spinner fa-spin"></i>
                Memuat kartu siswa...
            </div>
        `;

        try {

            console.log("KARTU SISWA: mengambil data siswa...");

            const response = await callAPI({
                action: "getSiswa"
            });

            console.log("KARTU SISWA: response API", response);

            if (!response) {
                throw new Error("Tidak ada response dari server.");
            }

            if (response.success === false) {
                throw new Error(
                    response.message || "Gagal mengambil data siswa."
                );
            }

            /*
             * Menyesuaikan beberapa kemungkinan bentuk response:
             *
             * { success:true, data:[...] }
             * { success:true, siswa:[...] }
             * { success:true, rows:[...] }
             * { success:true, data:{data:[...]} }
             */

            let data = [];

            if (Array.isArray(response.data)) {
                data = response.data;
            } else if (Array.isArray(response.siswa)) {
                data = response.siswa;
            } else if (Array.isArray(response.rows)) {
                data = response.rows;
            } else if (
                response.data &&
                Array.isArray(response.data.data)
            ) {
                data = response.data.data;
            }

            if (!Array.isArray(data)) {
                data = [];
            }

            /*
             * Normalisasi data siswa
             */

            semuaSiswa = data
                .map(normalisasiSiswa)
                .filter(function (siswa) {

                    /*
                     * ID wajib ada karena QR menggunakan ID.
                     */

                    return siswa.id !== "";
                });

            console.log(
                "KARTU SISWA: jumlah siswa =",
                semuaSiswa.length
            );

            buatFilterKelas();

            siswaTampil = semuaSiswa.slice();

            renderKartu();

        } catch (error) {

            console.error(
                "KARTU SISWA: gagal mengambil data",
                error
            );

            container.innerHTML = `
                <div class="kartu-empty">

                    <i
                        class="fa-solid fa-triangle-exclamation"
                        style="font-size:28px;margin-bottom:10px;"
                    ></i>

                    <div style="font-weight:700;">
                        Gagal memuat data siswa
                    </div>

                    <div style="margin-top:6px;font-size:12px;">
                        ${escapeHTML(
                            error.message || "Terjadi kesalahan."
                        )}
                    </div>

                    <button
                        type="button"
                        onclick="window.location.reload()"
                        style="
                            margin-top:14px;
                            padding:9px 15px;
                            border:0;
                            border-radius:6px;
                            background:#3b94bd;
                            color:#fff;
                            cursor:pointer;
                            font-weight:700;
                        "
                    >
                        Coba Lagi
                    </button>

                </div>
            `;
        }
    }


    /* =====================================================
       NORMALISASI SISWA
       ===================================================== */

    function normalisasiSiswa(item) {

        item = item || {};

        return {

            id: ambilNilai(
                item,
                [
                    "id",
                    "ID",
                    "idSiswa",
                    "ID_SISWA"
                ]
            ),

            nisn: ambilNilai(
                item,
                [
                    "nisn",
                    "NISN"
                ]
            ),

            nama: ambilNilai(
                item,
                [
                    "nama",
                    "NAMA",
                    "namaSiswa",
                    "NAMA_SISWA"
                ]
            ),

            kelas: ambilNilai(
                item,
                [
                    "kelas",
                    "KELAS"
                ]
            ),

            jk: ambilNilai(
                item,
                [
                    "jk",
                    "JK",
                    "jenisKelamin",
                    "JENIS_KELAMIN"
                ]
            ),

            tanggalLahir: ambilNilai(
                item,
                [
                    "tanggalLahir",
                    "TANGGAL_LAHIR",
                    "tglLahir",
                    "TGL_LAHIR"
                ]
            ),

            status: ambilNilai(
                item,
                [
                    "status",
                    "STATUS"
                ]
            )
        };
    }


    function ambilNilai(obj, keys) {

        for (let i = 0; i < keys.length; i++) {

            const key = keys[i];

            if (
                Object.prototype.hasOwnProperty.call(obj, key) &&
                obj[key] !== null &&
                obj[key] !== undefined
            ) {

                return String(obj[key]).trim();
            }
        }

        return "";
    }


    /* =====================================================
       FILTER KELAS
       ===================================================== */

    function buatFilterKelas() {

        const select = document.getElementById("kelasFilter");

        if (!select) return;

        const kelasSet = new Set();

        semuaSiswa.forEach(function (siswa) {

            if (siswa.kelas) {
                kelasSet.add(siswa.kelas);
            }
        });

        const daftarKelas = Array.from(kelasSet);

        daftarKelas.sort(function (a, b) {

            return a.localeCompare(
                b,
                "id",
                {
                    numeric: true,
                    sensitivity: "base"
                }
            );
        });

        select.innerHTML = `
            <option value="">Semua Kelas</option>
        `;

        daftarKelas.forEach(function (kelas) {

            const option = document.createElement("option");

            option.value = kelas;
            option.textContent = kelas;

            select.appendChild(option);
        });
    }


    /* =====================================================
       FILTER SISWA
       ===================================================== */

    function filterSiswa() {

        const searchInput =
            document.getElementById("searchInput");

        const kelasFilter =
            document.getElementById("kelasFilter");

        const keyword = (
            searchInput
                ? searchInput.value
                : ""
        )
            .trim()
            .toLowerCase();

        const kelas = (
            kelasFilter
                ? kelasFilter.value
                : ""
        ).trim();

        siswaTampil = semuaSiswa.filter(function (siswa) {

            const cocokKataKunci =
                !keyword ||
                siswa.nama.toLowerCase().includes(keyword) ||
                siswa.nisn.toLowerCase().includes(keyword) ||
                siswa.id.toLowerCase().includes(keyword);

            const cocokKelas =
                !kelas ||
                siswa.kelas === kelas;

            return cocokKataKunci && cocokKelas;
        });

        renderKartu();
    }


    /* =====================================================
       RENDER KARTU
       ===================================================== */

    function renderKartu() {

        const container =
            document.getElementById("kartuContainer");

        if (!container) return;

        if (!siswaTampil.length) {

            container.innerHTML = `
                <div class="kartu-empty">

                    <i
                        class="fa-solid fa-id-card"
                        style="font-size:28px;margin-bottom:10px;"
                    ></i>

                    <div style="font-weight:700;">
                        Data siswa tidak ditemukan
                    </div>

                    <div style="margin-top:5px;font-size:12px;">
                        Silakan ubah pencarian atau filter kelas.
                    </div>

                </div>
            `;

            return;
        }

        container.innerHTML = "";

        siswaTampil.forEach(function (siswa, index) {

            const card =
                buatKartu(siswa, index);

            container.appendChild(card);
        });
    }


    /* =====================================================
       BUAT KARTU
       ===================================================== */

    function buatKartu(siswa, index) {

        const card =
            document.createElement("div");

        card.className = "student-card";

        /*
         * ID kartu dibuat unik.
         */

        const qrId =
            "qr-" +
            index +
            "-" +
            String(siswa.id)
                .replace(/[^a-zA-Z0-9_-]/g, "");

        card.innerHTML = `

            <div class="card-red"></div>

            <div class="card-gray"></div>

            <div class="card-yellow"></div>

            <div class="card-circles">
                <span></span>
                <span></span>
                <span></span>
            </div>

            <div class="card-dots"></div>

            <div class="school-name">
                SD NEGERI<br>
                JATIWARINGIN XIII
            </div>

            <div class="card-heading">
                KARTU SISWA
            </div>

            <div class="qr-box">

                <div
                    id="${escapeAttr(qrId)}"
                    class="qr-code"
                ></div>

            </div>

            <div class="student-data">

                <div class="data-row">
                    <div class="data-label">
                        NISN
                    </div>

                    <div class="data-colon">
                        :
                    </div>

                    <div class="data-value">
                        ${escapeHTML(siswa.nisn || "-")}
                    </div>
                </div>


                <div class="data-row">
                    <div class="data-label">
                        Nama
                    </div>

                    <div class="data-colon">
                        :
                    </div>

                    <div class="data-value">
                        ${escapeHTML(siswa.nama || "-")}
                    </div>
                </div>


                <div class="data-row">
                    <div class="data-label">
                        Kelas
                    </div>

                    <div class="data-colon">
                        :
                    </div>

                    <div class="data-value">
                        ${escapeHTML(siswa.kelas || "-")}
                    </div>
                </div>


                <div class="data-row">
                    <div class="data-label">
                        Tgl. Lahir
                    </div>

                    <div class="data-colon">
                        :
                    </div>

                    <div class="data-value">
                        ${escapeHTML(
                            formatTanggal(
                                siswa.tanggalLahir
                            ) || "-"
                        )}
                    </div>
                </div>

            </div>


            <div class="card-footer-red"></div>

            <div class="card-footer-yellow"></div>

            <div class="card-chevron">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;

        /*
         * QR dibuat setelah elemen masuk DOM.
         */

        setTimeout(function () {

            buatQRCode(
                siswa.id,
                qrId
            );

        }, 0);

        return card;
    }


    /* =====================================================
       QR CODE
       ===================================================== */

    function buatQRCode(idSiswa, containerId) {

        const container =
            document.getElementById(containerId);

        if (!container) {

            console.error(
                "QR container tidak ditemukan:",
                containerId
            );

            return;
        }

        /*
         * Bersihkan QR lama.
         * Ini mencegah QR menjadi dobel.
         */

        container.innerHTML = "";

        const id =
            String(idSiswa ?? "").trim();

        if (!id) {

            container.innerHTML = `
                <span
                    style="
                        font-size:9px;
                        color:#c00;
                        text-align:center;
                    "
                >
                    ID kosong
                </span>
            `;

            return;
        }

        /*
         * Pastikan library QR tersedia.
         */

        if (
            typeof QRCode === "undefined"
        ) {

            console.error(
                "Library QRCode tidak tersedia."
            );

            container.innerHTML = `
                <span
                    style="
                        font-size:8px;
                        color:#c00;
                        text-align:center;
                    "
                >
                    QR ERROR
                </span>
            `;

            return;
        }

        console.log(
            "Membuat QR siswa:",
            id
        );

        /*
         * PENTING:
         *
         * QR HANYA berisi ID siswa.
         *
         * Contoh:
         * 50001
         *
         * Bukan:
         * JSON
         * NISN
         * nama
         * kelas
         */

        new QRCode(
            container,
            {
                text: id,

                width: 240,
                height: 240,

                /*
                 * L = lebih sederhana / lebih mudah
                 * dibaca scanner karena data sangat sedikit.
                 */
                correctLevel:
                    QRCode.CorrectLevel.L
            }
        );

        /*
         * Pastikan hasil QR tidak terlalu kecil.
         */

        setTimeout(function () {

            const canvas =
                container.querySelector("canvas");

            const image =
                container.querySelector("img");

            if (canvas) {

                canvas.style.width = "24mm";
                canvas.style.height = "24mm";

                canvas.style.display = "block";

                canvas.style.margin = "0";
                canvas.style.padding = "0";
            }

            if (image) {

                image.style.width = "24mm";
                image.style.height = "24mm";

                image.style.display = "block";

                image.style.margin = "0";
                image.style.padding = "0";
            }

        }, 50);
    }


    /* =====================================================
       FORMAT TANGGAL
       ===================================================== */

    function formatTanggal(value) {

        if (!value) return "";

        const text =
            String(value).trim();

        if (!text) return "";

        /*
         * Jika sudah dalam format Indonesia.
         */

        if (
            /^\d{2}[-/]\d{2}[-/]\d{4}$/.test(text)
        ) {
            return text.replace(/-/g, "/");
        }

        /*
         * YYYY-MM-DD
         */

        const match =
            text.match(
                /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/
            );

        if (match) {

            const tahun = match[1];
            const bulan =
                String(match[2]).padStart(2, "0");
            const tanggal =
                String(match[3]).padStart(2, "0");

            return (
                tanggal +
                "/" +
                bulan +
                "/" +
                tahun
            );
        }

        /*
         * Jika Apps Script mengirim
         * timestamp / Date string.
         */

        const date =
            new Date(text);

        if (!isNaN(date.getTime())) {

            const tanggal =
                String(
                    date.getDate()
                ).padStart(2, "0");

            const bulan =
                String(
                    date.getMonth() + 1
                ).padStart(2, "0");

            const tahun =
                date.getFullYear();

            return (
                tanggal +
                "/" +
                bulan +
                "/" +
                tahun
            );
        }

        return text;
    }


    /* =====================================================
       ESCAPE HTML
       ===================================================== */

    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function escapeAttr(value) {

        return escapeHTML(value);
    }


    /* =====================================================
       EXPORT GLOBAL
       ===================================================== */

    window.buatQRCode = buatQRCode;
    window.loadKartuSiswa = loadSiswa;


    /* =====================================================
       START
       ===================================================== */

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    } else {

        /*
         * Kalau kartu.js dimuat setelah
         * DOMContentLoaded, init tetap dijalankan.
         */

        init();
    }

})();
