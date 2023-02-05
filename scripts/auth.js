import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

const emailField = document.getElementById("email");
const passwordField = document.getElementById("password");
const signInButton = document.getElementById("signIn");
const signUpButton = document.getElementById("signUp");
const firebaseConfig = {
  apiKey: "AIzaSyDOTQFVNf8Uryge39sxBAhmVjhOkzjYiik",
  authDomain: "exdatabase-1a7c3.firebaseapp.com",
  projectId: "exdatabase-1a7c3",
  storageBucket: "exdatabase-1a7c3.appspot.com",
  messagingSenderId: "857622055165",
  appId: "1:857622055165:web:bf5e8559033206db635694",
};

const app = initializeApp(firebaseConfig);
let auth = getAuth(app);

onAuthStateChanged(auth, function (user) {
  if (user) {
    window.location.href = "/";
  }
});

function setButtonDisabled(bool) {
  signInButton.disabled = bool;
  signUpButton.disabled = bool;
}

function validateEntries() {
  if (emailField.value !== "" && passwordField.value !== "") {
    setButtonDisabled(false);
  } else {
    setButtonDisabled(true);
  }
}
validateEntries();

function handleFailedAuth(code) {
  let message;
  switch (code) {
    case "auth/email-already-in-use":
      message = "The email address you're trying to use already exists.";
      break;
    case "auth/invalid-email":
      message = "The email address you've entered is invalid.";
      break;
    case "auth/weak-password":
      message =
        "The password you've entered is too weak. Enter a stronger password (at least 6 characters) and try again";
      break;
    case "auth/user-not-found":
      message =
        "The email address you've entered doesn't match any account. Try again or click 'Sign Up' to create a new account.";
      break;
    case "auth/wrong-password":
      message =
        "The password you've entered for the given email address is incorrect. Try again.";
      break;
    case "auth/too-many-requests":
      message =
        "You've made too many unsuccessful attempts. Try again later or reset your password.";
      break;
    default:
      message = "An error has occurred. Please try again later.";
  }

  createAlert(
    "danger",
    `
    <h3>Uh oh!</h3>
    <hr>
    <p class='mb-0'>${message}</p>
    `
  );
}

async function handleSubmit(button) {
  setButtonDisabled(true);
  await authenticateUser(button.id);
  setButtonDisabled(false);
}

async function authenticateUser(action) {
  const payload = {
    email: emailField.value,
    password: passwordField.value,
    returnSecureToken: true,
  };
  let url;

  switch (action) {
    case "signIn":
      signInWithEmailAndPassword(
        auth,
        emailField.value,
        passwordField.value
      ).catch(function (error) {
        handleFailedAuth(error.code);
      });
      break;

    case "signUp":
      createUserWithEmailAndPassword(
        auth,
        emailField.value,
        passwordField.value
      ).catch(function (error) {
        handleFailedAuth(error.code);
      });
      break;
  }
}

function createAlert(type, content) {
  if (emailField.previousElementSibling) {
    emailField.previousElementSibling.remove();
  }
  const alertDiv = document.createElement("div");
  alertDiv.classList.add(
    "alert",
    `alert-${type}`,
    "alert-dismissible",
    "fade",
    "show"
  );
  alertDiv.role = "alert";
  alertDiv.id = "alert";
  alertDiv.innerHTML = content;
  emailField.parentNode.insertBefore(alertDiv, emailField);
}

// Binds relevant event listeners to their respective elements.
// Since this file is made into a module, we cannot use this in the global scope (i.e., accessible to HTML).
emailField.addEventListener("keyup", function () {
  validateEntries();
});
emailField.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    handleSubmit({ id: "signIn" });
  }
});
passwordField.addEventListener("keyup", function () {
  validateEntries();
});
passwordField.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    handleSubmit({ id: "signIn" });
  }
});
signInButton.addEventListener("click", function (event) {
  event.preventDefault();
  handleSubmit(event.target);
});
signUpButton.addEventListener("click", function (event) {
  event.preventDefault();
  handleSubmit(event.target);
});
