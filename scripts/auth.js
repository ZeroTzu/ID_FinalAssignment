// WARNING: The methods in this file are not secure. Since this academic
// module is oriented towards front-end development, it is not intended
// to be comprehensive and secure.

const usernameField = document.getElementById("username");
const keyField = document.getElementById("key");
const checkButton = document.getElementById("check");
const signInButton = document.getElementById("signIn");

async function handleCheckSubmit() {
  clearAlert();
  const username = usernameField.value;
  if (username === "") {
    createAlert(
      "danger",
      `
      <h2>:)</h2>
      <p class="mb-0">Please provide a username.</p>
      `
    );
    return;
  }

  checkButton.disabled = true;
  signInButton.classList.add("d-none");
  keyField.classList.add("d-none");
  const result = await usernameExists(username);

  if (result !== false) {
    keyField.classList.remove("d-none");
    signInButton.classList.remove("d-none");
  } else {
    let key = await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );
    const exportedKeyArray = new Uint8Array(
      await window.crypto.subtle.exportKey("raw", key)
    );
    const exportedKey = getStringedKey(exportedKeyArray);
    await createUser(exportedKey, username);
    return;
  }

  checkButton.disabled = false;
}

async function handleSignIn() {
  clearAlert();
  const username = usernameField.value;
  const key = keyField.value;
  if (username === "" || key === "") {
    createAlert(
      "danger",
      `
      <h2>:)</h2>
      <p class="mb-0">Please provide your username and/or key.</p>
      `
    );
    return;
  }
  signInButton.disabled = true;
  const user = await usernameExists(username);

  signInUser(user, key);
  signInButton.disabled = false;
}

async function usernameExists(username) {
  const users = await fetch(
    "https://idfinalassignment-8af7.restdb.io/rest/db-user",
    {
      headers: {
        "content-type": "application/json",
        "x-apikey": "63da313e3bc6b255ed0c4536",
        "cache-control": "no-cache",
      },
    }
  ).then((response) => response.json());

  const user = users.find((user) => user.username === username);
  return user ? user : false;
}

async function createUser(key, username) {
  const user = await fetch(
    "https://idfinalassignment-8af7.restdb.io/rest/db-user",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-apikey": "63da313e3bc6b255ed0c4536",
        "cache-control": "no-cache",
      },
      body: JSON.stringify({
        secret: key,
        username: username,
        points: 0,
      }),
    }
  ).then((res) => res.json());

  if (user === undefined) {
    createAlert(
      "danger",
      `
      <h2>Oh no!</h2>
      <p class="mb-0">Something went wrong. Please try again.</p>
      `
    );
  } else {
    localStorage.setItem("userID", user._id);
    createAlert(
      "success",
      `
      <h2>Account created!</h2>
      You can now sign in with this username and this key. <p><b>Please keep this key</b>; you'll need it again to sign in! Once done, <a href="/">click here to go back home</a>.</p>
      <hr>
      <b>Key:</b>
      <p class="mb-0 text-break font-monospace">${key}</p>
      `
    );
  }
}

function signInUser(user, key) {
  if (user.secret === key) {
    localStorage.setItem("userID", user._id);
    window.location.href = "/";
  } else {
    createAlert(
      "danger",
      `
      <h2>That's not right.</h2>
      <p class="mb-0">The key you've supplied is likely incorrect for the given username.</p>
      `
    );
  }
}

function getStringedKey(buffer) {
  const array = new Uint8Array(buffer);
  return Array.from(array)
    .map((byte) => byte.toString())
    .join("");
}

function createAlert(type, content) {
  if (usernameField.previousElementSibling) {
    usernameField.previousElementSibling.remove();
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
  usernameField.parentNode.insertBefore(alertDiv, usernameField);
}

function clearAlert() {
  const alert = document.getElementById("alert");
  if (alert) {
    alert.remove();
  }
}

usernameField.addEventListener("keyup", (event) => {
  if (event.code === 13) {
    event.preventDefault();
    handleCheckSubmit();
  }
});
