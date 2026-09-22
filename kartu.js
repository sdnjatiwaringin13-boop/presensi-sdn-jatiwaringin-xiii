// ============================================================
// MEMBUAT QR CODE SISWA
// QR HANYA BERISI ID SISWA
// ============================================================

function buatQRCode(idSiswa, containerId) {

  console.log("====================================");
  console.log("MEMBUAT QR SISWA");
  console.log("ID siswa:", idSiswa);
  console.log("Container:", containerId);

  const container = document.getElementById(containerId);

  if (!container) {

    console.error(
      "Container QR tidak ditemukan:",
      containerId
    );

    return false;
  }

  // Bersihkan QR sebelumnya
  container.innerHTML = "";

  // Ambil ID siswa
  const id = String(idSiswa ?? "").trim();

  console.log("Isi QR yang akan dibuat:", id);

  // ID kosong
  if (!id) {

    container.innerHTML = `
      <div style="
        color:red;
        font-size:10px;
        text-align:center;
        padding:5px;
      ">
        ID SISWA KOSONG
      </div>
    `;

    console.error(
      "QR tidak dibuat karena ID siswa kosong."
    );

    return false;
  }

  // Cek library
  if (typeof QRCode === "undefined") {

    container.innerHTML = `
      <div style="
        color:red;
        font-size:10px;
        text-align:center;
        padding:5px;
      ">
        QR LIBRARY TIDAK TERSEDIA
      </div>
    `;

    console.error(
      "QRCode library belum dimuat."
    );

    return false;
  }

  try {

    // ========================================================
    // BUAT QR
    // ========================================================

    new QRCode(container, {

      // INI ISI QR SEBENARNYA
      text: id,

      // Ukuran besar supaya mudah dibaca kamera
      width: 220,
      height: 220,

      // Error correction M
      correctLevel: QRCode.CorrectLevel.M

    });


    // ========================================================
    // PASTIKAN HASIL QR ADA
    // ========================================================

    const canvas =
      container.querySelector("canvas");

    const image =
      container.querySelector("img");


    if (!canvas && !image) {

      console.error(
        "QRCode tidak menghasilkan canvas maupun image."
      );

      return false;
    }


    console.log(
      "QR BERHASIL DIBUAT"
    );

    console.log(
      "ISI QR:",
      id
    );

    console.log(
      "QR canvas:",
      canvas
    );

    console.log(
      "QR image:",
      image
    );

    console.log(
      "===================================="
    );

    return true;

  } catch (error) {

    console.error(
      "Gagal membuat QR:",
      error
    );

    container.innerHTML = `
      <div style="
        color:red;
        font-size:10px;
        text-align:center;
        padding:5px;
      ">
        QR GAGAL DIBUAT
      </div>
    `;

    return false;
  }
}
