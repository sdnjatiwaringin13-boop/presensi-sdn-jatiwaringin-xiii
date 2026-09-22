"use strict";

// ============================================================
// TEST QR CODE
// QR AKAN BERISI: 50001
// ============================================================

function buatQRCode(idSiswa, containerId) {

  console.log("=================================");
  console.log("MEMBUAT QR CODE");
  console.log("ID:", idSiswa);
  console.log("CONTAINER:", containerId);

  const container =
    document.getElementById(containerId);

  if (!container) {

    console.error(
      "Container tidak ditemukan:",
      containerId
    );

    return false;
  }

  container.innerHTML = "";

  const id =
    String(idSiswa ?? "").trim();

  if (!id) {

    container.innerHTML = `
      <div style="
        color:red;
        font-size:12px;
        text-align:center;
        padding:10px;
      ">
        ID SISWA KOSONG
      </div>
    `;

    return false;
  }

  if (typeof QRCode === "undefined") {

    container.innerHTML = `
      <div style="
        color:red;
        font-size:12px;
        text-align:center;
        padding:10px;
      ">
        LIBRARY QR CODE TIDAK TERSEDIA
      </div>
    `;

    console.error(
      "QRCode library tidak ditemukan."
    );

    return false;
  }

  try {

    new QRCode(container, {

      text: id,

      width: 300,

      height: 300,

      correctLevel:
        QRCode.CorrectLevel.M

    });

    console.log(
      "QR BERHASIL DIBUAT"
    );

    console.log(
      "ISI QR:",
      id
    );

    return true;

  } catch (error) {

    console.error(
      "ERROR QR:",
      error
    );

    return false;
  }
}


// ============================================================
// JALANKAN TEST
// ============================================================

function jalankanTestQR() {

  console.log(
    "MENJALANKAN TEST QR..."
  );

  let test =
    document.getElementById("qr-test");

  if (!test) {

    test =
      document.createElement("div");

    test.id = "qr-test";

    test.style.cssText = `
      position:fixed;
      top:20px;
      right:20px;

      width:340px;
      height:340px;

      background:#ffffff;

      padding:20px;

      border:5px solid red;

      border-radius:10px;

      box-sizing:border-box;

      z-index:999999;

      display:flex;

      align-items:center;

      justify-content:center;

      box-shadow:
        0 5px 30px rgba(0,0,0,.35);
    `;

    document.body.appendChild(test);
  }

  buatQRCode(
    "50001",
    "qr-test"
  );
}


// ============================================================
// INIT
// MENANGANI HALAMAN YANG SUDAH DIMUAT
// ============================================================

if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    jalankanTestQR
  );

} else {

  jalankanTestQR();

}
