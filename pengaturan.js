"use strict";

(function () {

  const $ = (id) =>
    document.getElementById(id);

  let user = null;

  function init() {

    user =
      getCurrentUser();

    if (!user) {
      location.href =
        "index.html";
      return;
    }

    if (
      String(user.role)
        .toUpperCase() !==
      "ADMIN"
    ) {

      alert(
        "Halaman pengaturan hanya untuk Administrator."
      );

      location.href =
        "dashboard.html";

      return;
    }

    bindEvents();

    loadPengaturan();
  }

  function bindEvents() {

    $("pengaturanForm")
      ?.addEventListener(
        "submit",
        savePengaturan
      );

    $("formPengaturan")
      ?.addEventListener(
        "submit",
        savePengaturan
      );

    $("saveButton")
      ?.addEventListener(
        "click",
        savePengaturan
      );

    $("refreshButton")
      ?.addEventListener(
        "click",
        loadPengaturan
      );
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
          result.message ||
          "Gagal mengambil pengaturan."
        );
      }

      const data =
        result.data || {};

      setValue(
        "namaSekolah",
        data.namaSekolah || ""
      );

      setValue(
        "namaKepalaSekolah",
        data.namaKepalaSekolah || ""
      );

      setValue(
        "nipKepalaSekolah",
        data.nipKepalaSekolah || ""
      );

    } catch (error) {

      console.error(error);

      showMessage(
        error.message,
        "error"
      );
    }
  }

  async function savePengaturan(e) {

    if (e) {
      e.preventDefault();
    }

    const data = {

      namaSekolah:
        getValue(
          "namaSekolah"
        ),

      namaKepalaSekolah:
        getValue(
          "namaKepalaSekolah"
        ),

      nipKepalaSekolah:
        getValue(
          "nipKepalaSekolah"
        )
    };

    if (!data.namaSekolah) {

      showMessage(
        "Nama sekolah wajib diisi.",
        "error"
      );

      return;
    }

    try {

      setSaving(true);

      const result =
        await callAPI({

          action:
            "simpanPengaturan",

          ...data

        });

      if (!result.success) {
        throw new Error(
          result.message ||
          "Gagal menyimpan pengaturan."
        );
      }

      showMessage(
        "Pengaturan berhasil disimpan.",
        "success"
      );

    } catch (error) {

      console.error(error);

      showMessage(
        error.message,
        "error"
      );

    } finally {

      setSaving(false);

    }
  }

  function setSaving(state) {

    const buttons =
      document.querySelectorAll(
        "#pengaturanForm button, " +
        "#formPengaturan button, " +
        "#saveButton"
      );

    buttons.forEach(
      button => {
        button.disabled =
          state;
      }
    );
  }

  function showMessage(
    message,
    type
  ) {

    const element =
      $("message") ||
      $("pengaturanMessage");

    if (!element) {

      alert(message);

      return;
    }

    element.textContent =
      message;

    element.className =
      `alert ${
        type === "success"
          ? "alert-success"
          : "alert-danger"
      }`;

    element.style.display =
      "block";
  }

  function setValue(
    id,
    value
  ) {

    const element =
      $(id);

    if (element) {
      element.value =
        value ?? "";
    }
  }

  function getValue(id) {

    return String(
      $(id)?.value || ""
    ).trim();
  }

  window.loadPengaturan =
    loadPengaturan;

  window.savePengaturan =
    savePengaturan;

  document.addEventListener(
    "DOMContentLoaded",
    init
  );

})();
