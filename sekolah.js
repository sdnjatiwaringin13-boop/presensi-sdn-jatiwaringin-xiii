"use strict";

document.addEventListener(
  "DOMContentLoaded",
  async function () {

    const user =
      Auth.requireRole(
        "ADMIN"
      );

    if (!user) return;

    await loadSekolah();

    document
      .getElementById(
        "sekolahForm"
      )
      ?.addEventListener(
        "submit",
        function (event) {

          event.preventDefault();

          simpanSekolah();
        }
      );
  }
);

async function loadSekolah() {

  try {

    const result =
      await callAPI({
        action:
          "getPengaturan"
      });

    if (!result.success) {
      throw new Error(
        result.message ||
        "Gagal mengambil data sekolah."
      );
    }

    const data =
      result.data || {};

    setValue(
      "namaSekolah",
      data.namaSekolah || ""
    );

    setValue(
      "namaKepala",
      data.namaKepalaSekolah || ""
    );

    setValue(
      "nipKepala",
      data.nipKepalaSekolah || ""
    );

  } catch (error) {

    tampilkanPesan(
      error.message,
      false
    );
  }
}

async function simpanSekolah() {

  const namaSekolah =
    getValue(
      "namaSekolah"
    );

  const namaKepala =
    getValue(
      "namaKepala"
    );

  const nipKepala =
    getValue(
      "nipKepala"
    );

  if (!namaSekolah) {

    tampilkanPesan(
      "Nama sekolah wajib diisi.",
      false
    );

    return;
  }

  try {

    const result =
      await callAPI({

        action:
          "simpanPengaturan",

        namaSekolah,

        namaKepalaSekolah:
          namaKepala,

        nipKepalaSekolah:
          nipKepala
      });

    if (!result.success) {
      throw new Error(
        result.message ||
        "Gagal menyimpan data sekolah."
      );
    }

    tampilkanPesan(
      "Data sekolah berhasil disimpan.",
      true
    );

  } catch (error) {

    tampilkanPesan(
      error.message,
      false
    );
  }
}

function setValue(
  id,
  value
) {

  const element =
    document.getElementById(id);

  if (element) {
    element.value =
      value ?? "";
  }
}

function getValue(id) {

  return String(
    document
      .getElementById(id)
      ?.value || ""
  ).trim();
}

function tampilkanPesan(
  message,
  success
) {

  const element =
    document.getElementById(
      "message"
    );

  if (!element) return;

  element.textContent =
    message;

  element.className =
    success
      ? "message success"
      : "message error";
}
