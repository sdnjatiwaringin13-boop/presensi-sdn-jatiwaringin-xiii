"use strict";

const API_URL =
  "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";

async function callAPI(payload = {}) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(
        `Server mengembalikan HTTP ${response.status}`
      );
    }

    const text = await response.text();

    let result;

    try {
      result = JSON.parse(text);
    } catch (error) {
      console.error("Respons API:", text);

      throw new Error(
        "Respons server bukan JSON. Periksa deployment Apps Script."
      );
    }

    if (!result || typeof result !== "object") {
      throw new Error(
        "Server tidak mengembalikan data yang valid."
      );
    }

    return result;

  } catch (error) {
    console.error("API ERROR:", error);

    throw new Error(
      error.message ||
      "Tidak dapat terhubung ke server."
    );
  }
}

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

function normalizeText(value) {
  return String(value ?? "").trim();
}

function upperText(value) {
  return normalizeText(value).toUpperCase();
}

window.API_URL = API_URL;
window.callAPI = callAPI;
window.escapeHTML = escapeHTML;
window.escapeAttr = escapeAttr;
window.normalizeText = normalizeText;
window.upperText = upperText;
