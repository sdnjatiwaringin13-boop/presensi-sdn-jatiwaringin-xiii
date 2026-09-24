function buatQRCode(idSiswa, containerId) {
  const container = document.getElementById(containerId);

  if (!container) {
    console.error("Container QR tidak ditemukan:", containerId);
    return;
  }

  if (typeof QRCode === "undefined") {
    container.innerHTML = `
      <div style="
        padding:20px;
        color:red;
        background:#fff;
        border:1px solid red;
      ">
        Library QRCode tidak ditemukan.
      </div>
    `;
    return;
  }

  const id = String(idSiswa ?? "").trim();

  if (!id) {
    container.innerHTML = "ID siswa kosong";
    return;
  }

  container.innerHTML = "";

  // Kotak putih khusus QR
  container.style.cssText = `
    width:320px;
    height:320px;
    padding:20px;
    box-sizing:border-box;
    background:#fff;
    display:flex;
    align-items:center;
    justify-content:center;
  `;

  new QRCode(container, {
    text: id,
    width: 280,
    height: 280,
    correctLevel: QRCode.CorrectLevel.H
  });

  console.log("QR dibuat dengan data:", id);
}


// =====================================================
// TES QR
// =====================================================

function jalankanTesQR() {
  console.log("Memulai tes QR...");

  let test = document.getElementById("qr-test");

  if (!test) {
    test = document.createElement("div");

    test.id = "qr-test";

    test.style.cssText = `
      position:fixed;
      z-index:999999;
      left:50%;
      top:50%;
      transform:translate(-50%,-50%);
      width:360px;
      min-height:420px;
      padding:20px;
      box-sizing:border-box;
      background:#fff;
      border:3px solid #000;
      border-radius:10px;
      text-align:center;
      box-shadow:0 10px 40px rgba(0,0,0,.4);
    `;

    document.body.appendChild(test);
  }

  test.innerHTML = `
    <div style="
      font-size:20px;
      font-weight:bold;
      margin-bottom:15px;
    ">
      TES QR CODE
    </div>

    <div id="qr-test-code"></div>

    <div style="
      margin-top:15px;
      font-size:18px;
      font-weight:bold;
    ">
      DATA: 50001
    </div>

    <div style="
      margin-top:10px;
      font-size:13px;
      color:#555;
    ">
      Coba scan QR ini menggunakan<br>
      kamera HP atau Google Lens.
    </div>
  `;

  buatQRCode("50001", "qr-test-code");
}


// =====================================================
// JALANKAN SETELAH DOM SIAP
// =====================================================

if (document.readyState === "loading") {

  document.addEventListener("DOMContentLoaded", function () {
    jalankanTesQR();
  });

} else {

  jalankanTesQR();

}
