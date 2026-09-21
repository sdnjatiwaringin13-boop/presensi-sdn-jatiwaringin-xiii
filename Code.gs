const SS = SpreadsheetApp.getActiveSpreadsheet();

const CONFIG = {
  TIMEZONE: 'Asia/Jakarta',
  SHEET_USERS: 'USERS',
  SHEET_GURU: 'GURU',
  SHEET_KELAS: 'KELAS',
  SHEET_SISWA: 'SISWA',
  SHEET_PRESENSI: 'PRESENSI',
  SHEET_PENGATURAN: 'PENGATURAN'
};

const HEADERS = {
  USERS: ['USERNAME','PASSWORD','ROLE','ID_USER','ID_GURU','STATUS'],
  GURU: ['ID_GURU','NIP','NAMA','EMAIL','STATUS'],
  KELAS: ['ID_KELAS','NAMA_KELAS','ID_GURU','TAHUN_AJARAN','STATUS'],
  SISWA: ['ID','NISN','NAMA','KELAS','JK','STATUS'],
  PRESENSI: ['ID_PRESENSI','TANGGAL','JAM','ID','NISN','NAMA','KELAS','STATUS','SUMBER','ID_GURU'],
  PENGATURAN: ['KEY','VALUE']
};

function doGet() {
  return json({ success: true, message: 'API Presensi aktif.' });
}

function doPost(e) {
  try {
    const payload = parsePayload(e);
    const action = String(payload.action || '').trim();
    if (!action) return json({ success:false, message:'Action tidak ditemukan.' });

    switch (action) {
      case 'login': return json(login(payload));
      case 'getSiswa': return json(getSiswa(payload));
      case 'tambahSiswa': return json(tambahSiswa(payload));
      case 'updateSiswa': return json(updateSiswa(payload));
      case 'hapusSiswa': return json(hapusSiswa(payload));
      case 'getGuru': return json(getGuru(payload));
      case 'tambahGuru': return json(tambahGuru(payload));
      case 'updateGuru': return json(updateGuru(payload));
      case 'hapusGuru': return json(hapusGuru(payload));
      case 'getKelas': return json(getKelas(payload));
      case 'getKelasGuru': return json(getKelasGuru(payload));
      case 'tambahKelas': return json(tambahKelas(payload));
      case 'updateKelas': return json(updateKelas(payload));
      case 'hapusKelas': return json(hapusKelas(payload));
      case 'simpanPresensi': return json(simpanPresensi(payload));
      case 'getRekap': return json(getRekap(payload));
      case 'getRekapPresensi': return json(getRekap(payload));
      case 'getAbsenBulanan': return json(getAbsenBulanan(payload));
      case 'getPengaturan': return json(getPengaturan(payload));
      case 'simpanPengaturan': return json(simpanPengaturan(payload));
      case 'setupSheet': return json(setupSheet());
      default: return json({ success:false, message:'Action tidak dikenal: ' + action });
    }
  } catch (err) {
    console.error(err);
    return json({ success:false, message: err.message || String(err) });
  }
}

function parsePayload(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  try { return JSON.parse(e.postData.contents); }
  catch (_) { return e.parameter || {}; }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function sheet(name) {
  const sh = SS.getSheetByName(name);
  if (!sh) throw new Error('Sheet ' + name + ' tidak ditemukan. Jalankan setupSheet().');
  return sh;
}

function values(name) {
  const sh = sheet(name);
  const last = sh.getLastRow();
  if (last < 2) return [];
  const data = sh.getRange(1,1,last,sh.getLastColumn()).getValues();
  const headers = data.shift().map(String);
  return data.map(row => {
    const obj = {};
    headers.forEach((h,i) => obj[h] = row[i] instanceof Date ? Utilities.formatDate(row[i], CONFIG.TIMEZONE, 'yyyy-MM-dd') : row[i]);
    return obj;
  });
}

function rowObjects(name) {
  return values(name);
}

function append(name, obj, headers) {
  sheet(name).appendRow(headers.map(h => obj[h] == null ? '' : obj[h]));
}

function findRow(name, keyHeader, key) {
  const sh = sheet(name);
  const last = sh.getLastRow();
  if (last < 2) return -1;
  const col = headerIndex(sh, keyHeader);
  const vals = sh.getRange(2,col,last-1,1).getValues();
  const target = String(key);
  for (let i=0;i<vals.length;i++) if (String(vals[i][0]) === target) return i + 2;
  return -1;
}

function headerIndex(sh, header) {
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);
  const i = headers.indexOf(header);
  if (i < 0) throw new Error('Kolom ' + header + ' tidak ditemukan di ' + sh.getName());
  return i + 1;
}

