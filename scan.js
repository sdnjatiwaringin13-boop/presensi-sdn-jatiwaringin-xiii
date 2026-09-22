"use strict";

(function () {
  let stream = null;
  let scanning = false;
  let processing = false;
  let user = null;
  let idGuru = "";
  let lastQR = "";
  let lastScanAt = 0;
  let detector = null;
  let frameTimer = null;

  const $ = id => document.getElementById(id);

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    user = typeof getCurrentUser === "function" ? getCurrentUser() : (window.Auth?.getCurrentUser?.() || null);
    if (!user) { location.replace("index.html"); return; }
    const role = String(user.role || "").toUpperCase();
    if (!["ADMIN","GURU"].includes(role)) { location.replace("dashboard.html"); return; }
    idGuru = String(user.idGuru || "");
    showUser();
    $("startCamera")?.addEventListener("click", startCamera);
    $("stopCamera")?.addEventListener("click", stopCamera);

    if ("BarcodeDetector" in window) {
      try {
        const formats = await BarcodeDetector.getSupportedFormats();
        if (formats.includes("qr_code")) detector = new BarcodeDetector({formats:["qr_code"]});
      } catch (_) {}
    }

    // Jika BarcodeDetector tidak tersedia, pastikan jsQR tersedia.
    if (!detector && typeof window.jsQR === "undefined") {
      await loadScriptFallback([
        "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js",
        "https://unpkg.com/jsqr@1.4.0/dist/jsQR.js"
      ]).catch(()=>{});
    }

    setTimeout(startCamera, 200);
  }

  function showUser() {
    if ($("guruNama")) $("guruNama").textContent = user.nama || user.username || "Pengguna";
    if ($("guruRole")) $("guruRole").textContent = String(user.role||"").toUpperCase()==="GURU" ? "Guru / Wali Kelas" : "Administrator";
  }

  async function startCamera() {
    if (scanning) return;
    if (!navigator.mediaDevices?.getUserMedia) { showError("Browser tidak mendukung akses kamera."); return; }
    if (!detector && typeof window.jsQR === "undefined") { showError("Pembaca QR gagal dimuat. Periksa koneksi internet lalu refresh."); return; }

    stopTracks();
    setStatus("Membuka kamera...", "info");
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio:false,
        video:{ facingMode:{ideal:"environment"}, width:{ideal:1280}, height:{ideal:720} }
      });
      const video=$("video");
      if(!video) throw new Error("Elemen video tidak ditemukan.");
      video.srcObject=stream;
      video.muted=true;
      video.playsInline=true;
      await video.play();
      scanning=true;
      processing=false;
      setStatus("Kamera aktif. Arahkan QR kartu siswa ke kotak scanner.","info");
      scanLoop();
    } catch(err) {
      scanning=false;
      const msg = err.name === "NotAllowedError" ? "Izin kamera ditolak. Klik ikon kamera pada address bar lalu pilih Izinkan/Allow." :
                  err.name === "NotFoundError" ? "Kamera tidak ditemukan pada perangkat." : (err.message || "Kamera tidak dapat dibuka.");
      showError(msg);
    }
  }

  async function scanLoop() {
    if (!scanning) return;
    if (processing) { scheduleNext(); return; }
    const video=$("video");
    if(!video || video.readyState < 2 || !video.videoWidth) { scheduleNext(); return; }

    try {
      let raw="";
      if (detector) {
        const codes = await detector.detect(video);
        if (codes?.length) raw=String(codes[0].rawValue||"").trim();
      }
      if (!raw && typeof window.jsQR === "function") raw = readWithJsQR(video);
      if(raw) await handleDecoded(raw);
    } catch(err) {
      console.debug("QR frame:", err);
    }
    scheduleNext();
  }

  function scheduleNext() {
    if (!scanning) return;
    clearTimeout(frameTimer);
    frameTimer=setTimeout(scanLoop, 120);
  }

  function readWithJsQR(video) {
    const canvas=$("scanCanvas");
    if(!canvas) return "";
    const maxW=960;
    const scale=Math.min(1,maxW/video.videoWidth);
    canvas.width=Math.max(1,Math.round(video.videoWidth*scale));
    canvas.height=Math.max(1,Math.round(video.videoHeight*scale));
    const ctx=canvas.getContext("2d",{willReadFrequently:true});
    ctx.drawImage(video,0,0,canvas.width,canvas.height);
    const img=ctx.getImageData(0,0,canvas.width,canvas.height);
    const code=window.jsQR(img.data,img.width,img.height,{inversionAttempts:"attemptBoth"});
    return code?.data ? String(code.data).trim() : "";
  }

  async function handleDecoded(raw) {
    const now=Date.now();
    if(processing) return;
    if(raw===lastQR && now-lastScanAt<5000) return;
    lastQR=raw; lastScanAt=now; processing=true;
    setStatus("QR terbaca. Menyimpan presensi...","info");
    if (navigator.vibrate) navigator.vibrate(80);
    try {
      const result=await callAPI({action:"scanPresensi",qr:raw,idGuru});
      if(!result || result.success!==true) throw new Error(result?.message || "Presensi gagal disimpan.");
      showSuccess(result.data || {});
      setStatus(result.message || "Presensi berhasil dicatat.","success");
      if(navigator.vibrate) navigator.vibrate([70,50,70]);
    } catch(err) {
      showError(err.message || "QR gagal diproses.");
    } finally {
      setTimeout(()=>{ processing=false; }, 1600);
    }
  }

  function showSuccess(data) {
    const box=$("result"); if(!box) return;
    box.innerHTML=`<div class="result-success"><div class="result-success-head"><small><i class="fa-solid fa-circle-check"></i> PRESENSI BERHASIL</small><h3>${escapeHTML(data.nama||data.NAMA||"-")}</h3></div><div class="result-data">
      <div class="result-row"><div class="result-label">NISN</div><div>:</div><div>${escapeHTML(data.nisn||data.NISN||"-")}</div></div>
      <div class="result-row"><div class="result-label">Kelas</div><div>:</div><div>${escapeHTML(data.kelas||data.KELAS||"-")}</div></div>
      <div class="result-row"><div class="result-label">Status</div><div>:</div><div style="color:#16803c;font-weight:800">${escapeHTML(data.status||data.STATUS||"HADIR")}</div></div>
      <div class="result-row"><div class="result-label">Jam</div><div>:</div><div>${escapeHTML(data.jam||data.JAM||"-")}</div></div>
    </div></div>`;
  }

  function stopCamera() {
    scanning=false; processing=false; clearTimeout(frameTimer); stopTracks();
    const video=$("video"); if(video) video.srcObject=null;
    setStatus("Kamera dihentikan.","warning");
  }

  function stopTracks() {
    if(stream) stream.getTracks().forEach(t=>t.stop());
    stream=null;
  }

  function setStatus(message,type) {
    const el=$("scanStatus"); if(!el) return;
    el.className="scan-status";
    if(["success","error","warning"].includes(type)) el.classList.add(type);
    el.textContent=message;
  }

  function showError(message) {
    setStatus(message,"error");
    const box=$("result");
    if(box) box.innerHTML=`<div style="padding:25px 15px;text-align:center;color:#b42318"><i class="fa-solid fa-circle-exclamation" style="font-size:38px;margin-bottom:12px"></i><br><strong>Presensi Gagal</strong><br><br>${escapeHTML(message)}</div>`;
  }

  function loadScriptFallback(urls) {
    return new Promise((resolve,reject)=>{
      let i=0;
      const next=()=>{
        if(typeof window.jsQR === "function") return resolve();
        if(i>=urls.length) return reject(new Error("jsQR gagal dimuat"));
        const s=document.createElement("script"); s.src=urls[i++]; s.async=true;
        s.onload=()=> typeof window.jsQR === "function" ? resolve() : next();
        s.onerror=next; document.head.appendChild(s);
      };
      next();
    });
  }

  window.addEventListener("beforeunload",stopTracks);
})();
