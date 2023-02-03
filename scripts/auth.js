const emailField = document.getElementById("email");
const passwordField = document.getElementById("password");
const signInButton = document.getElementById("signIn");
const signUpButton = document.getElementById("signUp");
const FIREBASE_API_KEY = "AIzaSyDOTQFVNf8Uryge39sxBAhmVjhOkzjYiik";

if (document.cookie !== "") {
  if (document.referrer === window.location.href) {
    window.location.href = "/";
  } else {
    window.location.href = document.referrer;
  }
}

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
      url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
      break;

    case "signUp":
      url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`;
      break;
  }

  await fetch(url, {
    method: "POST",
    body: JSON.stringify(payload),
  })
    .then(async (response) => {
      if (response.ok) {
        // Handle if data is OK
        const data = await response.json();
        const { idToken, refreshToken, expiresIn, localId } = data;
        const cookies = [
          { idToken: idToken },
          { refreshToken: refreshToken },
          { localId: localId },
        ];

        cookies.forEach(function (cookie) {
          const key = Object.keys(cookie)[0];
          const value = cookie[key];
          const expiryTime = new Date(new Date().getTime() + expiresIn * 1000);
          document.cookie = `${key}=${value}; expires=${expiryTime.toUTCString()}; path=/; SameSite=Strict`;
        });

        window.location.href = "/";
      } else {
        return response.text().then((text) => {
          const code = JSON.parse(text).error.message;
          let message;

          switch (code) {
            case "EMAIL_NOT_FOUND":
              message =
                "The email address you've entered doesn't match any account. Try again or click 'Sign Up' to create a new account.";
              break;
            case "INVALID_PASSWORD":
              message =
                "The password you've entered for the given email address is incorrect. Try again.";
              break;
            case "EMAIL_EXISTS":
              message =
                "The email address you're trying to use already exists. Try again or click 'Sign In' to sign in to your account.";
              break;
            case "TOO_MANY_ATTEMPTS_TRY_LATER":
              message =
                "You've made too many unsuccessful attempts. Try again later.";
              break;
            case "WEAK_PASSWORD : Password should be at least 6 characters":
              message =
                "The password you've entered is too weak. Enter a stronger password (at least 6 characters) and try again";
              break;
            default:
              message = "Something went wrong. Try again later.";
              break;
          }

          throw new Error(message);
        });
      }
    })
    .catch((error) => {
      createAlert(
        "danger",
        `
        <h3>Uh oh!</h3>
        <hr>
        <p class='mb-0'>${error.message}</p>
        `
      );
    });
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

emailField.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    handleSubmit({ id: "signIn" });
  }
});
passwordField.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    handleSubmit({ id: "signIn" });
  }
});
