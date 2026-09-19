const API_URL =
  "https://script.google.com/macros/s/AKfycbw6WR2c4zx59S84HRruF5vtJJXAla1KjYGN-tk4RDBRt1MQK4IUNCna9PYzTNzNst9u/exec";


const loginForm =
  document.getElementById("loginForm");

const loginButton =
  document.getElementById("loginButton");

const message =
  document.getElementById("message");


loginForm.addEventListener(
  "submit",
  async function (event) {

    event.preventDefault();


    const username =
      document.getElementById(
        "username"
      ).value.trim();


    const password =
      document.getElementById(
        "password"
      ).value;


    if (!username || !password) {

      message.textContent =
        "Username dan password harus diisi.";

      return;

    }


    loginButton.disabled = true;

    loginButton.textContent =
      "MEMPROSES...";

    message.textContent =
      "Menghubungkan ke server...";


    try {

      console.log(
        "Mengirim login ke:",
        API_URL
      );


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
              JSON.stringify({

                action: "login",

                username: username,

                password: password

              })

          }
        );


      console.log(
        "HTTP Status:",
        response.status
      );


      /*
       * Ambil sebagai TEXT dahulu
       * supaya kita bisa melihat
       * respons asli Apps Script.
       */

      const responseText =
        await response.text();


      console.log(
        "Response dari Apps Script:",
        responseText
      );


      if (!response.ok) {

        throw new Error(
          "HTTP " +
          response.status +
          ": " +
          responseText
        );

      }


      let result;


      try {

        result =
          JSON.parse(
            responseText
          );

      }
      catch (jsonError) {

        console.error(
          "Response bukan JSON:",
          responseText
        );

        throw new Error(
          "Server tidak mengembalikan JSON."
        );

      }


      console.log(
        "Hasil login:",
        result
      );


      /*
       * LOGIN GAGAL
       */

      if (!result.success) {

        message.textContent =
          result.message ||
          "Username atau password salah.";

        return;

      }


      /*
       * LOGIN BERHASIL
       */

      if (!result.user) {

        throw new Error(
          "Server tidak mengirim data user."
        );

      }


      /*
       * Simpan data user
       */

      localStorage.setItem(
        "presensiUser",
        JSON.stringify(
          result.user
        )
      );


      /*
       * Arahkan berdasarkan role
       */

      if (
        result.user.role === "ADMIN"
      ) {

        window.location.href =
          "admin.html";

        return;

      }


      if (
  result.user.role === "GURU"
) {

  window.location.href =
    "presensi.html";

  return;

}


      message.textContent =
        "Role pengguna tidak dikenali: " +
        result.user.role;


    }
    catch (error) {

      console.error(
        "LOGIN ERROR:",
        error
      );


      message.textContent =
        "Gagal terhubung ke server: " +
        error.message;

    }
    finally {

      loginButton.disabled = false;

      loginButton.textContent =
        "LOGIN";

    }

  }
);
