"use strict";

/*
 * DASHBOARD PRESENSI
 * SD NEGERI JATIWARINGIN XIII
 */

const API_URL =
    "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";


/* =========================================================
   API
========================================================= */

async function callDashboardAPI(payload) {

    try {

        const response = await fetch(
            API_URL,
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "text/plain;charset=utf-8"
                },
                body: JSON.stringify(payload)
            }
        );

        const text =
            await response.text();

        let result;

        try {

            result =
                JSON.parse(text);

        } catch (error) {

            console.error(
                "Response bukan JSON:",
                text
            );

            throw new Error(
                "Server mengembalikan response yang tidak valid."
            );
        }

        return result;

    } catch (error) {

        console.error(
            "API Error:",
            error
        );

        throw error;
    }
}


/* =========================================================
   TANGGAL HARI INI
========================================================= */

function getToday() {

    const now =
        new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            now.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        try {

            const user =
                Auth.requireLogin();

            if (!user) {
                return;
            }

            setupUser(user);

            setupMenuByRole(user);

            await loadDashboard();

        } catch (error) {

            console.error(
                "Dashboard Error:",
                error
            );

        }

    }
);


/* =========================================================
   USER
========================================================= */

function setupUser(user) {

    const nama =
        user.nama ||
        user.username ||
        "Pengguna";

    const role =
        String(
            user.role || ""
        ).toUpperCase();


    const sidebarName =
        document.getElementById(
            "sidebarUserName"
        );

    const sidebarRole =
        document.getElementById(
            "sidebarUserRole"
        );

    const topUser =
        document.getElementById(
            "topUserName"
        );


    if (sidebarName) {

        sidebarName.textContent =
            nama;
    }


    if (sidebarRole) {

        sidebarRole.textContent =
            role === "ADMIN"
                ? "Administrator"
                : "Guru / Wali Kelas";
    }


    if (topUser) {

        topUser.textContent =
            nama;
    }
}


/* =========================================================
   MENU BERDASARKAN ROLE
========================================================= */

function setupMenuByRole(user) {

    const role =
        String(
            user.role || ""
        ).toUpperCase();


    const menuPresensi =
        document.getElementById(
            "menuPresensi"
        );

    const menuKartu =
        document.getElementById(
            "menuKartu"
        );

    const menuPengaturan =
        document.getElementById(
            "menuPengaturan"
        );


    /*
     * GURU
     */

    if (role === "GURU") {

        if (menuKartu) {

            menuKartu.style.display =
                "none";
        }

        if (menuPengaturan) {

            menuPengaturan.style.display =
                "none";
        }

    }


    /*
     * ADMIN
     */

    if (role === "ADMIN") {

        if (menuPresensi) {

            menuPresensi.style.display =
                "none";
        }
    }
}


/* =========================================================
   LOAD DASHBOARD
========================================================= */

