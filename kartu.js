/* ============================================================
   KARTU.JS
   KARTU SISWA - SD NEGERI JATIWARINGIN XIII

   QR CODE:
   - Isi QR hanya ID SISWA
   - Contoh: 50001
   - Tidak memasukkan nama
   - Tidak memasukkan NISN
   - Tidak memasukkan kelas
   ============================================================ */

"use strict";


// ============================================================
// DATA GLOBAL
// ============================================================

let semuaSiswa = [];

let siswaTampil = [];


// ============================================================
// KONFIGURASI
// ============================================================

const KARTU_CONFIG = {

    namaSekolah:
        "SD NEGERI JATIWARINGIN XIII",

    judulKartu:
        "KARTU SISWA",

    qrWidth:
        220,

    qrHeight:
        220,

    qrLevel:
        "H"

};


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ============================================================
// NORMALISASI DATA SISWA
// ============================================================

function normalisasiSiswa(item) {

    if (!item || typeof item !== "object") {
        return null;
    }

    const siswa = {

        id: String(
            item.ID ??
            item.id ??
            item.Id ??
            item.ID_SISWA ??
            item.idSiswa ??
            ""
        ).trim(),

        nisn: String(
            item.NISN ??
            item.nisn ??
            ""
        ).trim(),

        nama: String(
            item.NAMA ??
            item.nama ??
            item.Nama ??
            ""
        ).trim(),

        kelas: String(
            item.KELAS ??
            item.kelas ??
            item.Kelas ??
            ""
        ).trim(),

        jk: String(
            item.JK ??
            item.jk ??
            ""
        ).trim(),

        status: String(
            item.STATUS ??
            item.status ??
            "AKTIF"
        ).trim(),

        tanggalLahir: String(
            item.TANGGAL_LAHIR ??
            item.tanggalLahir ??
            ""
        ).trim()

    };

    return siswa;
}


// ============================================================
// AMBIL ARRAY DARI RESPONSE API
// ============================================================

function ambilArraySiswa(response) {

    if (Array.isArray(response)) {
        return response;
    }

    if (!response || typeof response !== "object") {
        return [];
    }

    if (Array.isArray(response.data)) {
        return response.data;
    }

    if (
        response.data &&
        Array.isArray(response.data.data)
    ) {
        return response.data.data;
    }

    if (Array.isArray(response.rows)) {
        return response.rows;
    }

    if (Array.isArray(response.result)) {
        return response.result;
    }

    if (Array.isArray(response.siswa)) {
        return response.siswa;
    }

    return [];
}


// ============================================================
// CEK LIBRARY QR
// ============================================================

function cekQRCode() {

    if (typeof QRCode === "undefined") {

        console.error(
            "QRCode library tidak tersedia."
        );

        return false;
    }

    return true;
}


// ============================================================
// BUAT QR CODE
//
// PENTING:
// text = ID SISWA SAJA
//
// Contoh:
// 50001
// 50002
// 50003
// ============================================================

function buatQRCode(idSiswa, containerId) {

    const container =
        document.getElementById(containerId);

    if (!container) {

        console.error(
            "Container QR tidak ditemukan:",
            containerId
        );

        return;
    }


    // Bersihkan QR lama
    container.innerHTML = "";


    // Cek library
    if (!cekQRCode()) {

        container.innerHTML = `
            <div style="
                width:100%;
                height:100%;
                display:flex;
                align-items:center;
                justify-content:center;
                text-align:center;
                font-size:10px;
                color:#b00000;
                font-weight:700;
                background:#fff;
            ">
                QR tidak tersedia
            </div>
        `;

        return;
    }


    // ID wajib ada
    const id =
        String(idSiswa ?? "").trim();


    if (!id) {

        container.innerHTML = `
            <div style="
                width:100%;
                height:100%;
                display:flex;
                align-items:center;
                justify-content:center;
                text-align:center;
                font-size:9px;
                color:#b00000;
                background:#fff;
            ">
                ID kosong
            </div>
        `;

        return;
    }


    /*
       Buat wrapper putih.

       Quiet zone penting agar kamera HP
       dapat mengenali QR dengan lebih mudah.
    */

    const qrWrapper =
        document.createElement("div");

    qrWrapper.style.cssText = `
        width:100%;
        height:100%;
        box-sizing:border-box;
        background:#ffffff;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:1.5mm;
    `;

    container.appendChild(qrWrapper);


    /*
       qrcodejs membuat canvas + img.

       Data QR:
       HANYA ID SISWA.
    */

    try {

        new QRCode(
            qrWrapper,
            {
                text: id,

                width:
                    KARTU_CONFIG.qrWidth,

                height:
                    KARTU_CONFIG.qrHeight,

                colorDark:
                    "#000000",

                colorLight:
                    "#ffffff",

                correctLevel:
                    QRCode.CorrectLevel.H
            }
        );


        console.log(
            "QR berhasil dibuat:",
            id
        );


    } catch (error) {

        console.error(
            "Gagal membuat QR:",
            error
        );

        container.innerHTML = `
            <div style="
                width:100%;
                height:100%;
                display:flex;
                align-items:center;
                justify-content:center;
                text-align:center;
                font-size:9px;
                color:#b00000;
                font-weight:700;
                background:#fff;
            ">
                Gagal membuat QR
            </div>
        `;
    }
}


