"use strict";

(function () {
  let user = null;
  let siswaData = [];
  let presensiHariIni = [];

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    user = Auth.requireLogin();
    if (!user) return;
    setText("dashboardUserName", user.nama || user.username || "Pengguna");
    updateDate();
    if (window.__dashboardClock) clearInterval(window.__dashboardClock);
    window.__dashboardClock = setInterval(updateDate, 1000);
    bindSearch();
    await loadDashboard();
  }

  async function loadDashboard() {
    const role = Auth.getRole(user);
    const today = localDate();
    const idGuru = role === "GURU" ? String(user.idGuru || "") : "";

    try {
      const requests = [
        callAPI({ action:"getSiswa", aktifOnly:true }),
        callAPI({ action:"getRekap", tanggal:today, idGuru })
      ];
      if (role === "ADMIN") {
        requests.push(callAPI({ action:"getGuru" }), callAPI({ action:"getKelas" }));
      } else {
        requests.push(callAPI({ action:"getKelasGuru", idGuru }));
      }

      const results = await Promise.all(requests);
      const siswaResult = results[0];
      const rekapResult = results[1];
      const third = results[2];
      const fourth = results[3];

      siswaData = siswaResult.success && Array.isArray(siswaResult.data) ? siswaResult.data : [];
      presensiHariIni = rekapResult.success && Array.isArray(rekapResult.data) ? rekapResult.data : [];

      let guruCount = 0;
      let kelasData = [];
      if (role === "ADMIN") {
        guruCount = third.success && Array.isArray(third.data) ? third.data.length : 0;
        kelasData = fourth.success && Array.isArray(fourth.data) ? fourth.data : [];
      } else {
        kelasData = third.success && Array.isArray(third.data) ? third.data : [];
        const allowed = new Set(kelasData.map(x => String(x.NAMA_KELAS || "")));
        siswaData = siswaData.filter(s => allowed.has(String(s.KELAS || "")));
        guruCount = 1;
      }

      setText("totalSiswa", siswaData.length);
      setText("totalGuru", guruCount);
      setText("totalKelas", kelasData.length);
      renderStats();
      renderSudah();
      renderBelum();
    } catch (error) {
      setTableError("tableSudahBody", 5, error.message);
      setTableError("tableBelumBody", 4, error.message);
    }
  }

  function renderStats() {
    const hadir = count("HADIR"), izin = count("IZIN"), sakit = count("SAKIT"), alpa = count("ALPA");
    const sudah = new Set(presensiHariIni.map(x => String(x.ID || "")));
    const belum = siswaData.filter(s => !sudah.has(String(s.ID || ""))).length;
    setText("totalHadir", hadir); setText("totalIzin", izin); setText("totalSakit", sakit); setText("totalAlpa", alpa); setText("totalBelumAbsen", belum);
    const total = hadir + izin + sakit + alpa;
    setText("rekapHadir", hadir); setText("rekapIzin", izin); setText("rekapSakit", sakit); setText("rekapAlpa", alpa);
    setText("persenHadir", pct(hadir,total)); setText("persenIzin", pct(izin,total)); setText("persenSakit", pct(sakit,total)); setText("persenAlpa", pct(alpa,total));
  }

  function renderSudah() {
    const tbody = document.getElementById("tableSudahBody"); if (!tbody) return;
    if (!presensiHariIni.length) { tbody.innerHTML='<tr><td colspan="5" class="empty">Belum ada presensi hari ini.</td></tr>'; return; }
    tbody.innerHTML = presensiHariIni.map((x,i)=>`<tr><td>${i+1}</td><td>${escapeHTML(x.NISN||"-")}</td><td>${escapeHTML(x.NAMA||"-")}</td><td><span class="badge badge-${String(x.STATUS||"").toLowerCase()}">${escapeHTML(x.STATUS||"-")}</span></td><td>${escapeHTML(x.JAM||"-")}</td></tr>`).join("");
  }

  function renderBelum() {
    const tbody = document.getElementById("tableBelumBody"); if (!tbody) return;
    const ids = new Set(presensiHariIni.map(x=>String(x.ID||"")));
    const data = siswaData.filter(s=>!ids.has(String(s.ID||"")));
    if (!data.length) { tbody.innerHTML='<tr><td colspan="4" class="empty">Semua siswa sudah presensi.</td></tr>'; return; }
    tbody.innerHTML = data.map((s,i)=>`<tr><td>${i+1}</td><td>${escapeHTML(s.NISN||"-")}</td><td>${escapeHTML(s.NAMA||"-")}</td><td>${escapeHTML(s.KELAS||"-")}</td></tr>`).join("");
  }

  function bindSearch() {
    document.getElementById("searchSudah")?.addEventListener("input", e=>filterTable("tableSudah",e.target.value));
    document.getElementById("searchBelum")?.addEventListener("input", e=>filterTable("tableBelum",e.target.value));
  }

  function filterTable(id, keyword) {
    const table = document.getElementById(id); if (!table) return;
    const q = String(keyword||"").toLowerCase().trim();
    table.querySelectorAll("tbody tr").forEach(row=>row.style.display=row.textContent.toLowerCase().includes(q)?"":"none");
  }

  function count(status) { return presensiHariIni.filter(x=>String(x.STATUS||"").toUpperCase()===status).length; }
  function pct(n,t) { return t ? ((n/t)*100).toFixed(1)+"%" : "0%"; }
  function localDate(d=new Date()) { return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-"); }
  function updateDate() { const d=new Date(); setText("dashboardDate", new Intl.DateTimeFormat("id-ID",{weekday:"long",day:"2-digit",month:"long",year:"numeric"}).format(d)); }
  function setText(id,value){const e=document.getElementById(id);if(e)e.textContent=value??"";}
  function setTableError(id,colspan,message){const e=document.getElementById(id);if(e)e.innerHTML=`<tr><td colspan="${colspan}" class="error">${escapeHTML(message)}</td></tr>`;}
})();