function updateRow(name, keyHeader, key, obj, headers) {
  const sh = sheet(name);
  const row = findRow(name,keyHeader,key);
  if (row < 0) throw new Error('Data tidak ditemukan: ' + key);
  sh.getRange(row,1,1,headers.length).setValues([headers.map(h => obj[h] == null ? '' : obj[h])]);
}

function login(p) {
  const username = String(p.username || '').trim();
  const password = String(p.password || '');
  if (!username || !password) return { success:false, message:'Username dan password wajib diisi.' };
  const users = values(CONFIG.SHEET_USERS);
  const u = users.find(x => String(x.USERNAME).trim() === username && String(x.PASSWORD) === password);
  if (!u) return { success:false, message:'Username atau password salah.' };
  if (String(u.STATUS || 'AKTIF').toUpperCase() !== 'AKTIF') return { success:false, message:'Akun tidak aktif.' };
  let nama = username;
  if (u.ID_GURU) {
    const g = values(CONFIG.SHEET_GURU).find(x => String(x.ID_GURU) === String(u.ID_GURU));
    if (g) nama = g.NAMA || nama;
  }
  return { success:true, message:'Login berhasil.', user:{ idUser:u.ID_USER||'', username:u.USERNAME||username, role:String(u.ROLE||'').toUpperCase(), idGuru:u.ID_GURU||'', nama } };
}

function getSiswa(p) {
  let data = values(CONFIG.SHEET_SISWA);
  if (p.aktifOnly === true || String(p.aktifOnly).toLowerCase() === 'true') data = data.filter(x => String(x.STATUS||'AKTIF').toUpperCase() === 'AKTIF');
  return { success:true, data };
}

function getGuru() {
  return { success:true, data:values(CONFIG.SHEET_GURU) };
}

function getKelas() {
  return { success:true, data:values(CONFIG.SHEET_KELAS) };
}

function getKelasGuru(p) {
  const idGuru = String(p.idGuru || '').trim();
  return { success:true, data:values(CONFIG.SHEET_KELAS).filter(x => String(x.ID_GURU) === idGuru && String(x.STATUS||'AKTIF').toUpperCase() === 'AKTIF') };
}

function tambahSiswa(p) {
  const obj = {ID:String(p.id||'').trim(),NISN:String(p.nisn||'').trim(),NAMA:String(p.nama||'').trim(),KELAS:String(p.kelas||'').trim(),JK:String(p.jk||'').trim(),STATUS:String(p.status||'AKTIF').toUpperCase()};
  if (!obj.ID || !obj.NAMA || !obj.NISN || !obj.KELAS) return {success:false,message:'ID, NISN, nama, dan kelas wajib diisi.'};
  if (findRow(CONFIG.SHEET_SISWA,'ID',obj.ID) > 0) return {success:false,message:'ID siswa sudah digunakan.'};
  append(CONFIG.SHEET_SISWA,obj,HEADERS.SISWA);
  return {success:true,message:'Data siswa berhasil ditambahkan.',data:obj};
}

function updateSiswa(p) {
  const obj = {ID:String(p.id||'').trim(),NISN:String(p.nisn||'').trim(),NAMA:String(p.nama||'').trim(),KELAS:String(p.kelas||'').trim(),JK:String(p.jk||'').trim(),STATUS:String(p.status||'AKTIF').toUpperCase()};
  updateRow(CONFIG.SHEET_SISWA,'ID',obj.ID,obj,HEADERS.SISWA);
  return {success:true,message:'Data siswa berhasil diperbarui.',data:obj};
}

function hapusSiswa(p) {
  const row = findRow(CONFIG.SHEET_SISWA,'ID',String(p.id||''));
  if (row < 0) return {success:false,message:'Data siswa tidak ditemukan.'};
  sheet(CONFIG.SHEET_SISWA).deleteRow(row);
  return {success:true,message:'Data siswa berhasil dihapus.'};
}

function tambahGuru(p) {
  const obj = {ID_GURU:String(p.ID_GURU||p.idGuru||'').trim(),NIP:String(p.NIP||p.nip||'').trim(),NAMA:String(p.NAMA||p.nama||'').trim(),EMAIL:String(p.EMAIL||p.email||'').trim(),STATUS:String(p.STATUS||p.status||'AKTIF').toUpperCase()};
  if (!obj.ID_GURU || !obj.NAMA) return {success:false,message:'ID Guru dan nama wajib diisi.'};
  if (findRow(CONFIG.SHEET_GURU,'ID_GURU',obj.ID_GURU) > 0) return {success:false,message:'ID Guru sudah digunakan.'};
  append(CONFIG.SHEET_GURU,obj,HEADERS.GURU);
  return {success:true,message:'Data guru berhasil ditambahkan.',data:obj};
}

