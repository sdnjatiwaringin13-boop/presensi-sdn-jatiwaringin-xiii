const API_URL =
  "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";


/* =========================================================
   CALL API
========================================================= */

async function callAPI(
  payload
) {

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
          JSON.stringify(
            payload
          )
      }
    );


  const text =
    await response.text();


  try {

    return JSON.parse(text);

  } catch (error) {

    throw new Error(
      "Respons API bukan JSON yang valid."
    );
  }
}


/* =========================================================
   INIT LOGIN
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    const existingUser =
      Auth.getCurrentUser();


    if (existingUser) {

      location.href =
        "dashboard.html";

      return;
    }


    const form =
      document.getElementById(
        "loginForm"
      );


    if (form) {

      form.addEventListener(
        "submit",
        handleLogin
      );
    }

  }
);


/* =========================================================
   LOGIN
========================================================= */

async function handleLogin(
  event
) {

  event.preventDefault();


  const username =
    document
      .getElementById(
        "username"
      )
      .value
      .trim();


  const password =
    document
      .getElementById(
        "password"
      )
      .value;


  if (
    !username ||
    !password
  ) {

    showLoginMessage(
      "Username dan password wajib diisi.",
      "error"
    );

    return;
  }


  const button =
    event.submitter ||
    document.querySelector(
      "#loginForm button[type='submit']"
    );


  if (button) {

    button.disabled =
      true;

    button.textContent =
      "Memproses...";
  }


  try {

    const result =
      await callAPI({

        action:
          "login",

        username:
          username,

        password:
          password
      });


    if (!result.success) {

      showLoginMessage(
        result.message ||
          "Login gagal.",
        "error"
      );

      return;
    }


    const user =
      result.user ||
      (
        result.data &&
        result.data.user
      );


    if (!user) {

      throw new Error(
        "Data pengguna tidak ditemukan."
      );
    }


    const role =
      String(
        user.role || ""
      ).toUpperCase();


    if (
      ![
        "ADMIN",
        "GURU"
      ].includes(role)
    ) {

      throw new Error(
        "Role pengguna tidak valid."
      );
    }


    if (
      role === "GURU" &&
      !user.idGuru
    ) {

      throw new Error(
        "Akun GURU belum memiliki ID_GURU."
      );
    }


    const savedUser = {

      idUser:
        user.idUser || "",

      username:
        user.username ||
        username,

      role:
        role,

      idGuru:
        user.idGuru || "",

      nama:
        user.nama ||
        user.username ||
        username
    };


    localStorage.setItem(
      "presensiUser",
      JSON.stringify(
        savedUser
      )
    );


    location.href =
      "dashboard.html";


  } catch (error) {

    showLoginMessage(
      error.message ||
        "Terjadi kesalahan.",
      "error"
    );

  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        "Masuk";
    }
  }
}


/* =========================================================
   MESSAGE
========================================================= */

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
    "message " +
    (
      type || ""
    );
}


/* =========================================================
   COMPATIBILITY
========================================================= */

function logout() {

  Auth.logout();
}


function getCurrentUser() {

  return Auth.getCurrentUser();
}


function isLoggedIn() {

  return !!Auth.getCurrentUser();
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
  value
) {

  return String(
    value == null
      ? ""
      : value
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
