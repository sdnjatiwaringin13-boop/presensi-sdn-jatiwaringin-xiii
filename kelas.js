const API_URL = "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";

let kelasData = [];
let guruData = [];

function getUser() {
  try { return JSON.parse(localStorage.getItem("presensiUser") || "null"); }
  catch (e) { return null; }
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
async function loadData() {
  const [kelasResult, guruResult] = await Promise.all([
    callAPI({ action: "getKelas" }),
    callAPI({ action: "getGuru" })
  ]);
  if (!kelasResult.success) throw new Error(kelasResult.message || "Gagal mengambil kelas.");
  if (!guruResult.success) throw new Error(guruResult.message || "Gagal mengambil guru.");
  kelasData = kelasResult.data || [];
  guruData = guruResult.data || [];
  fillGuruSelect();
  renderKelas();
}
function fillGuruSelect() {
  const select = document.getElementById("idGuru");
  const current = select.value;
  select.innerHTML = '<option value="">-- Pilih Guru --</option>' +
    guruData.map(g => `<option value="${escapeAttr(g.ID_GURU)}">${escapeHtml(g.ID_GURU)} - ${escapeHtml(g.NAMA)}</option>`).join("");
  if (current) select.value = current;
}
function guruName(id) {
  const g = guruData.find(x => String(x.ID_GURU).trim() === String(id || "").trim());
  return g ? g.NAMA : (id || "-");
}
function renderKelas() {
  const tbody = document.getElementById("kelasTable");
  const q = document.getElementById("searchInput").value.trim().toLowerCase();
  const status = document.getElementById("statusFilter").value;
  const filtered = kelasData.filter(k => {
    const wali = guruName(k.ID_GURU);
    const matchText = !q ||
      String(k.ID_KELAS || "").toLowerCase().includes(q) ||
      String(k.NAMA_KELAS || "").toLowerCase().includes(q) ||
      String(wali).toLowerCase().includes(q);
    const matchStatus = !status || String(k.STATUS || "").toUpperCase() === status;
    return matchText && matchStatus;
  });
  document.getElementById("kelasCount").textContent =
    `Total kelas: ${kelasData.length} | Ditampilkan: ${filtered.length}`;
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Data tidak ditemukan.</td></tr>';
    return;
  }
  tbody.innerHTML = filtered.map((k, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${escapeHtml(k.ID_KELAS)}</td>
      <td>${escapeHtml(k.NAMA_KELAS)}</td>
      <td>${escapeHtml(guruName(k.ID_GURU))}</td>
      <td>${escapeHtml(k.TAHUN_AJARAN)}</td>
      <td><span class="status-badge">${escapeHtml(k.STATUS)}</span></td>
      <td class="action-buttons">
        <button class="edit-button" onclick="editKelas('${escapeAttr(k.ID_KELAS)}')">Edit</button>
        <button class="delete-button" onclick="deleteKelas('${escapeAttr(k.ID_KELAS)}')">Hapus</button>
      </td>
    </tr>
  `).join("");
}
function openForm() {
  document.getElementById("kelasForm").classList.remove("hidden");
  document.getElementById("editMode").value = "tambah";
  document.getElementById("idKelas").disabled = false;
  document.getElementById("kelasForm").reset();
  document.getElementById("status").value = "AKTIF";
  fillGuruSelect();
}
function editKelas(id) {
  const k = kelasData.find(x => String(x.ID_KELAS).trim() === String(id).trim());
  if (!k) return alert("Data kelas tidak ditemukan.");
  document.getElementById("kelasForm").classList.remove("hidden");
  document.getElementById("editMode").value = "edit";
  document.getElementById("idKelas").value = k.ID_KELAS || "";
  document.getElementById("idKelas").disabled = true;
  document.getElementById("namaKelas").value = k.NAMA_KELAS || "";
  document.getElementById("idGuru").value = k.ID_GURU || "";
  document.getElementById("tahunAjaran").value = k.TAHUN_AJARAN || "";
  document.getElementById("status").value = k.STATUS || "AKTIF";
  window.scrollTo({ top: 0, behavior: "smooth" });
}
async function deleteKelas(id) {
  if (!confirm("Hapus kelas dengan ID " + id + "?")) return;
  try {
    const result = await callAPI({ action: "hapusKelas", idKelas: id });
    if (!result.success) throw new Error(result.message || "Gagal menghapus kelas.");
    alert(result.message);
    await loadData();
  } catch (e) { alert("Gagal: " + e.message); }
}
document.getElementById("kelasForm").addEventListener("submit", async e => {
  e.preventDefault();
  const mode = document.getElementById("editMode").value;
  const payload = {
    action: mode === "edit" ? "updateKelas" : "tambahKelas",
    idKelas: document.getElementById("idKelas").value.trim(),
    namaKelas: document.getElementById("namaKelas").value.trim(),
    idGuru: document.getElementById("idGuru").value.trim(),
    tahunAjaran: document.getElementById("tahunAjaran").value.trim(),
    status: document.getElementById("status").value
  };
  try {
    const result = await callAPI(payload);
    if (!result.success) throw new Error(result.message || "Gagal menyimpan kelas.");
    alert(result.message);
    document.getElementById("kelasForm").classList.add("hidden");
    await loadData();
  } catch (e) { alert("Gagal: " + e.message); }
});
document.getElementById("addButton").addEventListener("click", openForm);
document.getElementById("cancelButton").addEventListener("click", () => document.getElementById("kelasForm").classList.add("hidden"));
document.getElementById("refreshButton").addEventListener("click", async () => {
  try { await loadData(); } catch (e) { alert("Gagal: " + e.message); }
});
document.getElementById("searchInput").addEventListener("input", renderKelas);
document.getElementById("statusFilter").addEventListener("change", renderKelas);
document.getElementById("logoutButton").addEventListener("click", () => {
  localStorage.removeItem("presensiUser");
  location.href = "index.html";
});
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}
function escapeAttr(value) { return escapeHtml(value); }

if (ensureAdmin()) {
  loadData().catch(e => alert("Gagal memuat data: " + e.message));
}
