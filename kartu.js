"use strict";

(function () {

    let semuaSiswa = [];

    const $ = id =>
        document.getElementById(id);


    document.addEventListener(
        "DOMContentLoaded",
        init
    );


    async function init() {

        bindEvents();

        await loadSiswa();

    }


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
                () => loadSiswa(true)
            );


        $("printButton")
            ?.addEventListener(
                "click",
                () => window.print()
            );

    }


    async function loadSiswa(
        forceRefresh = false
    ) {

        const container =
            $("kartuContainer");


        container.innerHTML = `

            <div class="kartu-loading">

                <i class="fa-solid fa-spinner fa-spin"></i>

                Memuat data siswa...

            </div>

        `;


        try {

            const result =
                await callAPI({

                    action: "getSiswa",

                    aktifOnly: true,

                    forceRefresh:
                        forceRefresh

                });


            if (
                !result ||
                !result.success
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


            loadKelasFilter();

            renderSiswa();


        } catch (error) {

            console.error(error);


            container.innerHTML = `

                <div class="kartu-empty">

                    <i
                        class="fa-solid fa-circle-exclamation"
                    ></i>

                    <br><br>

                    Gagal memuat data siswa.

                    <br>

                    ${escapeHTML(
                        error.message
                    )}

                </div>

            `;

        }

    }


    function loadKelasFilter() {

        const select =
            $("kelasFilter");


        if (!select) return;


        const kelas =
            [
                ...new Set(

                    semuaSiswa
                        .map(
                            siswa =>
                                String(
                                    siswa.KELAS || ""
                                ).trim()
                        )
                        .filter(Boolean)

                )
            ];


        kelas.sort(
            (a, b) =>
                a.localeCompare(
                    b,
                    "id",
                    {
                        numeric: true
                    }
                )
        );


        select.innerHTML = `

            <option value="">
                Semua Kelas
            </option>

        `;


        kelas.forEach(
            namaKelas => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    namaKelas;

                option.textContent =
                    namaKelas;

                select.appendChild(
                    option
                );

            }
        );

    }


    function renderSiswa() {

        const container =
            $("kartuContainer");


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
                siswa => {

                    const nama =
                        String(
                            siswa.NAMA || ""
                        )
                        .toLowerCase();


                    const nisn =
                        String(
                            siswa.NISN || ""
                        )
                        .toLowerCase();


                    const dataKelas =
                        String(
                            siswa.KELAS || ""
                        )
                        .toLowerCase();


                    return (

                        (
                            !keyword ||

                            nama.includes(
                                keyword
                            ) ||

                            nisn.includes(
                                keyword
                            )
                        )

                        &&

                        (
                            !kelas ||

                            dataKelas ===
                            kelas
                        )

                    );

                }
            );


        container.innerHTML = "";


        if (!data.length) {

            container.innerHTML = `

                <div class="kartu-empty">

                    Data siswa tidak ditemukan.

                </div>

            `;

            return;

        }


        data.forEach(
            (siswa, index) => {

                container.appendChild(

                    createCard(
                        siswa,
                        index
                    )

                );

            }
        );

    }


    function createCard(
        siswa,
        index
    ) {

        const id =
            siswa.ID || "";


        const nama =
            siswa.NAMA || "-";


        const nisn =
            siswa.NISN || "-";


        const tanggalLahir =
            siswa.TANGGAL_LAHIR || "-";


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "student-card";


        const qrId =
            "qr_" +
            index +
            "_" +
            Date.now();


        card.innerHTML = `

            <div class="card-red"></div>

            <div class="card-gray"></div>

            <div class="card-yellow"></div>


            <div class="card-circles">

                <span></span>
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

                KARTU PELAJAR

            </div>


            <div class="qr-box">

                <div
                    id="${qrId}"
                    class="qr-code"
                ></div>

            </div>


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


            <div class="card-chevron">

                <span></span>
                <span></span>
                <span></span>

            </div>


            <div class="card-footer-red"></div>

            <div class="card-footer-yellow"></div>

        `;


        /*
         * QR DIBUAT SATU KALI SAJA
         */

        const qr =
            card.querySelector(
                "#" + qrId
            );


        if (
            qr &&
            typeof QRCode !== "undefined"
        ) {

            new QRCode(
                qr,
                {

                    text:
                        JSON.stringify({

                            id:
                                String(id),

                            nisn:
                                String(nisn)

                        }),

                    width: 180,

                    height: 180,

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


    function formatTanggal(
        value
    ) {

        if (
            !value ||
            value === "-"
        ) {

            return "-";

        }


        const text =
            String(value).trim();


        /*
         * yyyy-mm-dd
         */

        let match =
            text.match(
                /^(\d{4})-(\d{2})-(\d{2})$/
            );


        if (match) {

            const tahun =
                match[1];

            const bulan =
                Number(match[2]);

            const hari =
                Number(match[3]);


            const bulanNama = [

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
                bulanNama[
                    bulan - 1
                ] +
                " " +
                tahun
            );

        }


        /*
         * dd/mm/yyyy
         */

        match =
            text.match(
                /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
            );


        if (match) {

            const hari =
                Number(match[1]);

            const bulan =
                Number(match[2]);

            const tahun =
                match[3];


            const bulanNama = [

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
                bulanNama[
                    bulan - 1
                ] +
                " " +
                tahun
            );

        }


        return text;

    }


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


})();