// ============================================================
// BUAT HTML SATU KARTU
// ============================================================

function buatHTMLKartu(siswa, index) {

    const id =
        siswa.id;

    const nisn =
        siswa.nisn || "-";

    const nama =
        siswa.nama || "-";

    const kelas =
        siswa.kelas || "-";


    /*
       ID unik container QR.

       Contoh:
       qr-siswa-50001
       qr-siswa-50002
    */

    const qrId =
        "qr-siswa-" +
        String(index);


    return `

        <div
            class="student-card"
            data-id="${escapeHTML(id)}"
            data-nama="${escapeHTML(nama)}"
            data-nisn="${escapeHTML(nisn)}"
            data-kelas="${escapeHTML(kelas)}"
        >

            <!-- ==========================================
                 HEADER MERAH
            =========================================== -->

            <div class="card-red"></div>

            <div class="card-gray"></div>

            <div class="card-yellow"></div>


            <!-- ==========================================
                 BULATAN
            =========================================== -->

            <div class="card-circles">

                <span></span>
                <span></span>
                <span></span>

            </div>


            <!-- ==========================================
                 DOT
            =========================================== -->

            <div class="card-dots"></div>


            <!-- ==========================================
                 NAMA SEKOLAH
            =========================================== -->

            <div class="school-name">

                ${escapeHTML(
                    KARTU_CONFIG.namaSekolah
                )}

            </div>


            <!-- ==========================================
                 JUDUL
            =========================================== -->

            <div class="card-heading">

                ${escapeHTML(
                    KARTU_CONFIG.judulKartu
                )}

            </div>


            <!-- ==========================================
                 QR CODE
            =========================================== -->

            <div class="qr-box">

                <div
                    class="qr-code"
                    id="${qrId}"
                    data-qr-id="${escapeHTML(id)}"
                ></div>

            </div>


            <!-- ==========================================
                 DATA SISWA
            =========================================== -->

            <div class="student-data">


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
                        Nama
                    </div>

                    <div class="data-colon">
                        :
                    </div>

                    <div
                        class="data-value"
                        title="${escapeHTML(nama)}"
                    >
                        ${escapeHTML(nama)}
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
                        ${escapeHTML(kelas)}
                    </div>

                </div>


            </div>


            <!-- ==========================================
                 FOOTER
            =========================================== -->

            <div class="card-footer-red"></div>

            <div class="card-footer-yellow"></div>


            <div class="card-chevron">

                <span></span>
                <span></span>
                <span></span>

            </div>

        </div>

    `;
}


// ============================================================
// RENDER SEMUA KARTU
// ============================================================

function renderKartu(data) {

    const container =
        document.getElementById(
            "kartuContainer"
        );

    if (!container) {
        return;
    }


    if (!Array.isArray(data)) {

        container.innerHTML = `
            <div class="kartu-empty">

                Data siswa tidak valid.

            </div>
        `;

        return;
    }


    if (data.length === 0) {

        container.innerHTML = `
            <div class="kartu-empty">

                <i
                    class="fa-solid fa-users"
                    style="
                        font-size:30px;
                        margin-bottom:10px;
                    "
                ></i>

                <br>

                Tidak ada siswa ditemukan.

            </div>
        `;

        return;
    }


    /*
       Buat HTML semua kartu
    */

    let html = "";


    data.forEach(
        function (siswa, index) {

            html +=
                buatHTMLKartu(
                    siswa,
                    index
                );

        }
    );


    container.innerHTML =
        html;


    /*
       Setelah HTML masuk ke DOM,
       baru generate QR satu per satu.
    */

    data.forEach(
        function (siswa, index) {

            const qrId =
                "qr-siswa-" +
                String(index);

            buatQRCode(
                siswa.id,
                qrId
            );

        }
    );


    console.log(
        "Jumlah kartu:",
        data.length
    );

}


// ============================================================
// LOAD DATA SISWA
// ============================================================

