import { auth, onAuthStateChanged, signOut } from "./utils/firebase.js";

onAuthStateChanged(auth, function (user) {
  if (user) {
    $("#header__nav").append(
      `<a id="nav__trivia" class="col" href="./trivia.html"><i class="fa-solid fa-clipboard-question"></i> &nbsp;Trivia</button></a>`
    );
    $("#header__nav").append(
      `<a id="nav__profile" class="col" href="./index.html"><i class="fa-solid fa-house"></i> &nbsp;Home</a>`
    );
    $("#header__nav").append(
      `<button id="nav__signout" class="col"><i class="fa-solid fa-user"></i> &nbsp;Sign out</button>`
    );

    $("#nav__signout").click(function () {
      signOut(auth)
        .then(function () {
          alert("You're now signed out.");
        })
        .catch(function (error) {
          alert(
            "Something went wrong when signing out. Try again later. Error code: " +
              error.code
          );
        });
    });
  } else {
    $("#nav__trivia").remove();
    $("#nav__profile").remove();
    $("#nav__signout").remove();
    $("#header__nav").append(
      `<a id="nav__login" href="./auth.html" class="col"><i class="fa-solid fa-user"></i> &nbsp;Sign in/up</a>`
    );
  }

  if (window.innerWidth >= 768) {
    $("#header__nav").css(
      "grid-template-columns",
      `repeat(${$("#header__nav > *").length}, 1fr)`
    );
  } else {
    $("#header__nav").css(
      "grid-template-rows",
      `repeat(${$("#header__nav > *").length}, 1fr)`
    );
  }
});

const menu = document.getElementById("header__nav");

function toggleNav() {
  menu.classList.toggle("hamburger-open");
  menu.style.top = document.querySelector("header").offsetHeight + "px";
}

document.getElementById("hamburger").addEventListener("click", toggleNav);
