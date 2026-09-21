/*******************************************************
 * LOGIN - PRESENSI SISWA
 * SD NEGERI JATIWARINGIN XIII
 *******************************************************/

const API_URL =
  "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";


/* =====================================================
   PANGGIL API
===================================================== */

async function callAPI(payload) {

  try {

    const response =
      await fetch(
        API_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "text/plain;charset=utf-8"
          },

          body:
            JSON.stringify(payload)
        }
      );


    if (!response.ok) {

      throw new Error(
        "HTTP Error " +
        response.status
      );

    }


    const text =
      await response.text();


    if (!text) {

      throw new Error(
        "Server tidak mengirim response."
      );

    }


    let result;


    try {

      result =
        JSON.parse(text);

    } catch (error) {

      console.error(
        "RESPONSE SERVER:",
        text
      );

      throw new Error(
        "Response server bukan JSON yang valid."
      );

    }


    console.log(
      "API RESPONSE:",
      result
    );


    return result;


  } catch (error) {

    console.error(
      "API ERROR:",
      error
    );

    throw error;

  }

}


/* =====================================================
   SAAT HALAMAN LOGIN DIBUKA
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    initLogin();

  }
);


/* =====================================================
   INIT LOGIN
===================================================== */

function initLogin() {

  /*
   * Kalau sudah login,
   * langsung masuk dashboard.
   */

  const currentUser =
    getCurrentUser();


  if (
    currentUser &&
    currentUser.role
  ) {

    const role =
      String(
        currentUser.role
      )
        .trim()
        .toUpperCase();


    if (
      role === "ADMIN" ||
      role === "GURU"
    ) {

      window.location.href =
        "dashboard.html";

      return;

    }

  }


  const loginForm =
    document.getElementById(
      "loginForm"
    );


  if (!loginForm) {
    return;
  }


  /*
   * Hindari event listener
   * terpasang dua kali.
   */

  loginForm.addEventListener(
    "submit",
    handleLogin
  );


  const usernameInput =
    document.getElementById(
      "username"
    );


  if (usernameInput) {

    usernameInput.focus();

  }

}


/* =====================================================
   LOGIN
===================================================== */

async function handleLogin(event) {

  event.preventDefault();


  const usernameInput =
    document.getElementById(
      "username"
    );


  const passwordInput =
    document.getElementById(
      "password"
    );


  const loginButton =
    document.getElementById(
      "loginButton"
    );


  const username =
    usernameInput
      ? usernameInput.value.trim()
      : "";


  const password =
    passwordInput
      ? passwordInput.value
      : "";


  /* =================================================
     VALIDASI
  ================================================= */

  if (!username) {

    showLoginMessage(
      "Username wajib diisi.",
      "error"
    );


    if (usernameInput) {
      usernameInput.focus();
    }


    return;

  }


  if (!password) {

    showLoginMessage(
      "Password wajib diisi.",
      "error"
    );


    if (passwordInput) {
      passwordInput.focus();
    }


    return;

  }


  /* =================================================
     LOADING
  ================================================= */

  if (loginButton) {

    loginButton.disabled =
      true;

    loginButton.textContent =
      "MEMPROSES...";

  }


  showLoginMessage(
    "Menghubungkan ke server...",
    "loading"
  );


  try {

    /* =================================================
       LOGIN API
    ================================================= */

    const result =
      await callAPI({

        action:
          "login",

        username:
          username,

        password:
          password

      });


    console.log(
      "HASIL LOGIN:",
      result
    );


    /* =================================================
       RESPONSE KOSONG
    ================================================= */

    if (!result) {

      throw new Error(
        "Server tidak memberikan response."
      );

    }


    /* =================================================
       LOGIN GAGAL
    ================================================= */

    if (
      result.success !== true
    ) {

      throw new Error(
        result.message ||
        "Username atau password salah."
      );

    }


    /* =================================================
       AMBIL USER
       
       Mendukung:
       
       result.user
       result.data.user
    ================================================= */

    const user =
      result.user ||
      (
        result.data &&
        result.data.user
      );


    if (!user) {

      console.error(
        "LOGIN RESPONSE:",
        result
      );


      throw new Error(
        "Server tidak mengirim data user."
      );

    }


    /* =================================================
       NORMALISASI USER
    ================================================= */

    const role =
      String(
        user.role || ""
      )
        .trim()
        .toUpperCase();


    const idUser =
      String(
        user.idUser || ""
      )
        .trim();


    const idGuru =
      String(
        user.idGuru || ""
      )
        .trim();


    const nama =
      String(
        user.nama ||
        user.namaGuru ||
        user.username ||
        ""
      )
        .trim();


    const usernameServer =
      String(
        user.username ||
        username
      )
        .trim();


    /* =================================================
       VALIDASI ROLE
    ================================================= */

    if (
      role !== "ADMIN" &&
      role !== "GURU"
    ) {

      throw new Error(
        "Role pengguna tidak valid: " +
        role
      );

    }


    /* =================================================
       GURU WAJIB MEMILIKI ID GURU
    ================================================= */

    if (
      role === "GURU" &&
      !idGuru
    ) {

      throw new Error(
        "Akun GURU belum memiliki ID_GURU. Periksa sheet USERS."
      );

    }


    /* =================================================
       BENTUK USER LOGIN
    ================================================= */

    const currentUser = {

      idUser:
        idUser,

      username:
        usernameServer,

      role:
        role,

      idGuru:
        idGuru,

      nama:
        nama

    };


    /* =================================================
       SIMPAN KE LOCAL STORAGE
    ================================================= */

    localStorage.setItem(
      "presensiUser",
      JSON.stringify(
        currentUser
      )
    );


    console.log(
      "USER TERSIMPAN:",
      currentUser
    );


    /* =================================================
       BERHASIL
    ================================================= */

    showLoginMessage(
      "Login berhasil. Membuka dashboard...",
      "success"
    );


    /* =================================================
       REDIRECT DASHBOARD
    ================================================= */

    setTimeout(
      function () {

        window.location.href =
          "dashboard.html";

      },
      500
    );


  } catch (error) {

    console.error(
      "LOGIN ERROR:",
      error
    );


    showLoginMessage(
      error.message ||
      "Gagal login.",
      "error"
    );


  } finally {

    if (loginButton) {

      loginButton.disabled =
        false;

      loginButton.textContent =
        "LOGIN";

    }

  }

}


/* =====================================================
   PESAN LOGIN
===================================================== */

function showLoginMessage(
  message,
  type
) {

  const element =
    document.getElementById(
      "loginMessage"
    );


  if (!element) {
    return;
  }


  element.textContent =
    message;


  element.className =
    "login-message " +
    (
      type || ""
    );


  element.style.display =
    "block";

}


/* =====================================================
   LOGOUT
===================================================== */

function logout() {

  localStorage.removeItem(
    "presensiUser"
  );


  window.location.href =
    "index.html";

}


/* =====================================================
   AMBIL USER LOGIN
===================================================== */

function getCurrentUser() {

  try {

    const data =
      localStorage.getItem(
        "presensiUser"
      );


    if (!data) {

      return null;

    }


    const user =
      JSON.parse(data);


    if (
      !user ||
      !user.role
    ) {

      return null;

    }


    return user;


  } catch (error) {

    console.error(
      "Gagal membaca user:",
      error
    );


    return null;

  }

}


/* =====================================================
   CEK LOGIN
===================================================== */

function isLoggedIn() {

  const user =
    getCurrentUser();


  return !!(
    user &&
    user.role
  );

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {

  return String(
    value ?? ""
  )

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}