async function loadDashboard() {

    setLoadingStats();


    const user =
        Auth.getCurrentUser();


    const role =
        String(
            user?.role || ""
        ).toUpperCase();


    try {

        /*
         * LOAD SISWA
         */

        const siswaResult =
            await callDashboardAPI({
                action: "getSiswa"
            });


        const siswa =
            extractArray(
                siswaResult
            );


        /*
         * LOAD GURU
         */

        const guruResult =
            await callDashboardAPI({
                action: "getGuru"
            });


        const guru =
            extractArray(
                guruResult
            );


        /*
         * LOAD KELAS
         */

        const kelasResult =
            await callDashboardAPI({
                action: "getKelas"
            });


        const kelas =
            extractArray(
                kelasResult
            );


        /*
         * TANGGAL
         */

        const tanggal =
            getToday();


        /*
         * LOAD REKAP
         */

        const rekapResult =
            await callDashboardAPI({
                action: "getRekap",
                tanggal: tanggal
            });


        const rekapRows =
            extractArray(
                rekapResult
            );


        /*
         * STATISTIK MASTER
         */

        document.getElementById(
            "totalSiswa"
        ).textContent =
            siswa.length;


        document.getElementById(
            "totalGuru"
        ).textContent =
            guru.length;


        document.getElementById(
            "totalKelas"
        ).textContent =
            kelas.length;


        /*
         * FILTER REKAP GURU
         *
         * Jika login sebagai guru,
         * dashboard hanya menampilkan
         * presensi kelas guru tersebut.
         */

        let rows =
            rekapRows;


        if (
            role === "GURU" &&
            user.idGuru
        ) {

            rows =
                rekapRows.filter(
                    row =>
                        String(
                            row.ID_GURU ||
                            row.idGuru ||
                            ""
                        ) ===
                        String(
                            user.idGuru
                        )
                );
        }


        /*
         * HITUNG STATUS
         */

        const counts =
            countStatuses(rows);


        document.getElementById(
            "totalHadir"
        ).textContent =
            counts.HADIR;


        document.getElementById(
            "totalIzin"
        ).textContent =
            counts.IZIN;


        document.getElementById(
            "totalSakit"
        ).textContent =
            counts.SAKIT;


        document.getElementById(
            "totalAlpa"
        ).textContent =
            counts.ALPA;


        /*
         * BELUM ABSEN
         */

        let activeStudents =
            siswa;


        /*
         * Jika GURU,
         * hanya siswa kelas yang terkait.
         */

        if (
            role === "GURU" &&
            user.idGuru
        ) {

            try {

                const kelasGuruResult =
                    await callDashboardAPI({
                        action: "getKelasGuru",
                        idGuru: user.idGuru
                    });


                const kelasGuru =
                    extractArray(
                        kelasGuruResult
                    );


                if (kelasGuru.length) {

                    const namaKelas =
                        kelasGuru.map(
                            item =>
                                String(
                                    item.NAMA_KELAS ||
                                    item.namaKelas ||
                                    ""
                                ).trim()
                        );


                    activeStudents =
                        siswa.filter(
                            item =>
                                namaKelas.includes(
                                    String(
                                        item.KELAS ||
                                        ""
                                    ).trim()
                                )
                        );
                }

            } catch (error) {

                console.warn(
                    "Tidak dapat memfilter kelas guru:",
                    error
                );
            }
        }


        const absentIds =
            new Set(
                rows.map(
                    row =>
                        String(
                            row.ID ||
                            row.id ||
                            row.ID_SISWA ||
                            ""
                        )
                )
            );


        const belumAbsen =
            activeStudents.filter(
                student => {

                    const id =
                        String(
                            student.ID ||
                            student.id ||
                            ""
                        );

                    return !absentIds.has(id);
                }
            );


        document.getElementById(
            "totalBelumAbsen"
        ).textContent =
            belumAbsen.length;


        /*
         * RENDER TABLE
         */

        renderBelumAbsen(
            belumAbsen
        );


        renderSudahAbsen(
            rows
        );


        renderRekap(
            counts,
            activeStudents.length
        );


    } catch (error) {

        console.error(
            error
        );

        showDashboardError(
            error.message
        );
    }
}


/* =========================================================
   EXTRACT ARRAY
========================================================= */

function extractArray(result) {

    if (!result) {
        return [];
    }


    if (
        Array.isArray(result)
    ) {

        return result;
    }


    if (
        Array.isArray(result.data)
    ) {

        return result.data;
    }


    if (
        result.data &&
        Array.isArray(result.data.rows)
    ) {

        return result.data.rows;
    }


    if (
        result.data &&
        Array.isArray(result.data.data)
    ) {

        return result.data.data;
    }


    if (
        Array.isArray(result.rows)
    ) {

        return result.rows;
    }


    return [];
}


/* =========================================================
   COUNT STATUS
========================================================= */

function countStatuses(rows) {

    const counts = {

        HADIR: 0,
        IZIN: 0,
        SAKIT: 0,
        ALPA: 0
    };


    rows.forEach(
        row => {

            const status =
                String(
                    row.STATUS ||
                    row.status ||
                    ""
                ).toUpperCase();


            if (
                Object.prototype.hasOwnProperty.call(
                    counts,
                    status
                )
            ) {

                counts[status]++;
            }
        }
    );


    return counts;
}


/* =========================================================
   RENDER BELUM ABSEN
========================================================= */