function updateGuru(p) {
  const obj = {ID_GURU:String(p.ID_GURU||p.idGuru||'').trim(),NIP:String(p.NIP||p.nip||'').trim(),NAMA:String(p.NAMA||p.nama||'').trim(),EMAIL:String(p.EMAIL||p.email||'').trim(),STATUS:String(p.STATUS||p.status||'AKTIF').toUpperCase()};
  updateRow(CONFIG.SHEET_GURU,'ID_GURU',obj.ID_GURU,obj,HEADERS.GURU);
  return {success:true,message:'Data guru berhasil diperbarui.',data:obj};
}

function hapusGuru(p) {
  const row = findRow(CONFIG.SHEET_GURU,'ID_GURU',String(p.ID_GURU||p.idGuru||''));
  if (row < 0) return {success:false,message:'Data guru tidak ditemukan.'};
  sheet(CONFIG.SHEET_GURU).deleteRow(row);
  return {success:true,message:'Data guru berhasil dihapus.'};
}

function tambahKelas(p) {
  const obj = {ID_KELAS:String(p.ID_KELAS||p.idKelas||'').trim(),NAMA_KELAS:String(p.NAMA_KELAS||p.namaKelas||'').trim(),ID_GURU:String(p.ID_GURU||p.idGuru||'').trim(),TAHUN_AJARAN:String(p.TAHUN_AJARAN||p.tahunAjaran||'').trim(),STATUS:String(p.STATUS||p.status||'AKTIF').toUpperCase()};
  if (!obj.ID_KELAS || !obj.NAMA_KELAS || !obj.ID_GURU) return {success:false,message:'ID kelas, nama kelas, dan guru wajib diisi.'};
  if (findRow(CONFIG.SHEET_KELAS,'ID_KELAS',obj.ID_KELAS) > 0) return {success:false,message:'ID Kelas sudah digunakan.'};
  append(CONFIG.SHEET_KELAS,obj,HEADERS.KELAS);
  return {success:true,message:'Data kelas berhasil ditambahkan.',data:obj};
}

function updateKelas(p) {
  const obj = {ID_KELAS:String(p.ID_KELAS||p.idKelas||'').trim(),NAMA_KELAS:String(p.NAMA_KELAS||p.namaKelas||'').trim(),ID_GURU:String(p.ID_GURU||p.idGuru||'').trim(),TAHUN_AJARAN:String(p.TAHUN_AJARAN||p.tahunAjaran||'').trim(),STATUS:String(p.STATUS||p.status||'AKTIF').toUpperCase()};
  updateRow(CONFIG.SHEET_KELAS,'ID_KELAS',obj.ID_KELAS,obj,HEADERS.KELAS);
  return {success:true,message:'Data kelas berhasil diperbarui.',data:obj};
}

function hapusKelas(p) {
  const row = findRow(CONFIG.SHEET_KELAS,'ID_KELAS',String(p.ID_KELAS||p.idKelas||''));
  if (row < 0) return {success:false,message:'Data kelas tidak ditemukan.'};
  sheet(CONFIG.SHEET_KELAS).deleteRow(row);
  return {success:true,message:'Data kelas berhasil dihapus.'};
}

function simpanPresensi(p) {
  const status = String(p.status||'').trim().toUpperCase();
  if (!['HADIR','SAKIT','IZIN','ALPA'].includes(status)) return {success:false,message:'Status presensi tidak valid.'};
  const id = String(p.id||'').trim();
  if (!id) return {success:false,message:'ID siswa tidak ditemukan.'};

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = sheet(CONFIG.SHEET_PRESENSI);
    const now = new Date();
    const tanggal = Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyy-MM-dd');
    const jam = Utilities.formatDate(now, CONFIG.TIMEZONE, 'HH:mm:ss');
    const data = values(CONFIG.SHEET_PRESENSI);
    const existingIndex = data.findIndex(x => String(x.ID) === id && normalizeDate(x.TANGGAL) === tanggal);
    const obj = {
      ID_PRESENSI: existingIndex >= 0 ? data[existingIndex].ID_PRESENSI : ('PRS-' + Utilities.getUuid().slice(0,8).toUpperCase()),
      TANGGAL: tanggal,
      JAM: jam,
      ID: id,
      NISN: String(p.nisn||''),
      NAMA: String(p.nama||''),
      KELAS: String(p.kelas||''),
      STATUS: status,
      SUMBER: String(p.sumber||'MANUAL').toUpperCase(),
      ID_GURU: String(p.idGuru||'')
    };
    if (existingIndex >= 0) {
      const row = existingIndex + 2;
      sh.getRange(row,1,1,HEADERS.PRESENSI.length).setValues([HEADERS.PRESENSI.map(h=>obj[h])]);
      return {success:true,message:'Presensi diperbarui.',updated:true,data:obj};
    }
    sh.appendRow(HEADERS.PRESENSI.map(h=>obj[h]));
    return {success:true,message:'Presensi berhasil disimpan.',created:true,data:obj};
  } finally {
    lock.releaseLock();
  }
}

