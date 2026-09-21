(function () {

  "use strict";

  const API_URL =
    "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";

  Auth.requireRole("ADMIN");

  document.addEventListener(
    "DOMContentLoaded",
    init
  );

  async function init() {

    document
      .getElementById(
        "pengaturanForm"
      )
      .addEventListener(
        "submit",
        simpan
      );

    await loadPengaturan();
  }

  async function loadPengaturan() {

    try {

      const result =
        await callAPI({
          action:
            "getPengaturan"
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
        "namaKepalaSekolah"
      ).value =
        data.namaKepalaSekolah || "";

      document.getElementById(
        "nipKepalaSekolah"
      ).value =
        data.nipKepalaSekolah || "";

    } catch (error) {

      tampilkanPesan(
        error.message,
        "error"
      );
    }
  }

  async function simpan(event) {

    event.preventDefault();

    const data = {

      action:
        "simpanPengaturan",

      namaSekolah:
        document.getElementById(
          "namaSekolah"
        ).value.trim(),

      namaKepalaSekolah:
        document.getElementById(
          "namaKepalaSekolah"
        ).value.trim(),

      nipKepalaSekolah:
        document.getElementById(
          "nipKepalaSekolah"
        ).value.trim()

    };

    if (!data.namaSekolah) {

      tampilkanPesan(
        "Nama sekolah wajib diisi.",
        "error"
      );

      return;
    }

    const button =
      document.getElementById(
        "btnSimpanPengaturan"
      );

    button.disabled = true;
    button.textContent =
      "Menyimpan...";

    try {

      const result =
        await callAPI(data);

      if (!result.success) {
        throw new Error(
          result.message
        );
      }

      tampilkanPesan(
        result.message ||
        "Pengaturan berhasil disimpan.",
        "success"
      );

    } catch (error) {

      tampilkanPesan(
        error.message,
        "error"
      );

    } finally {

      button.disabled = false;
      button.textContent =
        "Simpan Pengaturan";
    }
  }

  async function callAPI(payload) {

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

    return await response.json();
  }

  function tampilkanPesan(
    message,
    type
  ) {

    const element =
      document.getElementById(
        "pengaturanMessage"
      );

    element.textContent =
      message;

    element.className =
      "message " +
      (
        type === "success"
          ? "message-success"
          : "message-error"
      );

    element.style.display =
      "block";

    setTimeout(() => {

      element.style.display =
        "none";

    }, 4000);
  }

})();