function renderBelumAbsen(
    students
) {

    const tbody =
        document.getElementById(
            "tableBelumBody"
        );


    if (!tbody) return;


    if (!students.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="empty">
                    <i class="fa-solid fa-circle-check"></i>
                    Semua siswa sudah melakukan presensi.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        students
            .map(
                (student, index) => {

                    const nisn =
                        student.NISN ||
                        student.nisn ||
                        "-";

                    const nama =
                        student.NAMA ||
                        student.nama ||
                        "-";

                    const kelas =
                        student.KELAS ||
                        student.kelas ||
                        "-";


                    return `
                        <tr>

                            <td>
                                ${index + 1}
                            </td>

                            <td>
                                ${escapeHTML(
                                    String(nisn)
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    String(nama)
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    String(kelas)
                                )}
                            </td>

                        </tr>
                    `;
                }
            )
            .join("");
}


/* =========================================================
   RENDER SUDAH ABSEN
========================================================= */

function renderSudahAbsen(
    rows
) {

    const tbody =
        document.getElementById(
            "tableSudahBody"
        );


    if (!tbody) return;


    if (!rows.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty">
                    Belum ada data presensi hari ini.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        rows
            .map(
                (row, index) => {

                    const nisn =
                        row.NISN ||
                        row.nisn ||
                        "-";

                    const nama =
                        row.NAMA ||
                        row.nama ||
                        "-";

                    const status =
                        String(
                            row.STATUS ||
                            row.status ||
                            "-"
                        ).toUpperCase();

                    const jam =
                        row.JAM ||
                        row.jam ||
                        "-";


                    return `
                        <tr>

                            <td>
                                ${index + 1}
                            </td>

                            <td>
                                ${escapeHTML(
                                    String(nisn)
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    String(nama)
                                )}
                            </td>

                            <td>
                                ${getStatusBadge(
                                    status
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    String(jam)
                                )}
                            </td>

                        </tr>
                    `;
                }
            )
            .join("");
}


/* =========================================================
   STATUS BADGE
========================================================= */

function getStatusBadge(
    status
) {

    let className =
        "badge-hadir";


    if (status === "IZIN") {

        className =
            "badge-izin";

    } else if (
        status === "SAKIT"
    ) {

        className =
            "badge-sakit";

    } else if (
        status === "ALPA"
    ) {

        className =
            "badge-alpa";
    }


    return `
        <span class="badge ${className}">
            ${escapeHTML(status)}
        </span>
    `;
}


/* =========================================================
   REKAP
========================================================= */

function renderRekap(
    counts,
    totalSiswa
) {

    document.getElementById(
        "rekapHadir"
    ).textContent =
        counts.HADIR;


    document.getElementById(
        "rekapIzin"
    ).textContent =
        counts.IZIN;


    document.getElementById(
        "rekapSakit"
    ).textContent =
        counts.SAKIT;


    document.getElementById(
        "rekapAlpa"
    ).textContent =
        counts.ALPA;


    setPercentage(
        "persenHadir",
        counts.HADIR,
        totalSiswa
    );


    setPercentage(
        "persenIzin",
        counts.IZIN,
        totalSiswa
    );


    setPercentage(
        "persenSakit",
        counts.SAKIT,
        totalSiswa
    );


    setPercentage(
        "persenAlpa",
        counts.ALPA,
        totalSiswa
    );
}


/* =========================================================
   PERCENTAGE
========================================================= */

function setPercentage(
    elementId,
    value,
    total
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) return;


    if (!total) {

        element.textContent =
            "0%";

        return;
    }


    const percentage =
        (
            Number(value) /
            Number(total) *
            100
        ).toFixed(1);


    element.textContent =
        `${percentage}%`;
}


/* =========================================================
   LOADING
========================================================= */

function setLoadingStats() {

    const ids = [
        "totalSiswa",
        "totalGuru",
        "totalKelas",
        "totalHadir",
        "totalIzin",
        "totalSakit",
        "totalAlpa",
        "totalBelumAbsen"
    ];


    ids.forEach(
        id => {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.innerHTML =
                    `<i class="fa-solid fa-spinner fa-spin"
                    style="font-size:18px"></i>`;
            }
        }
    );
}


/* =========================================================
   ERROR
========================================================= */

function showDashboardError(
    message
) {

    console.error(
        "Dashboard:",
        message
    );


    const tbody1 =
        document.getElementById(
            "tableBelumBody"
        );


    const tbody2 =
        document.getElementById(
            "tableSudahBody"
        );


    if (tbody1) {

        tbody1.innerHTML = `
            <tr>
                <td colspan="4" class="empty">
                    Gagal memuat data.
                </td>
            </tr>
        `;
    }


    if (tbody2) {

        tbody2.innerHTML = `
            <tr>
                <td colspan="5" class="empty">
                    Gagal memuat data.
                </td>
            </tr>
        `;
    }
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
    value
) {

    return String(value)
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