function getRekap(p) {
  let data = values(CONFIG.SHEET_PRESENSI);
  const tanggal = String(p.tanggal||'').trim();
  const kelas = String(p.kelas||'').trim();
  const idGuru = String(p.idGuru||'').trim();
  if (tanggal) data = data.filter(x => normalizeDate(x.TANGGAL) === tanggal);
  if (kelas) data = data.filter(x => String(x.KELAS) === kelas);
  if (idGuru) data = data.filter(x => String(x.ID_GURU) === idGuru);
  return {success:true,data};
}

function normalizeDate(v) {
  if (v instanceof Date) return Utilities.formatDate(v,CONFIG.TIMEZONE,'yyyy-MM-dd');
  const s = String(v||'');
  return s.length >= 10 ? s.slice(0,10) : s;
}

function getAbsenBulanan(p) {
  const idGuru = String(p.idGuru||'').trim();
  const bulan = Number(p.bulan);
  const tahun = Number(p.tahun);
  if (!idGuru || !bulan || !tahun) return {success:false,message:'Guru, bulan, dan tahun wajib diisi.'};

  const kelasData = values(CONFIG.SHEET_KELAS).filter(x => String(x.ID_GURU) === idGuru && String(x.STATUS||'AKTIF').toUpperCase()==='AKTIF');
  const kelasNames = kelasData.map(x=>String(x.NAMA_KELAS));
  const siswa = values(CONFIG.SHEET_SISWA).filter(x => String(x.STATUS||'AKTIF').toUpperCase()==='AKTIF' && kelasNames.includes(String(x.KELAS)));
  const presensi = values(CONFIG.SHEET_PRESENSI).filter(x => {
    const d = normalizeDate(x.TANGGAL);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
    const parts = d.split('-');
    return Number(parts[0])===tahun && Number(parts[1])===bulan && (String(x.ID_GURU)===idGuru || kelasNames.includes(String(x.KELAS)));
  });

  const byId = {};
  presensi.forEach(x => {
    const day = Number(normalizeDate(x.TANGGAL).slice(8,10));
    if (!byId[x.ID]) byId[x.ID] = {};
    byId[x.ID][day] = x.STATUS;
  });

  const jumlahHari = new Date(tahun, bulan, 0).getDate();
  const siswaOut = siswa.map(x => ({ id:x.ID, nisn:x.NISN, nama:x.NAMA, hari:byId[x.ID] || {} }));
  const guru = values(CONFIG.SHEET_GURU).find(x=>String(x.ID_GURU)===idGuru) || {};
  const settings = getPengaturan({}).data || {};
  const kelas = kelasData[0] || {};
  return {success:true,data:{sekolah:{nama:settings.namaSekolah||'SD Negeri Jatiwaringin XIII'},kelas:{nama:kelasNames.join(', ')||kelas.NAMA_KELAS||'-'},guru:{nama:guru.NAMA||'-',nip:guru.NIP||'-'},kepalaSekolah:{nama:settings.namaKepalaSekolah||'-',nip:settings.nipKepalaSekolah||'-'},bulan,tahun,jumlahHari,siswa:siswaOut}};
}

function getPengaturan() {
  const rows = values(CONFIG.SHEET_PENGATURAN);
  const data = {};
  rows.forEach(x => { if (x.KEY) data[String(x.KEY)] = x.VALUE; });
  return {success:true,data:{namaSekolah:data.namaSekolah||'SD Negeri Jatiwaringin XIII',namaKepalaSekolah:data.namaKepalaSekolah||'',nipKepalaSekolah:data.nipKepalaSekolah||''}};
}

function simpanPengaturan(p) {
  const sh = sheet(CONFIG.SHEET_PENGATURAN);
  const map = {namaSekolah:String(p.namaSekolah||'').trim(),namaKepalaSekolah:String(p.namaKepalaSekolah||'').trim(),nipKepalaSekolah:String(p.nipKepalaSekolah||'').trim()};
  Object.keys(map).forEach(key => {
    const row = findRow(CONFIG.SHEET_PENGATURAN,'KEY',key);
    if (row < 0) sh.appendRow([key,map[key]]); else sh.getRange(row,2).setValue(map[key]);
  });
  return {success:true,message:'Pengaturan berhasil disimpan.',data:map};
}

function setupSheet() {
  Object.keys(HEADERS).forEach(key => {
    const name = CONFIG['SHEET_' + key] || key;
    let sh = SS.getSheetByName(name);
    if (!sh) sh = SS.insertSheet(name);
    const headers = HEADERS[key];
    if (sh.getLastRow() === 0) sh.getRange(1,1,1,headers.length).setValues([headers]);
  });
  return {success:true,message:'Sheet berhasil disiapkan.'};
}
