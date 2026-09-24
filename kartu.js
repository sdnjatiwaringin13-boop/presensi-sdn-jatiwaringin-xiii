// ============================================================
// KARTU SISWA - QR CODE TEST
// ============================================================

function buatQRCode(idSiswa, containerId) {

    const container = document.getElementById(containerId);

    if (!container) {
        console.error("Container QR tidak ditemukan:", containerId);
        return;
    }

    // Pastikan library QR tersedia
    if (typeof QRCode === "undefined") {

        console.error("Library QRCode tidak tersedia.");

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

        container.innerHTML = `
            <div style="
                padding:20px;
                color:red;
                font-weight:bold;
            ">
                ID siswa kosong
            </div>
        `;

        return;
    }

    // Bersihkan container
    container.innerHTML = "";

    // Container putih
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

    // Canvas QR
    const canvas = document.createElement("canvas");

    canvas.width = 300;
    canvas.height = 300;

    canvas.style.width = "300px";
    canvas.style.height = "300px";

    container.appendChild(canvas);

    // Buat QR
    QRCode.toCanvas(
        canvas,
        id,
        {
            errorCorrectionLevel: "H",
            margin: 4,
            width: 300,
            color: {
                dark: "#000000",
                light: "#ffffff"
            }
        },
        function(error) {

            if (error) {

                console.error(
                    "Gagal membuat QR:",
                    error
                );

                container.innerHTML = `
                    <div style="
                        padding:20px;
                        color:red;
                        font-weight:bold;
                        text-align:center;
                    ">
                        Gagal membuat QR Code
                    </div>
                `;

                return;
            }

            console.log(
                "QR BERHASIL DIBUAT"
            );

            console.log(
                "Isi QR:",
                id
            );

        }
    );
}


// ============================================================
// TES QR
// ============================================================

function tesQRCode() {

    console.log(
        "=== MULAI TES QR ==="
    );

    let box = document.getElementById(
        "qr-test"
    );

    if (!box) {

        box = document.createElement("div");

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

        document.body.appendChild(box);
    }

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
            font-size:22px;
            font-weight:800;
        ">
            DATA QR:
        </div>

        <div style="
            margin-top:5px;
            font-size:26px;
            font-weight:900;
        ">
            50001
        </div>

        <div style="
            margin-top:12px;
            font-size:14px;
            color:#555;
            line-height:1.5;
        ">
            Silakan scan QR ini menggunakan
            kamera HP atau Google Lens.
        </div>
    `;

    buatQRCode(
        "50001",
        "qr-test-code"
    );
}


// ============================================================
// START
// ============================================================

function mulaiKartu() {

    console.log(
        "kartu.js aktif"
    );

    console.log(
        "QRCode library:",
        typeof QRCode
    );

    tesQRCode();
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
        mulaiKartu
    );

} else {

    mulaiKartu();

}
