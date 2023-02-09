import { auth, db, storage } from "./utils/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import {
  runTransaction,
  doc,
  getDocs,
  collection,
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import {
  ref,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-storage.js";

const gameContainerElement = document.querySelector("#game__container");
const gameContainerLoaderElement = document.querySelector(
  "#game__container-loader"
);
const guessFieldElement = document.querySelector("#guess__input");
const attemptButtonElement = document.querySelector("#guess__attempt");
const skipButtonElement = document.querySelector("#guess__skip");
var place, attempts, user;

onAuthStateChanged(auth, function (u) {
  if (!u) {
    window.location.href = "/auth.html";
  } else {
    user = u;
  }
});

function hideIntro() {
  const introElement = document.getElementById("intro");
  introElement.style.opacity = 0;
  setTimeout(function () {
    introElement.parentNode.removeChild(introElement);
    startRound();
  }, 500);
}
window["hideIntro"] = hideIntro;

function setButtonsDisabled(state) {
  attemptButtonElement.disabled = state;
  skipButtonElement.disabled = state;
}

function handleRestart() {
  setButtonsDisabled(true);
  startRound(true);
}
window.handleRestart = handleRestart;

async function fetchRandomPhoto() {
  const snapshot = await getDocs(collection(db, "placePhoto"));
  const selectedPhoto =
    snapshot.docs[Math.floor(Math.random() * snapshot.docs.length)].data();

  return selectedPhoto;
}

async function updatePoints(points) {
  try {
    await runTransaction(db, async function (transaction) {
      const document = await transaction.get(doc(db, "users", user.uid));
      if (!document.exists()) {
        const payload = {
          Username: user.displayName,
          Points: points,
          TriviaHighScore: 0,
        };
        transaction.set(doc(db, "users", user.uid), payload);
      } else {
        const newPoints = document.data().Points + points;
        let reachedHighScore = false;
        if (points > document.data().TriviaHighScore) {
          reachedHighScore = true;
        }
        transaction.update(doc(db, "users", user.uid), {
          Points: newPoints,
          TriviaHighScore: reachedHighScore
            ? points
            : document.data().TriviaHighScore,
        });
      }
    });
    console.log("Update successful!");
  } catch (error) {
    alert(
      `Something went wrong while updating your points! Your points will not be updated. Error: ${error}`
    );
  }
}

async function checkAnswer() {
  setButtonsDisabled(true);
  const input = guessFieldElement.value;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${input}.json?promximity=${[
    place.coordinates.longitude,
    place.coordinates.latitude,
  ]}&access_token=pk.eyJ1IjoiYXJhc2hucmltIiwiYSI6ImNsZGU1MjgybzA1ZGczcG81aTRlYnNsc2wifQ.pl_hnGv5vMnM1Yi5QXDmYA&limit=10`;
  const places = await fetch(url)
    .then((response) => response.json())
    .then((data) => data.features);

  let found = false;
  let roundAttempts = [];

  // Calculates the difference between the user's input and the actual location
  // Credit to https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula/21623206#21623206!
  function calculateDistanceDifference(lat1, long1, lat2, long2) {
    var rad = 0.017453292519943295; // Calculated value deriving from Math.PI / 180; more optimized than Math.PI / 180
    var cos = Math.cos;
    var a =
      0.5 -
      cos((lat2 - lat1) * rad) / 2 +
      (cos(lat1 * rad) * cos(lat2 * rad) * (1 - cos((long2 - long1) * rad))) /
        2;

    return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km (Earth's radius)
  }

  places.forEach((gPlace) => {
    const [gLongitude, gLatitude] = gPlace.center;
    const distance = calculateDistanceDifference(
      gLatitude,
      gLongitude,
      place.coordinates.latitude,
      place.coordinates.longitude
    );

    if (distance < 10) {
      found = true;
    }
    roundAttempts.push(distance);
  });

  attempts.push(roundAttempts);
  const bestAttempt = Math.min(...roundAttempts);
  if (found) {
    const points = Math.trunc(
      20 - Math.min(...[attempts.length, 4]) - bestAttempt
    );
    alert(
      `You got it! You took ${attempts.length} ${
        attempts.length === 1 ? "try" : "tries"
      } to figure out where this is. This is ${place.name} at ${
        place.address
      }. ${
        bestAttempt <= 1
          ? `You hit the nail on the head!`
          : `Your nearest guest was ${
              Math.round(bestAttempt * 100) / 100
            } kilometres away.`
      } You earned ${points} points!`
    );

    updatePoints(points);
    startRound();
  } else {
    alert(
      `${
        bestAttempt <= 50
          ? bestAttempt <= 25
            ? "You're almost there!"
            : "Getting warm!"
          : "You're not quite there yet, but you're still doing good."
      } ${
        attempts.length > 1
          ? `You're now at most ${
              Math.round(bestAttempt * 100) / 100
            } kilometres away.`
          : `Your closest match is ${
              Math.round(bestAttempt * 100) / 100
            } kilometres away.`
      } Keep going!`
    );
    setButtonsDisabled(false);
  }
}
window["checkAnswer"] = checkAnswer;

async function displayImages(selectedPhoto) {
  // Creates the required elements and displays the images
  const gameImageElement = document.createElement("img");
  const mapContainerElement = document.createElement("div");
  const mapImageElement = document.createElement("img");
  gameContainerLoaderElement.classList.add("d-none");
  var gameImageLoaded = false,
    mapImageLoaded = false;

  // Fetches the map of the place and adds it to mapImageElement
  const { longitude, latitude } = selectedPhoto.location.coordinates;
  mapImageElement.src = `https://api.mapbox.com/styles/v1/arashnrim/cldmza7li000t01qt6ypmzlwy/static/${longitude},${latitude},11/256x256?access_token=pk.eyJ1IjoiYXJhc2hucmltIiwiYSI6ImNsZGU1MjgybzA1ZGczcG81aTRlYnNsc2wifQ.pl_hnGv5vMnM1Yi5QXDmYA`;
  mapImageElement.alt = "Map of the place";
  mapImageElement.classList.add("bg-transparent", "ratio", "ratio-1x1");

  // Configures the map container with specific Bootstrap classes
  mapContainerElement.classList.add(
    "position-absolute",
    "end-0",
    "bottom-0",
    "w-25"
  );

  // Fetches the place's image and adds it to gameImageElement
  await getDownloadURL(ref(storage, selectedPhoto.file)).then(function (url) {
    gameImageElement.src = url;
    gameImageElement.alt = "Image of the place";
    gameImageElement.classList.add(
      "h-100",
      "w-100",
      "min-h-50",
      "object-fit-cover",
      "p-0"
    );
  });

  if (gameContainerElement.hasChildNodes()) {
    while (gameContainerElement.firstChild) {
      gameContainerElement.removeChild(gameContainerElement.firstChild);
    }
  }

  mapContainerElement.appendChild(mapImageElement);
  gameContainerElement.appendChild(gameImageElement);
  gameContainerElement.appendChild(mapContainerElement);
  gameContainerLoaderElement.classList.add("d-none");

  // Add event listeners to both images and check if both have loaded
  gameImageElement.addEventListener("load", function () {
    gameImageLoaded = true;
    if (gameImageLoaded && mapImageLoaded) {
      gameContainerLoaderElement.classList.add("d-none");
    }
  });
  mapImageElement.addEventListener("load", function () {
    mapImageElement = true;
    if (gameImageLoaded && mapImageLoaded) {
      gameContainerLoaderElement.classList.add("d-none");
    }
  });
}

async function resetRound() {
  // Resets all the variables and elements back to their initial forms
  setButtonsDisabled(true);
  place = undefined;
  attempts = [];
  guessFieldElement.value = "";
  attemptButtonElement.disabled = true;
  skipButtonElement.disabled = true;
}

async function startRound(delayButtonEnable = false) {
  resetRound();

  fetchRandomPhoto()
    .then(async function (selectedPhoto) {
      place = selectedPhoto.location;
      await displayImages(selectedPhoto);
    })
    .then(function () {
      if (!delayButtonEnable) {
        setButtonsDisabled(false);
      } else {
        setTimeout(function () {
          setButtonsDisabled(false);
        }, 2500);
      }
    });
}
window["startRound"] = startRound;

var keyupTimeout;
guessFieldElement.addEventListener("keyup", function (event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    clearTimeout(keyupTimeout);
    keyupTimeout = setTimeout(function () {
      checkAnswer();
    }, 500);
  }
});
