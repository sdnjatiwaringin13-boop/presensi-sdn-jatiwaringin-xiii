"use strict";

(function () {
  let semuaSiswa = [];
  let siswaTampil = [];
  let presensiHariIni = new Map();
  let user = null;

  const $ = id => document.getElementById(id);

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    user = Auth.requireRole(["ADMIN","GURU"]);
    if (!user) return;
    bindEvents();
    await Promise.all([loadKelas(), loadData()]);
  }

  function bindEvents() {
    $("kelasSelect")?.addEventListener("change", filterSiswa);
    $("searchInput")?.addEventListener("input", filterSiswa);
    $("refreshButton")?.addEventListener("click", loadData);
    $("simpanButton")?.addEventListener("click", simpanSemua);
  }

  async function loadKelas() {
    const select=$("kelasSelect"); if(!select)return;
    try {
      const result = Auth.getRole(user)==="GURU" ? await callAPI({action:"getKelasGuru",idGuru:user.idGuru}) : await callAPI({action:"getKelas"});
      if(!result.success) throw new Error(result.message||"Gagal mengambil kelas.");
      const data=Array.isArray(result.data)?result.data:[];
      select.innerHTML='<option value="">Semua Kelas</option>'+data.map(x=>`<option value="${escapeAttr(x.NAMA_KELAS||"")}">${escapeHTML(x.NAMA_KELAS||"")}</option>`).join("");
    } catch(e) { select.innerHTML='<option value="">Gagal memuat kelas</option>'; }
  }

  async function loadData() {
    const table=$("siswaTable");
    if(table)table.innerHTML='<tr><td colspan="7" class="loading">Memuat data siswa...</td></tr>';
    try {
      const today=localDate();
      const [siswaResult, rekapResult] = await Promise.all([
        callAPI({action:"getSiswa",aktifOnly:true}),
        callAPI({action:"getRekap",tanggal:today,idGuru:Auth.getRole(user)==="GURU"?user.idGuru:""})
      ]);
      if(!siswaResult.success)throw new Error(siswaResult.message||"Gagal mengambil siswa.");
      semuaSiswa=Array.isArray(siswaResult.data)?siswaResult.data:[];
      if(Auth.getRole(user)==="GURU"){
        const k=await callAPI({action:"getKelasGuru",idGuru:user.idGuru});
        const allowed=new Set((k.data||[]).map(x=>String(x.NAMA_KELAS||"")));
        semuaSiswa=semuaSiswa.filter(s=>allowed.has(String(s.KELAS||"")));
      }
      presensiHariIni=new Map();
      (rekapResult.success?rekapResult.data:[]).forEach(x=>presensiHariIni.set(String(x.ID),x));
      filterSiswa();
    } catch(e) {
      if(table)table.innerHTML=`<tr><td colspan="7" class="error">${escapeHTML(e.message)}</td></tr>`;
    }
  }

  function filterSiswa() {
    const kelas=String($("kelasSelect")?.value||"");
    const q=String($("searchInput")?.value||"").toLowerCase().trim();
    siswaTampil=semuaSiswa.filter(s=>(!kelas||String(s.KELAS)===kelas)&&(!q||String(s.NISN||"").toLowerCase().includes(q)||String(s.NAMA||"").toLowerCase().includes(q)));
    renderSiswa();
  }

  function renderSiswa() {
    const table=$("siswaTable"); if(!table)return;
    if(!siswaTampil.length){table.innerHTML='<tr><td colspan="7" class="empty">Tidak ada siswa.</td></tr>';return;}
    table.innerHTML=siswaTampil.map((s,i)=>{
      const id=escapeAttr(s.ID); const existing=presensiHariIni.get(String(s.ID)); const status=existing?.STATUS||"HADIR"; const saved=!!existing;
      return `<tr data-siswa="${id}"><td>${i+1}</td><td>${escapeHTML(s.NISN||"-")}</td><td>${escapeHTML(s.NAMA||"-")}</td><td>${escapeHTML(s.KELAS||"-")}</td><td>${escapeHTML(s.JK||"-")}</td><td><select class="status-presensi" data-id="${id}"><option value="HADIR" ${status==="HADIR"?"selected":""}>Hadir</option><option value="IZIN" ${status==="IZIN"?"selected":""}>Izin</option><option value="SAKIT" ${status==="SAKIT"?"selected":""}>Sakit</option><option value="ALPA" ${status==="ALPA"?"selected":""}>Alpa</option></select></td><td><button type="button" class="btn ${saved?"btn-success":"btn-primary"} btn-sm" data-simpan="${id}">${saved?"Tersimpan":"Simpan"}</button></td></tr>`;
    }).join("");
    table.querySelectorAll("[data-simpan]").forEach(btn=>btn.addEventListener("click",()=>simpanSatu(btn.dataset.simpan,btn)));
  }

  async function simpanSemua() {
    const buttons=Array.from(document.querySelectorAll("[data-simpan]"));
    if(!buttons.length){showMessage("Tidak ada siswa.","error");return;}
    const main=$("simpanButton"); if(main)main.disabled=true;
    let ok=0, fail=0;
    try {
      for(let i=0;i<buttons.length;i+=5){
        const batch=buttons.slice(i,i+5);
        const result=await Promise.all(batch.map(btn=>simpanSatu(btn.dataset.simpan,btn,true)));
        result.forEach(x=>x?ok++:fail++);
      }
      showMessage(`Selesai. Berhasil: ${ok}. Gagal: ${fail}.`,fail?"error":"success");
    } finally { if(main)main.disabled=false; }
  }

  async function simpanSatu(id,button,silent=false) {
    const siswa=semuaSiswa.find(s=>String(s.ID)===String(id)); if(!siswa)return false;
    const row=button?.closest("tr"); const status=row?.querySelector(".status-presensi")?.value||"HADIR";
    try {
      if(button){button.disabled=true;button.textContent="Menyimpan...";}
      const result=await callAPI({action:"simpanPresensi",id:siswa.ID,nisn:siswa.NISN,nama:siswa.NAMA,kelas:siswa.KELAS,status,idGuru:user.idGuru||"",sumber:"MANUAL"});
      if(!result.success)throw new Error(result.message||"Gagal menyimpan presensi.");
      presensiHariIni.set(String(siswa.ID),{ID:siswa.ID,STATUS:status,JAM:new Date().toLocaleTimeString("id-ID")});
      if(button){button.textContent="Tersimpan";button.classList.remove("btn-primary");button.classList.add("btn-success");}
      if(!silent)showMessage(`${siswa.NAMA}: presensi berhasil disimpan.`,"success");
      return true;
    } catch(e) {
      if(button)button.textContent="Gagal";
      if(!silent)showMessage(`${siswa.NAMA}: ${e.message}`,"error");
      return false;
    } finally { setTimeout(()=>{if(button){button.disabled=false;if(button.textContent==="Menyimpan..."||button.textContent==="Gagal")button.textContent="Simpan";}},1200); }
  }

  function showMessage(msg,type){const e=$("presensiMessage");if(!e)return;e.textContent=msg;e.className=`alert alert-${type||"info"}`;e.style.display="block";}
  function localDate(d=new Date()){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");}
})();
