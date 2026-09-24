// ============================================================
// KARTU SISWA - TEST QR
// ============================================================

function buatQRCode(idSiswa, containerId) {

    const container = document.getElementById(containerId);

    if (!container) {
        console.error(
            "Container QR tidak ditemukan:",
            containerId
        );
        return;
    }

    // Cek library
    if (typeof QRCode === "undefined") {

        console.error(
            "QRCode library TIDAK tersedia."
        );

        container.innerHTML = `
            <div style="
                padding:20px;
                background:#fff;
                color:#b00000;
                border:2px solid #b00000;
                font-weight:bold;
                text-align:center;
            ">
                Library QR Code tidak ditemukan.
            </div>
        `;

        return;
    }

    const id = String(idSiswa ?? "").trim();

    if (!id) {
        container.innerHTML = "ID siswa kosong.";
        return;
    }

    container.innerHTML = "";

    container.style.cssText = `
        width:340px;
        height:340px;
        padding:20px;
        box-sizing:border-box;
        background:#ffffff;
        display:flex;
        align-items:center;
        justify-content:center;
    `;

    new QRCode(container, {
        text: id,
        width: 300,
        height: 300,
        correctLevel: QRCode.CorrectLevel.H
    });

    console.log(
        "QR BERHASIL DIBUAT"
    );

    console.log(
        "Data QR:",
        id
    );
}


// ============================================================
// TES QR 50001
// ============================================================

function tesQRCode() {

    const box = document.createElement("div");

    box.id = "qr-test";

    box.style.cssText = `
        position:fixed;
        z-index:999999;

        left:50%;
        top:50%;

        transform:translate(-50%,-50%);

        width:400px;
        min-height:500px;

        padding:25px;

        box-sizing:border-box;

        background:#ffffff;

        border:4px solid #000000;

        border-radius:12px;

        text-align:center;

        box-shadow:
            0 15px 50px
            rgba(0,0,0,.45);
    `;

    box.innerHTML = `

        <div style="
            font-size:24px;
            font-weight:800;
            margin-bottom:20px;
        ">
            TES QR CODE
        </div>

        <div
            id="qr-test-code"
            style="
                width:340px;
                height:340px;
                margin:auto;
                background:#ffffff;

                display:flex;
                align-items:center;
                justify-content:center;
            "
        ></div>

        <div style="
            margin-top:20px;
            font-size:16px;
            font-weight:700;
        ">
            DATA QR
        </div>

        <div style="
            margin-top:5px;
            font-size:28px;
            font-weight:900;
        ">
            50001
        </div>

        <div style="
            margin-top:12px;
            font-size:13px;
            color:#555;
        ">
            Scan menggunakan kamera HP
            atau Google Lens.
        </div>
    `;

    document.body.appendChild(box);

    buatQRCode(
        "50001",
        "qr-test-code"
    );
}


// ============================================================
// START
// ============================================================

function mulaiKartu() {

    console.log("================================");
    console.log("KARTU.JS AKTIF");
    console.log("QRCode:", typeof QRCode);
    console.log("================================");

    if (typeof QRCode === "undefined") {

        alert(
            "Library QRCode belum berhasil dimuat."
        );

        return;
    }

    tesQRCode();
}


// ============================================================
// DOM READY
// ============================================================

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        mulaiKartu
    );

} else {

    mulaiKartu();

}
