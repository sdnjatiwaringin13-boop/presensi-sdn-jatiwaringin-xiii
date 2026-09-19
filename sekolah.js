const API_URL =
  "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";


const user =
  JSON.parse(
    localStorage.getItem(
      "presensiUser"
    ) || "null"
  );


if (
  !user ||
  String(
    user.role || ""
  ).toUpperCase()
  !== "ADMIN"
) {

  window.location.href =
    "index.html";

}


async function callAPI(data) {

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
          JSON.stringify(data)
      }
    );


  const text =
    await response.text();


  return JSON.parse(text);

}


document.addEventListener(
  "DOMContentLoaded",
  loadSekolah
);


async function loadSekolah() {

  try {

    const result =
      await callAPI({
        action: "getSekolah"
      });


    if (!result.success) {

      throw new Error(
        result.message
      );

    }


    const data =
      result.data || {};


    document.getElementById(
      "namaSekolah"
    ).value =
      data.namaSekolah || "";


    document.getElementById(
      "namaKepala"
    ).value =
      data.namaKepala || "";


    document.getElementById(
      "nipKepala"
    ).value =
      data.nipKepala || "";


  } catch (error) {

    tampilkanPesan(
      error.message,
      false
    );

  }

}


async function simpanSekolah() {

  const namaSekolah =
    document
      .getElementById(
        "namaSekolah"
      )
      .value
      .trim();


  const namaKepala =
    document
      .getElementById(
        "namaKepala"
      )
      .value
      .trim();


  const nipKepala =
    document
      .getElementById(
        "nipKepala"
      )
      .value
      .trim();


  if (
    !namaSekolah ||
    !namaKepala ||
    !nipKepala
  ) {

    tampilkanPesan(
      "Semua data wajib diisi.",
      false
    );

    return;

  }


  try {

    const result =
      await callAPI({

        action:
          "simpanSekolah",

        namaSekolah:
          namaSekolah,

        namaKepala:
          namaKepala,

        nipKepala:
          nipKepala

      });


    if (!result.success) {

      throw new Error(
        result.message
      );

    }


    tampilkanPesan(
      "✓ Data sekolah berhasil disimpan.",
      true
    );


  } catch (error) {

    tampilkanPesan(
      error.message,
      false
    );

  }

}


function tampilkanPesan(
  message,
  success
) {

  const el =
    document.getElementById(
      "message"
    );


  el.textContent =
    message;


  el.className =
    "message " +
    (
      success
        ? "success"
        : "error"
    );

}
