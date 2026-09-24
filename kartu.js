/* =========================================================
   KARTU SISWA - FINAL
   SD NEGERI JATIWARINGIN XIII

   QR CODE:
   HANYA MENYIMPAN ID SISWA

   Contoh:
   ID = 50001

   Isi QR:
   50001
   ========================================================= */

(function () {

    "use strict";

    let semuaSiswa = [];
    let siswaTampil = [];


    /* =====================================================
       INIT
       ===================================================== */

    function init() {

        console.log("================================");
        console.log("KARTU SISWA FINAL");
        console.log("================================");

        const searchInput =
            document.getElementById("searchInput");

        const kelasFilter =
            document.getElementById("kelasFilter");

        const refreshButton =
            document.getElementById("refreshButton");

        const printButton =
            document.getElementById("printButton");


        if (searchInput) {

            searchInput.addEventListener(
                "input",
                filterSiswa
            );

        }


        if (kelasFilter) {

            kelasFilter.addEventListener(
                "change",
                filterSiswa
            );

        }


        if (refreshButton) {

            refreshButton.addEventListener(
                "click",
                loadSiswa
            );

        }


        if (printButton) {

            printButton.addEventListener(
                "click",
                function () {

                    window.print();

                }
            );

        }


        loadSiswa();

    }


    /* =====================================================
       LOAD DATA SISWA
       ===================================================== */

    async function loadSiswa() {

        const container =
            document.getElementById(
                "kartuContainer"
            );

        if (!container) {

            console.error(
                "kartuContainer tidak ditemukan."
            );

            return;
        }


        container.innerHTML = `
            <div class="kartu-loading">

                <i class="fa-solid fa-spinner fa-spin"></i>

                Memuat kartu siswa...

            </div>
        `;


        try {

            console.log(
                "Mengambil data siswa..."
            );


            if (
                typeof callAPI !== "function"
            ) {

                throw new Error(
                    "callAPI tidak ditemukan. Pastikan api.js dimuat."
                );

            }


            const response =
                await callAPI({
                    action: "getSiswa"
                });


            console.log(
                "Response getSiswa:",
                response
            );


            if (!response) {

                throw new Error(
                    "Server tidak memberikan response."
                );

            }


            if (
                response.success === false
            ) {

                throw new Error(
                    response.message ||
                    "Gagal mengambil data siswa."
                );

            }


            let data = [];


            if (
                Array.isArray(response.data)
            ) {

                data = response.data;

            }
            else if (
                Array.isArray(response.siswa)
            ) {

                data = response.siswa;

            }
            else if (
                Array.isArray(response.rows)
            ) {

                data = response.rows;

            }
            else if (
                response.data &&
                Array.isArray(response.data.data)
            ) {

                data = response.data.data;

            }


            semuaSiswa =
                data
                    .map(normalisasiSiswa)
                    .filter(function (siswa) {

                        return (
                            siswa.id !== ""
                        );

                    });


            console.log(
                "Jumlah siswa:",
                semuaSiswa.length
            );


            buatFilterKelas();


            siswaTampil =
                semuaSiswa.slice();


            renderKartu();

        }
        catch (error) {

            console.error(
                "Gagal load siswa:",
                error
            );


            container.innerHTML = `

                <div class="kartu-empty">

                    <i
                        class="fa-solid fa-triangle-exclamation"
                        style="
                            font-size:28px;
                            margin-bottom:10px;
                        "
                    ></i>

                    <div
                        style="
                            font-weight:700;
                        "
                    >
                        Gagal memuat data siswa
                    </div>

                    <div
                        style="
                            margin-top:6px;
                            font-size:12px;
                        "
                    >
                        ${escapeHTML(
                            error.message ||
                            "Terjadi kesalahan."
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

            /*
             * ID INILAH YANG MASUK QR
             */

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


            tanggalLahir: ambilNilai(
                item,
                [
                    "tanggalLahir",
                    "TANGGAL_LAHIR",
                    "tglLahir",
                    "TGL_LAHIR"
                ]
            )

        };

    }


    function ambilNilai(
        object,
        keys
    ) {

        for (
            let i = 0;
            i < keys.length;
            i++
        ) {

            const key = keys[i];


            if (
                Object.prototype
                    .hasOwnProperty
                    .call(object, key) &&
                object[key] !== null &&
                object[key] !== undefined
            ) {

                return String(
                    object[key]
                ).trim();

            }

        }


        return "";

    }


    /* =====================================================
       FILTER KELAS
       ===================================================== */

    function buatFilterKelas() {

        const select =
            document.getElementById(
                "kelasFilter"
            );


        if (!select) return;


        const setKelas =
            new Set();


        semuaSiswa.forEach(
            function (siswa) {

                if (siswa.kelas) {

                    setKelas.add(
                        siswa.kelas
                    );

                }

            }
        );


        const daftarKelas =
            Array.from(setKelas);


        daftarKelas.sort(
            function (a, b) {

                return a.localeCompare(
                    b,
                    "id",
                    {
                        numeric: true,
                        sensitivity: "base"
                    }
                );

            }
        );


        select.innerHTML =
            `<option value="">Semua Kelas</option>`;


        daftarKelas.forEach(
            function (kelas) {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value = kelas;

                option.textContent =
                    kelas;

                select.appendChild(
                    option
                );

            }
        );

    }


    /* =====================================================
       FILTER
       ===================================================== */

    function filterSiswa() {

        const searchInput =
            document.getElementById(
                "searchInput"
            );

        const kelasFilter =
            document.getElementById(
                "kelasFilter"
            );


        const keyword =
            (
                searchInput
                    ? searchInput.value
                    : ""
            )
                .trim()
                .toLowerCase();


        const kelas =
            (
                kelasFilter
                    ? kelasFilter.value
                    : ""
            )
                .trim();


        siswaTampil =
            semuaSiswa.filter(
                function (siswa) {

                    const cocokKeyword =
                        !keyword ||
                        siswa.nama
                            .toLowerCase()
                            .includes(keyword) ||
                        siswa.nisn
                            .toLowerCase()
                            .includes(keyword) ||
                        siswa.id
                            .toLowerCase()
                            .includes(keyword);


                    const cocokKelas =
                        !kelas ||
                        siswa.kelas === kelas;


                    return (
                        cocokKeyword &&
                        cocokKelas
                    );

                }
            );


        renderKartu();

    }


    /* =====================================================
       RENDER
       ===================================================== */

    function renderKartu() {

        const container =
            document.getElementById(
                "kartuContainer"
            );


        if (!container) return;


        if (!siswaTampil.length) {

            container.innerHTML = `

                <div class="kartu-empty">

                    <i
                        class="fa-solid fa-id-card"
                        style="
                            font-size:28px;
                            margin-bottom:10px;
                        "
                    ></i>

                    <div
                        style="font-weight:700;"
                    >
                        Data siswa tidak ditemukan
                    </div>

                </div>
            `;

            return;

        }


        container.innerHTML = "";


        siswaTampil.forEach(
            function (siswa, index) {

                const card =
                    buatKartu(
                        siswa,
                        index
                    );

                container.appendChild(
                    card
                );

            }
        );

    }


    /* =====================================================
       BUAT KARTU
       ===================================================== */

    function buatKartu(
        siswa,
        index
    ) {

        const card =
            document.createElement(
                "div"
            );


        card.className =
            "student-card";


        const safeId =
            String(siswa.id)
                .replace(
                    /[^a-zA-Z0-9_-]/g,
                    ""
                );


        const qrId =
            "qr-" +
            index +
            "-" +
            safeId;


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


            <!-- =============================
                 QR CODE
                 HANYA ID SISWA
                 ============================= -->

            <div class="qr-box">

                <div
                    id="${escapeAttr(qrId)}"
                    class="qr-code"
                ></div>

            </div>


            <!-- =============================
                 DATA SISWA
                 ============================= -->

            <div class="student-data">

                <div class="data-row">

                    <div class="data-label">
                        NISN
                    </div>

                    <div class="data-colon">
                        :
                    </div>

                    <div class="data-value">
                        ${escapeHTML(
                            siswa.nisn || "-"
                        )}
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
                        ${escapeHTML(
                            siswa.nama || "-"
                        )}
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
                        ${escapeHTML(
                            siswa.kelas || "-"
                        )}
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
         * Buat QR setelah card masuk DOM.
         */

        setTimeout(
            function () {

                buatQRCode(
                    siswa.id,
                    qrId
                );

            },
            0
        );


        return card;

    }


    /* =====================================================
       QR CODE FINAL
       ===================================================== */

    function buatQRCode(
        idSiswa,
        containerId
    ) {

        const container =
            document.getElementById(
                containerId
            );


        if (!container) {

            console.error(
                "Container QR tidak ditemukan:",
                containerId
            );

            return;

        }


        container.innerHTML = "";


        /*
         * ID SISWA SAJA
         */

        const id =
            String(
                idSiswa ?? ""
            ).trim();


        if (!id) {

            container.innerHTML = `
                <span
                    style="
                        font-size:8px;
                        color:#d00;
                    "
                >
                    ID KOSONG
                </span>
            `;

            return;

        }


        if (
            typeof QRCode === "undefined"
        ) {

            container.innerHTML = `
                <span
                    style="
                        font-size:8px;
                        color:#d00;
                    "
                >
                    QR ERROR
                </span>
            `;

            console.error(
                "QRCode library tidak ditemukan."
            );

            return;

        }


        console.log(
            "QR SISWA:",
            id
        );


        /*
         * QR:
         *
         * 50001
         *
         * HANYA ID.
         */

        new QRCode(
            container,
            {
                text: id,

                width: 300,

                height: 300,

                /*
                 * Level M cukup untuk ID siswa
                 * dan tetap punya toleransi kerusakan.
                 */

                correctLevel:
                    QRCode.CorrectLevel.M
            }
        );


        setTimeout(
            function () {

                const canvas =
                    container.querySelector(
                        "canvas"
                    );

                const img =
                    container.querySelector(
                        "img"
                    );


                if (canvas) {

                    canvas.style.display =
                        "block";

                    canvas.style.width =
                        "26mm";

                    canvas.style.height =
                        "26mm";

                    canvas.style.margin =
                        "0";

                    canvas.style.padding =
                        "0";

                }


                if (img) {

                    img.style.display =
                        "block";

                    img.style.width =
                        "26mm";

                    img.style.height =
                        "26mm";

                    img.style.margin =
                        "0";

                    img.style.padding =
                        "0";

                }

            },
            100
        );

    }


    /* =====================================================
       FORMAT TANGGAL
       ===================================================== */

    function formatTanggal(value) {

        if (!value) return "";


        const text =
            String(value).trim();


        if (!text) return "";


        if (
            /^\d{2}[-/]\d{2}[-/]\d{4}$/
                .test(text)
        ) {

            return text.replace(
                /-/g,
                "/"
            );

        }


        const match =
            text.match(
                /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/
            );


        if (match) {

            return (
                match[3].padStart(2, "0") +
                "/" +
                match[2].padStart(2, "0") +
                "/" +
                match[1]
            );

        }


        const date =
            new Date(text);


        if (
            !isNaN(
                date.getTime()
            )
        ) {

            return (
                String(
                    date.getDate()
                ).padStart(2, "0") +
                "/" +
                String(
                    date.getMonth() + 1
                ).padStart(2, "0") +
                "/" +
                date.getFullYear()
            );

        }


        return text;

    }


    /* =====================================================
       ESCAPE
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

        return escapeHTML(value);

    }


    /* =====================================================
       GLOBAL
       ===================================================== */

    window.buatQRCode =
        buatQRCode;

    window.loadKartuSiswa =
        loadSiswa;


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
