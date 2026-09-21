"use strict";
(function(){
  let semuaSiswa=[];
  const $=id=>document.getElementById(id);
  document.addEventListener("DOMContentLoaded",init);

  async function init(){
    const user=Auth.requireAdmin(); if(!user)return;
    bindEvents(); await loadSiswa();
  }
  function bindEvents(){
    $("searchInput")?.addEventListener("input",renderSiswa);
    $("kelasFilter")?.addEventListener("change",renderSiswa);
    $("refreshButton")?.addEventListener("click",loadSiswa);
    $("printButton")?.addEventListener("click",()=>window.print());
  }
  async function loadSiswa(){
    const box=$("kartuContainer"); if(box)box.innerHTML='<div class="loading">Memuat kartu siswa...</div>';
    try{
      const r=await callAPI({action:"getSiswa",aktifOnly:true});
      if(!r.success)throw new Error(r.message||"Gagal mengambil data siswa.");
      semuaSiswa=Array.isArray(r.data)?r.data:[];
      loadKelasFilter(); renderSiswa();
    }catch(e){if(box)box.innerHTML=`<div class="alert alert-danger">${escapeHTML(e.message)}</div>`;}
  }
  function loadKelasFilter(){
    const s=$("kelasFilter");if(!s)return;
    const kelas=[...new Set(semuaSiswa.map(x=>x.KELAS).filter(Boolean))].sort();
    s.innerHTML='<option value="">Semua Kelas</option>'+kelas.map(k=>`<option value="${escapeAttr(k)}">${escapeHTML(k)}</option>`).join("");
  }
  function renderSiswa(){
    const box=$("kartuContainer");if(!box)return;
    const q=String($("searchInput")?.value||"").toLowerCase().trim();const k=String($("kelasFilter")?.value||"");
    const data=semuaSiswa.filter(s=>(!k||String(s.KELAS)===k)&&(!q||String(s.NISN||"").toLowerCase().includes(q)||String(s.NAMA||"").toLowerCase().includes(q)));
    if(!data.length){box.innerHTML='<div class="empty">Data siswa tidak ditemukan.</div>';return;}
    box.innerHTML=data.map((s,i)=>{
      const uid=`qr_${i}_${String(s.ID).replace(/[^a-zA-Z0-9_-]/g,"")}`;
      return `<article class="student-card"><div class="student-card-head"><div class="school-mark">SD</div><div><strong>SD NEGERI JATIWARINGIN XIII</strong><small>KARTU IDENTITAS SISWA</small></div></div><div class="student-card-body"><div class="student-info"><h3>${escapeHTML(s.NAMA||"-")}</h3><p><b>NISN</b><span>${escapeHTML(s.NISN||"-")}</span></p><p><b>Kelas</b><span>${escapeHTML(s.KELAS||"-")}</span></p><p><b>JK</b><span>${escapeHTML(s.JK||"-")}</span></p><p><b>ID</b><span>${escapeHTML(s.ID||"-")}</span></p></div><div class="qr-wrap"><div class="qr-code" id="${uid}"></div><small>Scan untuk presensi</small></div></div></article>`;
    }).join("");
    data.forEach((s,i)=>createQR(`qr_${i}_${String(s.ID).replace(/[^a-zA-Z0-9_-]/g,"")}`,String(s.ID)));
  }
  function createQR(id,text){
    const el=$(id);if(!el)return;
    if(typeof QRCode!=="undefined"){
      new QRCode(el,{text,width:128,height:128,correctLevel:QRCode.CorrectLevel.H});return;
    }
    const img=document.createElement("img");img.width=128;img.height=128;img.alt="QR";img.loading="lazy";img.src="https://quickchart.io/qr?size=160&text="+encodeURIComponent(text);el.appendChild(img);
  }
  window.loadKartuSiswa=loadSiswa;
})();
