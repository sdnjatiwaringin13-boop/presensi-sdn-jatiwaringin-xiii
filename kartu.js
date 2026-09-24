/* ============================================================
   KARTU.JS - FINAL
   SD NEGERI JATIWARINGIN XIII

   QR setiap siswa berisi ID SISWA SAJA.
   Contoh: 50001

   QR dibuat sebagai gambar sehingga halaman kartu tidak
   bergantung pada library QR JavaScript/CDN qrcodejs.
   ============================================================ */

"use strict";

let semuaSiswa = [];
let siswaTampil = [];

const KARTU_CONFIG = {
  namaSekolah: "SD NEGERI JATIWARINGIN XIII",
  judulKartu: "KARTU SISWA",
  qrSize: 600
};

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalisasiSiswa(item) {
  if (!item || typeof item !== "object") return null;

  return {
    id: String(
      item.ID ?? item.id ?? item.Id ?? item.ID_SISWA ?? item.idSiswa ?? ""
    ).trim(),
    nisn: String(item.NISN ?? item.nisn ?? "").trim(),
    nama: String(item.NAMA ?? item.nama ?? item.Nama ?? "").trim(),
    kelas: String(item.KELAS ?? item.kelas ?? item.Kelas ?? "").trim(),
    jk: String(item.JK ?? item.jk ?? "").trim(),
    status: String(item.STATUS ?? item.status ?? "AKTIF").trim(),
    tanggalLahir: String(
      item.TANGGAL_LAHIR ?? item.tanggalLahir ?? ""
    ).trim()
  };
}

function ambilArraySiswa(response) {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== "object") return [];
  if (Array.isArray(response.data)) return response.data;
  if (response.data && Array.isArray(response.data.data)) return response.data.data;
  if (Array.isArray(response.rows)) return response.rows;
  if (Array.isArray(response.result)) return response.result;
  if (Array.isArray(response.siswa)) return response.siswa;
  return [];
}

/* ============================================================
   QR IMAGE
   Primary  : QRServer
   Fallback : QuickChart
   Isi      : ID SISWA SAJA
   ============================================================ */
