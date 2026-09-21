"use strict";

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

    document
      .getElementById("loginForm")
      ?.addEventListener(
        "submit",
        handleLogin
      );
  }
);

async function handleLogin(event) {

  event.preventDefault();

  const username =
    document
      .getElementById("username")
      .value
      .trim();

  const password =
    document
      .getElementById("password")
      .value;

  const button =
    document.getElementById(
      "btnLogin"
    );

  if (!username || !password) {

    showLoginMessage(
      "Username dan password wajib diisi.",
      "error"
    );

    return;
  }

  try {

    if (button) {
      button.disabled = true;
      button.textContent =
        "Memproses...";
    }

    showLoginMessage(
      "Memeriksa akun...",
      "info"
    );

    const result =
      await callAPI({
        action: "login",
        username,
        password
      });

    if (!result.success) {
      throw new Error(
        result.message ||
        "Username atau password salah."
      );
    }

    const user =
      result.user ||
      result.data?.user;

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
        "Role akun tidak valid."
      );
    }

    if (
      role === "GURU" &&
      !user.idGuru
    ) {
      throw new Error(
        "Akun guru belum terhubung dengan ID_GURU."
      );
    }

    const savedUser = {
      idUser:
        user.idUser || "",

      username:
        user.username ||
        username,

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
      JSON.stringify(savedUser)
    );

    location.href =
      "dashboard.html";

  } catch (error) {

    console.error(error);

    showLoginMessage(
      error.message ||
      "Login gagal.",
      "error"
    );

  } finally {

    if (button) {
      button.disabled = false;
      button.textContent = "Masuk";
    }
  }
}

function showLoginMessage(
  message,
  type = "info"
) {

  const element =
    document.getElementById(
      "loginMessage"
    );

  if (!element) return;

  element.style.display =
    "block";

  element.textContent =
    message;

  element.className =
    `message ${type}`;
}