async function loadSiswa() {

    const container =
        document.getElementById(
            "kartuContainer"
        );


    if (container) {

        container.innerHTML = `
            <div class="kartu-loading">

                <i
                    class="fa-solid fa-spinner fa-spin"
                ></i>

                <br><br>

                Memuat data siswa...

            </div>
        `;

    }


    try {

        console.log(
            "Mengambil data siswa..."
        );


        const response =
            await callAPI({
                action:
                    "getSiswa"
            });


        console.log(
            "Response getSiswa:",
            response
        );


        /*
           Jika backend mengirim success:false
        */

        if (
            response &&
            response.success === false
        ) {

            throw new Error(
                response.message ||
                "Gagal mengambil data siswa."
            );

        }


        const rawData =
            ambilArraySiswa(
                response
            );


        semuaSiswa =
            rawData
                .map(
                    normalisasiSiswa
                )
                .filter(
                    function (siswa) {

                        return (
                            siswa &&
                            siswa.id &&
                            siswa.nama
                        );

                    }
                );


        console.log(
            "Siswa berhasil dimuat:",
            semuaSiswa.length
        );


        /*
           Urutkan berdasarkan nama
        */

        semuaSiswa.sort(
            function (a, b) {

                return a.nama.localeCompare(
                    b.nama,
                    "id",
                    {
                        sensitivity:
                            "base"
                    }
                );

            }
        );


        /*
           Isi filter kelas
        */

        isiFilterKelas();


        /*
           Tampilkan
        */

        terapkanFilter();


    } catch (error) {

        console.error(
            "ERROR loadSiswa:",
            error
        );


        if (container) {

            container.innerHTML = `

                <div class="kartu-empty">

                    <i
                        class="fa-solid fa-triangle-exclamation"
                        style="
                            font-size:30px;
                            color:#d71920;
                            margin-bottom:10px;
                        "
                    ></i>

                    <br>

                    <strong>
                        Gagal memuat data siswa
                    </strong>

                    <br><br>

                    <span>
                        ${escapeHTML(
                            error.message ||
                            "Terjadi kesalahan."
                        )}
                    </span>

                    <br><br>

                    <button
                        type="button"
                        onclick="loadSiswa()"
                        style="
                            border:0;
                            padding:9px 15px;
                            border-radius:6px;
                            background:#3b94bd;
                            color:#fff;
                            font-weight:700;
                            cursor:pointer;
                        "
                    >
                        Coba Lagi
                    </button>

                </div>

            `;

        }

    }

}


// ============================================================
// ISI FILTER KELAS
// ============================================================

function isiFilterKelas() {

    const select =
        document.getElementById(
            "kelasFilter"
        );

    if (!select) {
        return;
    }


    const kelasSet =
        new Set();


    semuaSiswa.forEach(
        function (siswa) {

            const kelas =
                String(
                    siswa.kelas || ""
                ).trim();

            if (kelas) {
                kelasSet.add(kelas);
            }

        }
    );


    const daftarKelas =
        Array.from(
            kelasSet
        ).sort(
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


// ============================================================
// TERAPKAN FILTER
// ============================================================

function terapkanFilter() {

    const search =
        document.getElementById(
            "searchInput"
        );

    const kelasFilter =
        document.getElementById(
            "kelasFilter"
        );


    const keyword =
        String(
            search?.value || ""
        )
        .trim()
        .toLowerCase();


    const kelas =
        String(
            kelasFilter?.value || ""
        )
        .trim()
        .toLowerCase();


    siswaTampil =
        semuaSiswa.filter(
            function (siswa) {

                const nama =
                    String(
                        siswa.nama || ""
                    ).toLowerCase();

                const nisn =
                    String(
                        siswa.nisn || ""
                    ).toLowerCase();

                const kelasSiswa =
                    String(
                        siswa.kelas || ""
                    ).toLowerCase();


                const cocokSearch =
                    !keyword ||
                    nama.includes(
                        keyword
                    ) ||
                    nisn.includes(
                        keyword
                    );


                const cocokKelas =
                    !kelas ||
                    kelasSiswa === kelas;


                return (
                    cocokSearch &&
                    cocokKelas
                );

            }
        );


    renderKartu(
        siswaTampil
    );

}


// ============================================================
// EVENT SEARCH
// ============================================================

function pasangEventSearch() {

    const search =
        document.getElementById(
            "searchInput"
        );

    if (search) {

        search.addEventListener(
            "input",
            terapkanFilter
        );

    }


    const kelasFilter =
        document.getElementById(
            "kelasFilter"
        );

    if (kelasFilter) {

        kelasFilter.addEventListener(
            "change",
            terapkanFilter
        );

    }


    const refreshButton =
        document.getElementById(
            "refreshButton"
        );

    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            function () {

                loadSiswa();

            }
        );

    }


    const printButton =
        document.getElementById(
            "printButton"
        );

    if (printButton) {

        printButton.addEventListener(
            "click",
            function () {

                window.print();

            }
        );

    }

}


// ============================================================
// START
// ============================================================

function initKartu() {

    console.log(
        "===================================="
    );

    console.log(
        "KARTU.JS AKTIF"
    );

    console.log(
        "QRCode:",
        typeof QRCode
    );

    console.log(
        "callAPI:",
        typeof callAPI
    );

    console.log(
        "===================================="
    );


    /*
       Pastikan API tersedia
    */

    if (
        typeof callAPI !==
        "function"
    ) {

        console.error(
            "callAPI tidak ditemukan."
        );

        const container =
            document.getElementById(
                "kartuContainer"
            );

        if (container) {

            container.innerHTML = `
                <div class="kartu-empty">

                    API belum tersedia.

                    <br><br>

                    Pastikan
                    <strong>api.js</strong>
                    dimuat sebelum
                    <strong>kartu.js</strong>.

                </div>
            `;

        }

        return;
    }


    /*
       Pasang tombol
    */

    pasangEventSearch();


    /*
       Ambil siswa
    */

    loadSiswa();

}


// ============================================================
// DOM READY
// ============================================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initKartu
    );

} else {

    initKartu();

}
