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

    message.textContent = "";


    try {

      const response =
        await fetch(API_URL, {

          method: "POST",

          headers: {
            "Content-Type":
              "text/plain;charset=utf-8"
          },

          body: JSON.stringify({

            action: "login",

            username: username,

            password: password

          })

        });


      const result =
        await response.json();


      console.log(result);


      if (!result.success) {

        message.textContent =
          result.message ||
          "Login gagal.";

        return;

      }


      /*
       * Simpan data login
       */

      localStorage.setItem(
        "presensiUser",
        JSON.stringify(result.user)
      );


      /*
       * Arahkan berdasarkan role
       */

      if (
        result.user.role === "ADMIN"
      ) {

        window.location.href =
          "admin.html";

      }

      else if (
        result.user.role === "GURU"
      ) {

        window.location.href =
          "guru.html";

      }

      else {

        message.textContent =
          "Role pengguna tidak dikenali.";

      }


    }

    catch (error) {

      console.error(error);

      message.textContent =
        "Tidak dapat terhubung ke server.";

    }

    finally {

      loginButton.disabled = false;

      loginButton.textContent =
        "LOGIN";

    }

  }
);
