import { auth, db } from "./utils/firebase.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import {
  doc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

const usernameField = $("#username");
const emailField = $("#email");
const passwordField = $("#password");
const signInButton = $("#signIn");
const signUpButton = $("#signUp");
const signOutButton = $("#signOut");

onAuthStateChanged(auth, async function (user) {
  if (user) {
    if (user.metadata.creationTime === user.metadata.lastSignInTime) {
      try {
        await updateProfile(auth.currentUser, {
          displayName: usernameField.val(),
        }).catch(function (error) {
          throw error;
        });
        await setDoc(doc(db, "users", auth.currentUser.uid), {
          Username: auth.currentUser.displayName,
          Points: 0,
          TriviaHighScore: 0,
        }).catch(function (error) {
          throw error;
        });
        window.location.href = "./";
      } catch (error) {
        handleFailedAuth(error.code);
      }
    } else {
      window.location.href = "./";
    }
  }
});

function setButtonDisabled(bool) {
  signInButton.prop("disabled", bool);
  signUpButton.prop("disabled", bool);
}

function validateEntries() {
  if (emailField.val() !== "" && passwordField.val() !== "") {
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
    case "auth/invalid-username":
      message = "Please enter a username.";
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
  switch (action) {
    case "signIn":
      signInWithEmailAndPassword(
        auth,
        emailField.val(),
        passwordField.val()
      ).catch(function (error) {
        handleFailedAuth(error.code);
      });
      break;

    case "signUp":
      try {
        if (usernameField.val() === "") {
          throw {
            code: "auth/invalid-username",
          };
        }
        await createUserWithEmailAndPassword(
          auth,
          emailField.val(),
          passwordField.val()
        ).catch(function (error) {
          throw error;
        });
      } catch (error) {
        handleFailedAuth(error.code);
      }
      break;
  }
}

function createAlert(type, content) {
  if (usernameField.prev()) {
    usernameField.prev().remove();
  }
  const alertDiv = $(
    `<div class="alert alert-${type} alert-dismissible fade show"></div>`
  );
  alertDiv.prop("role", "alert");
  alertDiv.prop("id", "alert");
  alertDiv.html(content);
  usernameField.before(alertDiv);
}

// Binds relevant event listeners to their respective elements.
// Since this file is made into a module, we cannot use this in the global scope (i.e., accessible to HTML).
emailField.on("keyup", function () {
  validateEntries();
});
emailField.on("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    handleSubmit({ id: "signIn" });
  }
});
passwordField.on("keyup", function () {
  validateEntries();
});
passwordField.on("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    handleSubmit({ id: "signIn" });
  }
});
signInButton.on("click", function (event) {
  event.preventDefault();
  handleSubmit(event.target);
});
signUpButton.on("click", function (event) {
  event.preventDefault();
  handleSubmit(event.target);
});
signOutButton.on("click", function (event) {
  event.preventDefault();
  signOut(auth).catch(function (error) {
    createAlert(
      "danger",
      `
      <h3>Uh oh!</h3>
      <hr>
      <p class='mb-0'>Sign out error: ${error.message}</p>
      `
    );
  });
});
