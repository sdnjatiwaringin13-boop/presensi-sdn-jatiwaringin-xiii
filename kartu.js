// ============================================================
// MEMBUAT QR CODE SISWA
// ============================================================

function buatQRCode(idSiswa, containerId) {

  const container = document.getElementById(containerId);

  if (!container) {
    console.error("Container QR tidak ditemukan:", containerId);
    return;
  }

  // Bersihkan QR lama
  container.innerHTML = "";

  // Pastikan ID ada
  const id = String(idSiswa || "").trim();

  if (!id) {
    container.innerHTML =
      '<div style="color:red;font-size:11px;">ID siswa kosong</div>';
    return;
  }

  // Pastikan library QRCode tersedia
  if (typeof QRCode === "undefined") {

    container.innerHTML =
      '<div style="color:red;font-size:11px;">Library QRCode belum dimuat.</div>';

    console.error("QRCode library belum tersedia.");

    return;
  }

  try {

    new QRCode(container, {

      text: id,

      width: 180,

      height: 180,

      correctLevel: QRCode.CorrectLevel.M

    });

    console.log(
      "QR berhasil dibuat. Isi QR:",
      id
    );

  } catch (error) {

    console.error(
      "Gagal membuat QR:",
      error
    );

    container.innerHTML =
      '<div style="color:red;font-size:11px;">QR gagal dibuat.</div>';

  }
}