function urlQRCode(id, provider) {
  const data = encodeURIComponent(String(id).trim());
  const size = KARTU_CONFIG.qrSize;

  if (provider === "quickchart") {
    return `https://quickchart.io/qr?text=${data}&size=${size}&margin=8&ecLevel=H`;
  }

  if (provider === "qrserver") {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=16&ecc=H&data=${data}`;
  }

  // Provider terakhir untuk berjaga-jaga jika salah satu CDN/API gagal.
  return `https://quickchart.io/qr?text=${data}&size=${size}&margin=12&ecLevel=H&type=png`;
}

function buatQRCode(idSiswa, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  const id = String(idSiswa ?? "").trim();
  if (!id) {
    container.innerHTML = '<span style="font-size:9px;color:#b00000;font-weight:700">ID kosong</span>';
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "qr-image-wrapper";
  wrapper.style.cssText = `
    width:100%;
    height:100%;
    background:#fff;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:1mm;
    box-sizing:border-box;
  `;

  const img = document.createElement("img");
  img.className = "qr-image";
  img.alt = `QR ${id}`;
  img.width = KARTU_CONFIG.qrSize;
  img.height = KARTU_CONFIG.qrSize;
  img.decoding = "sync";
  img.loading = "eager";
  img.referrerPolicy = "no-referrer";
  img.dataset.qrReady = "false";
  img.dataset.qrId = id;
  img.style.cssText = `
    display:block;
    width:100%;
    height:100%;
    object-fit:contain;
    background:#fff;
    image-rendering:auto;
  `;

  // Coba provider satu per satu. Tidak ada QR kosong yang dianggap siap cetak.
  const providers = ["qrserver", "quickchart"];
  let providerIndex = 0;

  const setSource = () => {
    const provider = providers[providerIndex];
    img.dataset.qrProvider = provider;
    img.dataset.qrReady = "false";
    img.src = urlQRCode(id, provider);
  };

  img.onload = function () {
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      img.dataset.qrReady = "true";
      console.log("QR siap:", id, providerIndex === 0 ? "QRServer" : "QuickChart");
    }
  };

  img.onerror = function () {
    providerIndex += 1;

    if (providerIndex < providers.length) {
      setSource();
      return;
    }

    img.dataset.qrReady = "false";
    wrapper.innerHTML = `
      <div style="
        text-align:center;
        font-size:8px;
        line-height:1.3;
        color:#b00000;
        font-weight:700;
      ">
        QR gagal dimuat<br>
        ID: ${escapeHTML(id)}
      </div>
    `;
  };

  wrapper.appendChild(img);
  container.appendChild(wrapper);
  setSource();
}

function buatHTMLKartu(siswa, index) {
  const id = siswa.id;
  const qrId = `qr-siswa-${index}`;

  return `
    <div
      class="student-card"
      data-id="${escapeHTML(id)}"
      data-nama="${escapeHTML(siswa.nama)}"
      data-nisn="${escapeHTML(siswa.nisn)}"
      data-kelas="${escapeHTML(siswa.kelas)}"
    >
      <div class="card-red"></div>
      <div class="card-gray"></div>
      <div class="card-yellow"></div>

      <div class="card-circles">
        <span></span><span></span><span></span>
      </div>

      <div class="card-dots"></div>

      <div class="school-name">
        ${escapeHTML(KARTU_CONFIG.namaSekolah)}
      </div>

      <div class="card-heading">
        ${escapeHTML(KARTU_CONFIG.judulKartu)}
      </div>

      <div class="qr-box">
        <div
          class="qr-code"
          id="${qrId}"
          data-qr-id="${escapeHTML(id)}"
        ></div>
      </div>

      <div class="student-data">
        <div class="data-row">
          <div class="data-label">NISN</div>
          <div class="data-colon">:</div>
          <div class="data-value">${escapeHTML(siswa.nisn || "-")}</div>
        </div>

        <div class="data-row">
          <div class="data-label">Nama</div>
          <div class="data-colon">:</div>
          <div class="data-value" title="${escapeHTML(siswa.nama)}">
            ${escapeHTML(siswa.nama || "-")}
          </div>
        </div>

        <div class="data-row">
          <div class="data-label">Kelas</div>
          <div class="data-colon">:</div>
          <div class="data-value">${escapeHTML(siswa.kelas || "-")}</div>
        </div>
      </div>

      <div class="card-footer-red"></div>
      <div class="card-footer-yellow"></div>

      <div class="card-chevron">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
}

function renderKartu(data) {
  const container = document.getElementById("kartuContainer");
  if (!container) return;

  if (!data.length) {
    container.innerHTML = `
      <div class="kartu-empty">
        <i class="fa-solid fa-users" style="font-size:30px;margin-bottom:10px"></i>
        <br>Tidak ada siswa ditemukan.
      </div>
    `;
    return;
  }

  container.innerHTML = data
    .map((siswa, index) => buatHTMLKartu(siswa, index))
    .join("");

  data.forEach((siswa, index) => {
    buatQRCode(siswa.id, `qr-siswa-${index}`);
  });
}

async function loadSiswa() {
  const container = document.getElementById("kartuContainer");

  if (container) {
    container.innerHTML = `
      <div class="kartu-loading">
        <i class="fa-solid fa-spinner fa-spin"></i>
        <br><br>Memuat data siswa...
      </div>
    `;
  }

  try {
    if (typeof callAPI !== "function") {
      throw new Error("callAPI tidak tersedia. Pastikan api.js dimuat.");
    }

    const response = await callAPI({
      action: "getSiswa",
      aktifOnly: true,
      forceRefresh: true
    });

    if (!response || response.success === false) {
      throw new Error(response?.message || "Gagal mengambil data siswa.");
    }

    semuaSiswa = ambilArraySiswa(response)
      .map(normalisasiSiswa)
      .filter(siswa => siswa && siswa.id && siswa.nama);

    semuaSiswa.sort((a, b) =>
      a.nama.localeCompare(b.nama, "id", { sensitivity: "base" })
    );

    isiFilterKelas();
    terapkanFilter();
  } catch (error) {
    console.error("ERROR loadSiswa:", error);

    if (container) {
      container.innerHTML = `
        <div class="kartu-empty">
          <i class="fa-solid fa-triangle-exclamation" style="font-size:30px;color:#d71920;margin-bottom:10px"></i>
          <br><strong>Gagal memuat data siswa</strong>
          <br><br>${escapeHTML(error.message || "Terjadi kesalahan.")}
          <br><br>
          <button type="button" onclick="loadSiswa()" style="border:0;padding:9px 15px;border-radius:6px;background:#3b94bd;color:#fff;font-weight:700;cursor:pointer">
            Coba Lagi
          </button>
        </div>
      `;
    }
  }
}

function isiFilterKelas() {
  const select = document.getElementById("kelasFilter");
  if (!select) return;

  const kelas = [...new Set(
    semuaSiswa
      .map(siswa => String(siswa.kelas || "").trim())
      .filter(Boolean)
  )].sort((a, b) =>
    a.localeCompare(b, "id", { numeric: true, sensitivity: "base" })
  );

  select.innerHTML = '<option value="">Semua Kelas</option>';

  kelas.forEach(namaKelas => {
    const option = document.createElement("option");
    option.value = namaKelas;
    option.textContent = namaKelas;
    select.appendChild(option);
  });
}

function terapkanFilter() {
  const search = String(
    document.getElementById("searchInput")?.value || ""
  ).trim().toLowerCase();

  const kelas = String(
    document.getElementById("kelasFilter")?.value || ""
  ).trim().toLowerCase();

  siswaTampil = semuaSiswa.filter(siswa => {
    const nama = String(siswa.nama || "").toLowerCase();
    const nisn = String(siswa.nisn || "").toLowerCase();
    const id = String(siswa.id || "").toLowerCase();
    const kelasSiswa = String(siswa.kelas || "").toLowerCase();

    const cocokSearch =
      !search ||
      nama.includes(search) ||
      nisn.includes(search) ||
      id.includes(search);

    const cocokKelas = !kelas || kelasSiswa === kelas;
    return cocokSearch && cocokKelas;
  });

  renderKartu(siswaTampil);
}

async function cetakKartu() {
  const images = Array.from(document.querySelectorAll("#kartuContainer .qr-image"));

  if (!images.length) {
    window.print();
    return;
  }

  const belumSiap = images.filter(img =>
    img.dataset.qrReady !== "true" ||
    !img.complete ||
    img.naturalWidth === 0
  );

  if (belumSiap.length) {
    const button = document.getElementById("printButton");
    const teksAsli = button?.innerHTML;
    if (button) {
      button.disabled = true;
      button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyiapkan QR...';
    }

    try {
      await Promise.all(images.map(img => {
        if (img.dataset.qrReady === "true" && img.complete && img.naturalWidth > 0) {
          return Promise.resolve();
        }
        return new Promise(resolve => {
          const selesai = () => {
            img.removeEventListener("load", selesai);
            img.removeEventListener("error", selesai);
            resolve();
          };
          img.addEventListener("load", selesai, { once: true });
          img.addEventListener("error", selesai, { once: true });
          setTimeout(selesai, 8000);
        });
      }));

      const gagal = images.filter(img => img.dataset.qrReady !== "true");
      if (gagal.length) {
        throw new Error(`Ada ${gagal.length} QR yang belum berhasil dimuat. Pastikan internet aktif lalu klik Refresh.`);
      }
    } finally {
      if (button) {
        button.disabled = false;
        button.innerHTML = teksAsli || '<i class="fa-solid fa-print"></i> Cetak Kartu';
      }
    }
  }

  window.print();
}

function pasangEventSearch() {
  document.getElementById("searchInput")?.addEventListener(
    "input",
    terapkanFilter
  );

  document.getElementById("kelasFilter")?.addEventListener(
    "change",
    terapkanFilter
  );

  document.getElementById("refreshButton")?.addEventListener(
    "click",
    loadSiswa
  );

  document.getElementById("printButton")?.addEventListener(
    "click",
    () => {
      cetakKartu().catch(error => {
        console.error("CETAK KARTU:", error);
        alert(error.message || "QR belum siap dicetak.");
      });
    }
  );
}

function initKartu() {
  const user = typeof Auth !== "undefined" && Auth.getCurrentUser
    ? Auth.getCurrentUser()
    : null;

  if (!user) {
    location.replace("index.html");
    return;
  }

  if (String(user.role || "").toUpperCase() !== "ADMIN") {
    alert("Halaman Kartu Siswa hanya dapat diakses Administrator.");
    location.replace("dashboard.html");
    return;
  }

  console.log("KARTU.JS FINAL AKTIF");
  console.log("callAPI:", typeof callAPI);
  pasangEventSearch();
  loadSiswa();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initKartu);
} else {
  initKartu();
}

window.loadSiswa = loadSiswa;
window.buatQRCode = buatQRCode;
window.cetakKartu = cetakKartu;
