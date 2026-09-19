const API_URL = "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";

let guruData = [];

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("presensiUser") || "null");
  } catch (e) {
    return null;
  }
}

function ensureAdmin() {
  const user = getUser();
  if (!user || user.role !== "ADMIN") {
    alert("Akses hanya untuk ADMIN.");
    location.href = "index.html";
    return false;
  }
  return true;
}

async function callAPI(payload) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  });
  const text = await response.text();
  let result;
  try { result = JSON.parse(text); }
  catch (e) { throw new Error("Respons API bukan JSON: " + text.substring(0, 200)); }
  return result;
}

async function loadGuru() {
  const result = await callAPI({ action: "getGuru" });
  if (!result.success) throw new Error(result.message || "Gagal mengambil data guru.");
  guruData = result.data || [];
  renderGuru();
}

function renderGuru() {
  const tbody = document.getElementById("guruTable");
  const q = document.getElementById("searchInput").value.trim().toLowerCase();
  const status = document.getElementById("statusFilter").value;

  const filtered = guruData.filter(g => {
    const matchText = !q ||
      String(g.NAMA || "").toLowerCase().includes(q) ||
      String(g.NIP || "").toLowerCase().includes(q) ||
      String(g.ID_GURU || "").toLowerCase().includes(q);
    const matchStatus = !status || String(g.STATUS || "").toUpperCase() === status;
    return matchText && matchStatus;
  });

  document.getElementById("guruCount").textContent =
    `Total guru: ${guruData.length} | Ditampilkan: ${filtered.length}`;

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Data tidak ditemukan.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map((g, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${escapeHtml(g.ID_GURU)}</td>
      <td>${escapeHtml(g.NIP)}</td>
      <td>${escapeHtml(g.NAMA)}</td>
      <td>${escapeHtml(g.EMAIL)}</td>
      <td><span class="status-badge">${escapeHtml(g.STATUS)}</span></td>
      <td class="action-buttons">
        <button class="edit-button" onclick="editGuru('${escapeAttr(g.ID_GURU)}')">Edit</button>
        <button class="delete-button" onclick="deleteGuru('${escapeAttr(g.ID_GURU)}')">Hapus</button>
      </td>
    </tr>
  `).join("");
}

function openForm() {
  document.getElementById("guruForm").classList.remove("hidden");
  document.getElementById("editMode").value = "tambah";
  document.getElementById("idGuru").disabled = false;
  document.getElementById("guruForm").reset();
  document.getElementById("status").value = "AKTIF";
  document.getElementById("idGuru").focus();
}

function editGuru(id) {
  const g = guruData.find(x => String(x.ID_GURU).trim() === String(id).trim());
  if (!g) return alert("Data guru tidak ditemukan.");

  document.getElementById("guruForm").classList.remove("hidden");
  document.getElementById("editMode").value = "edit";
  document.getElementById("idGuru").value = g.ID_GURU || "";
  document.getElementById("idGuru").disabled = true;
  document.getElementById("nip").value = g.NIP || "";
  document.getElementById("nama").value = g.NAMA || "";
  document.getElementById("email").value = g.EMAIL || "";
  document.getElementById("status").value = g.STATUS || "AKTIF";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteGuru(id) {
  if (!confirm("Hapus guru dengan ID " + id + "?")) return;
  try {
    const result = await callAPI({ action: "hapusGuru", idGuru: id });
    if (!result.success) throw new Error(result.message || "Gagal menghapus guru.");
    alert(result.message);
    await loadGuru();
  } catch (e) {
    alert("Gagal: " + e.message);
  }
}

document.getElementById("guruForm").addEventListener("submit", async e => {
  e.preventDefault();
  const mode = document.getElementById("editMode").value;
  const payload = {
    action: mode === "edit" ? "updateGuru" : "tambahGuru",
    idGuru: document.getElementById("idGuru").value.trim(),
    nip: document.getElementById("nip").value.trim(),
    nama: document.getElementById("nama").value.trim(),
    email: document.getElementById("email").value.trim(),
    status: document.getElementById("status").value
  };

  try {
    const result = await callAPI(payload);
    if (!result.success) throw new Error(result.message || "Gagal menyimpan guru.");
    alert(result.message);
    document.getElementById("guruForm").classList.add("hidden");
    await loadGuru();
  } catch (e) {
    alert("Gagal: " + e.message);
  }
});

document.getElementById("addButton").addEventListener("click", openForm);
document.getElementById("cancelButton").addEventListener("click", () => document.getElementById("guruForm").classList.add("hidden"));
document.getElementById("refreshButton").addEventListener("click", async () => {
  try { await loadGuru(); } catch (e) { alert("Gagal: " + e.message); }
});
document.getElementById("searchInput").addEventListener("input", renderGuru);
document.getElementById("statusFilter").addEventListener("change", renderGuru);
document.getElementById("logoutButton").addEventListener("click", () => {
  localStorage.removeItem("presensiUser");
  location.href = "index.html";
});

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}
function escapeAttr(value) { return escapeHtml(value); }

if (ensureAdmin()) {
  loadGuru().catch(e => alert("Gagal memuat data guru: " + e.message));
}
