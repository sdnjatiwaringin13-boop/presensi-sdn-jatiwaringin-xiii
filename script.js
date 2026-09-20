const API_URL =
  "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";


/* =====================================================
   API
===================================================== */

async function callAPI(payload) {

  try {

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();

    console.log("API RESPONSE:", text);

    if (!text) {
      throw new Error(
        "Server tidak mengirim response."
      );
    }

    let result;

    try {

      result = JSON.parse(text);

    } catch (error) {

      console.error(
        "Response bukan JSON:",
        text
      );

      throw new Error(
        "Server mengirim response yang bukan JSON."
      );

    }

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
   DOM READY
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

  const form =
    document.getElementById("loginForm");

  if (!form) {

    console.warn(
      "Form login #loginForm tidak ditemukan."
    );

    return;

  }


  form.addEventListener(
    "submit",
    handleLogin
  );

}


/* =====================================================
   LOGIN
===================================================== */

async function handleLogin(event) {

  event.preventDefault();


  const usernameInput =
    document.getElementById("username");

  const passwordInput =
    document.getElementById("password");


  const username =
    usernameInput
      ? usernameInput.value.trim()
      : "";


  const password =
    passwordInput
      ? passwordInput.value
      : "";


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


  const button =
    document.querySelector(
      '#loginForm button[type="submit"]'
    );


  if (button) {

    button.disabled = true;

    button.dataset.originalText =
      button.textContent;

    button.textContent =
      "⏳ Memproses...";

  }


  showLoginMessage(
    "Memeriksa akun...",
    "info"
  );


  try {

    const result =
      await callAPI({

        action: "login",

        username: username,

        password: password

      });


    console.log(
      "HASIL LOGIN:",
      result
    );


    /* ============================================
       CEK RESPONSE SERVER
    ============================================ */

    if (!result) {

      throw new Error(
        "Server tidak mengirim data."
      );

    }


    if (!result.success) {

      throw new Error(
        result.message ||
        "Username atau password salah."
      );

    }


    /* ============================================
       AMBIL USER
       
       Mendukung dua format:
       
       result.user
       result.data.user
    ============================================ */

    const user =
      result.user ||
      (
        result.data &&
        result.data.user
      );


    if (!user) {

      console.error(
        "LOGIN RESPONSE TANPA USER:",
        result
      );

      throw new Error(
        "Server tidak mengirim data user."
      );

    }


    /* ============================================
       VALIDASI USER
    ============================================ */

    if (!user.username) {

      console.error(
        "USERNAME USER TIDAK ADA:",
        user
      );

      throw new Error(
        "Data username dari server tidak lengkap."
      );

    }


    if (!user.role) {

      console.error(
        "ROLE USER TIDAK ADA:",
        user
      );

      throw new Error(
        "Data role dari server tidak lengkap."
      );

    }


    const role =
      String(user.role)
        .trim()
        .toUpperCase();


    /* ============================================
       GURU HARUS MEMILIKI ID GURU
    ============================================ */

    if (role === "GURU") {

      if (!user.idGuru) {

        console.error(
          "USER GURU TANPA ID GURU:",
          user
        );

        throw new Error(
          "Akun GURU belum memiliki ID Guru."
        );

      }

    }


    /* ============================================
       NORMALISASI USER
    ============================================ */

    const userData = {

      idUser:
        user.idUser ||
        user.ID_USER ||
        "",

      username:
        user.username ||
        user.USERNAME ||
        username,

      role:
        role,

      idGuru:
        user.idGuru ||
        user.ID_GURU ||
        "",

      nama:
        user.nama ||
        user.namaGuru ||
        user.NAMA ||
        user.NAMA_GURU ||
        user.username ||
        username

    };


    console.log(
      "USER YANG DISIMPAN:",
      userData
    );


    /* ============================================
       SIMPAN LOGIN
    ============================================ */

    localStorage.setItem(
      "presensiUser",
      JSON.stringify(userData)
    );


    /* ============================================
       CEK HASIL STORAGE
    ============================================ */

    const savedUser =
      localStorage.getItem(
        "presensiUser"
      );


    if (!savedUser) {

      throw new Error(
        "Data login gagal disimpan di browser."
      );

    }


    /* ============================================
       REDIRECT
    ============================================ */

    if (role === "ADMIN") {

      window.location.href =
        "admin.html";

      return;

    }


    if (role === "GURU") {

      window.location.href =
        "presensi.html";

      return;

    }


    throw new Error(
      "Role user tidak dikenali: " +
      role
    );


  } catch (error) {

    console.error(
      "LOGIN ERROR:",
      error
    );


    showLoginMessage(
      error.message ||
      "Login gagal.",
      "error"
    );


  } finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        button.dataset.originalText ||
        "Login";

    }

  }

}


/* =====================================================
   MESSAGE LOGIN
===================================================== */

function showLoginMessage(
  message,
  type = "info"
) {

  let element =
    document.getElementById(
      "loginMessage"
    );


  /*
   * Jika HTML menggunakan #message,
   * gunakan juga sebagai fallback.
   */

  if (!element) {

    element =
      document.getElementById(
        "message"
      );

  }


  if (!element) {

    console.log(
      "[" + type + "]",
      message
    );

    return;

  }


  element.className =
    "message " + type;


  element.textContent =
    message;

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
   CEK LOGIN
===================================================== */

function getCurrentUser() {

  const savedUser =
    localStorage.getItem(
      "presensiUser"
    );


  if (!savedUser) {

    return null;

  }


  try {

    return JSON.parse(
      savedUser
    );

  } catch (error) {

    console.error(
      "Data user rusak:",
      error
    );

    localStorage.removeItem(
      "presensiUser"
    );

    return null;

  }

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
