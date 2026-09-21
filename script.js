"use strict";

document.addEventListener("DOMContentLoaded",()=>{
  if(Auth.getCurrentUser()){location.replace("dashboard.html");return;}
  document.getElementById("loginForm")?.addEventListener("submit",handleLogin);
  document.getElementById("togglePassword")?.addEventListener("click",()=>{
    const input=document.getElementById("password"),btn=document.getElementById("togglePassword");
    if(!input)return;input.type=input.type==="password"?"text":"password";btn.innerHTML=input.type==="password"?'<i class="fa-solid fa-eye"></i>':'<i class="fa-solid fa-eye-slash"></i>';
  });
  const tick=()=>{const e=document.getElementById("loginClock");if(e)e.textContent=new Intl.DateTimeFormat("id-ID",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}).format(new Date());};tick();setInterval(tick,1000);
});

async function handleLogin(e){
  e.preventDefault();
  const username=document.getElementById("username")?.value.trim()||"";
  const password=document.getElementById("password")?.value||"";
  const button=document.getElementById("btnLogin");
  if(!username||!password){showLoginMessage("Username dan password wajib diisi.","error");return;}
  try{
    button.disabled=true;button.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Memeriksa...';showLoginMessage("Memeriksa akun...","info");
    const result=await callAPI({action:"login",username,password});
    if(!result.success)throw new Error(result.message||"Login gagal.");
    const u=result.user||result.data?.user;if(!u)throw new Error("Data pengguna tidak ditemukan.");
    const role=String(u.role||"").toUpperCase();if(!["ADMIN","GURU"].includes(role))throw new Error("Role akun tidak valid.");
    if(role==="GURU"&&!u.idGuru)throw new Error("Akun guru belum terhubung dengan ID_GURU.");
    localStorage.setItem("presensiUser",JSON.stringify({idUser:u.idUser||"",username:u.username||username,role,idGuru:u.idGuru||"",nama:u.nama||u.username||username}));
    location.replace("dashboard.html");
  }catch(err){showLoginMessage(err.message||"Login gagal.","error");button.disabled=false;button.innerHTML='<i class="fa-solid fa-right-to-bracket"></i> Masuk';}
}
function showLoginMessage(message,type="info"){const e=document.getElementById("loginMessage");if(!e)return;e.textContent=message;e.className=`message ${type}`;e.style.display="block";}
