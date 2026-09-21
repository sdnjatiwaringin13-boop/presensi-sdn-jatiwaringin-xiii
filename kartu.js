"use strict";

(function () {

  let semuaSiswa = [];

  const $ = (id) =>
    document.getElementById(id);

  function init() {

    const user =
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
        "Halaman kartu siswa hanya untuk Administrator."
      );

      location.href =
        "dashboard.html";

      return;
    }

    bindEvents();

    loadSiswa();
  }

  function bindEvents() {

    $("searchInput")?.addEventListener(
      "input",
      renderSiswa
    );

    $("kelasFilter")?.addEventListener(
      "change",
      renderSiswa
    );

    $("refreshButton")?.addEventListener(
      "click",
      loadSiswa
    );

    $("printButton")?.addEventListener(
      "click",
      () => window.print()
    );
  }

  async function loadSiswa() {

    try {

      const result =
        await callAPI({
          action: "getSiswa",
          aktifOnly: true
        });

      if (!result.success) {
        throw new Error(
          result.message ||
          "Gagal mengambil data siswa."
        );
      }

      semuaSiswa =
        Array.isArray(result.data)
          ? result.data
          : [];

      loadKelasFilter();

      renderSiswa();

    } catch (error) {

      console.error(error);

      const container =
        $("kartuContainer");

      if (container) {
        container.innerHTML = `
          <div class="alert alert-danger">
            ${escapeHTML(
              error.message
            )}
          </div>
        `;
      }
    }
  }

  function loadKelasFilter() {

    const select =
      $("kelasFilter");

    if (!select) return;

    const kelas =
      [
        ...new Set(
          semuaSiswa
            .map(
              siswa =>
                siswa.KELAS
            )
            .filter(Boolean)
        )
      ]
      .sort();

    select.innerHTML = `
      <option value="">
        Semua Kelas
      </option>

      ${kelas.map(
        item => `
          <option value="${escapeAttr(item)}">
            ${escapeHTML(item)}
          </option>
        `
      ).join("")}
    `;
  }

  function renderSiswa() {

    const container =
      $("kartuContainer") ||
      $("kartuSiswa");

    if (!container) return;

    const keyword =
      String(
        $("searchInput")?.value ||
        ""
      )
      .toLowerCase()
      .trim();

    const kelas =
      String(
        $("kelasFilter")?.value ||
        ""
      );

    const data =
      semuaSiswa.filter(
        siswa => {

          const cocokKeyword =
            !keyword ||
            String(
              siswa.NISN || ""
            )
            .toLowerCase()
            .includes(keyword) ||
            String(
              siswa.NAMA || ""
            )
            .toLowerCase()
            .includes(keyword);

          const cocokKelas =
            !kelas ||
            String(
              siswa.KELAS
            ) === kelas;

          return (
            cocokKeyword &&
            cocokKelas
          );
        }
      );

    if (!data.length) {

      container.innerHTML = `
        <div class="empty">
          Data siswa tidak ditemukan.
        </div>
      `;

      return;
    }

    container.innerHTML =
      data.map(
        siswa => {

          const cardId =
            `qr-${String(
              siswa.ID
            ).replace(
              /[^a-zA-Z0-9_-]/g,
              ""
            )}`;

          return `
            <div class="kartu-siswa">

              <div class="kartu-header">
                SD NEGERI
                JATIWARINGIN XIII
              </div>

              <div class="kartu-body">

                <div class="kartu-identitas">

                  <h3>
                    ${escapeHTML(
                      siswa.NAMA
                    )}
                  </h3>

                  <p>
                    <strong>NISN:</strong>
                    ${escapeHTML(
                      siswa.NISN || "-"
                    )}
                  </p>

                  <p>
                    <strong>Kelas:</strong>
                    ${escapeHTML(
                      siswa.KELAS || "-"
                    )}
                  </p>

                  <p>
                    <strong>Jenis Kelamin:</strong>
                    ${escapeHTML(
                      siswa.JK || "-"
                    )}
                  </p>

                </div>

                <div
                  class="qr-code"
                  id="${cardId}">
                </div>

              </div>

            </div>
          `;
        }
      ).join("");

    data.forEach(
      siswa => {

        const cardId =
          `qr-${String(
            siswa.ID
          ).replace(
            /[^a-zA-Z0-9_-]/g,
            ""
          )}`;

        const qrElement =
          document.getElementById(
            cardId
          );

        if (!qrElement) return;

        if (
          typeof QRCode ===
          "undefined"
        ) {

          qrElement.innerHTML =
            "<small>QR Library belum dimuat.</small>";

          return;
        }

        new QRCode(
          qrElement,
          {
            text:
              String(siswa.ID),

            width: 120,
            height: 120,

            correctLevel:
              QRCode.CorrectLevel.H
          }
        );
      }
    );
  }

  window.loadKartuSiswa =
    loadSiswa;

  document.addEventListener(
    "DOMContentLoaded",
    init
  );

})();
