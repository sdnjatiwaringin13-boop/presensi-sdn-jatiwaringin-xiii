"use strict";

/* =========================================================
   API CONFIG
   ========================================================= */

const API_URL =
  "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";


/* =========================================================
   API REQUEST
   ========================================================= */

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


    let result;

    try {

      result = JSON.parse(text);

    } catch (error) {

      console.error("RESPONS API:", text);

      throw new Error(
        "Respons dari server bukan JSON."
      );

    }


    if (!result) {

      throw new Error(
        "Server tidak mengembalikan data."
      );

    }


    return result;


  } catch (error) {

    console.error(
      "API ERROR:",
      error
    );

    throw new Error(
      error.message ||
      "Tidak dapat terhubung ke server."
    );

  }

}


/* =========================================================
   HELPER
   ========================================================= */

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/[&<>"']/g, function (char) {

      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[char];

    });

}


function escapeAttr(value) {

  return escapeHTML(value);

}


/* =========================================================
   AUTH
   ========================================================= */

function getCurrentUser() {

  try {

    return JSON.parse(
      localStorage.getItem("presensiUser") || "null"
    );

  } catch (error) {

    return null;

  }

}


function requireAdmin() {

  const user = getCurrentUser();


  if (!user) {

    location.href = "index.html";

    return null;

  }


  if (
    String(user.role || "")
      .toUpperCase() !== "ADMIN"
  ) {

    alert(
      "Halaman ini hanya dapat diakses oleh Administrator."
    );

    location.href = "dashboard.html";

    return null;

  }


  return user;

}


function logout() {

  localStorage.removeItem("presensiUser");

  location.href = "index.html";

}
