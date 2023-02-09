const menu = document.getElementById("header__nav");
menu.style.top = document.querySelector("header").offsetHeight + "px";

function toggleNav() {
  menu.classList.toggle("hamburger-open");
  menu.style.top = document.querySelector("header").offsetHeight + "px";
}
