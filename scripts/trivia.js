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

const gameContainerElement = $("#game__container");
const gameContainerLoaderElement = $("#game__container-loader");
const guessFieldElement = $("#guess__input");
const attemptButtonElement = $("#guess__attempt");
const skipButtonElement = $("#guess__skip");
var gSelectedPhoto,
  attempts,
  user,
  pastLocations = [];

onAuthStateChanged(auth, function (u) {
  if (!u) {
    window.location.href = "/auth.html";
  } else {
    user = u;
  }
});

function hideIntro() {
  const introElement = $("#intro");
  introElement.css("opacity", 0);
  setTimeout(function () {
    introElement.remove();
    startRound();
  }, 500);
}
window["hideIntro"] = hideIntro;

function setButtonsDisabled(state) {
  attemptButtonElement.prop("disabled", state);
  skipButtonElement.prop("disabled", state);
}

function handleRestart() {
  setButtonsDisabled(true);
  startRound(true);
}
window.handleRestart = handleRestart;

async function fetchRandomPhoto() {
  const snapshot = await getDocs(collection(db, "post"));
  var selectedPhoto;
  while (true) {
    selectedPhoto =
      snapshot.docs[Math.floor(Math.random() * snapshot.docs.length)].data();
    if (!pastLocations.includes(selectedPhoto.photoArray[0])) {
      pastLocations.push(selectedPhoto.photoArray[0]);
      break;
    } else if (pastLocations.length === snapshot.docs.length) {
      alert("You've seen all the photos! Restarting...");
      pastLocations = [];
      break;
    } else {
      continue;
    }
  }
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
  const input = guessFieldElement.val();
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${input}.json?promximity=${[
    gSelectedPhoto.locationCoords[0],
    gSelectedPhoto.locationCoords[1],
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
      gSelectedPhoto.locationCoords[1],
      gSelectedPhoto.locationCoords[0]
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
      } to figure out where this is. This is ${
        gSelectedPhoto.locationName
      } at ${gSelectedPhoto.locationAddress}. ${
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
  const gameImageElement = $(
    '<img class="h-100 w-100 min-h-50 object-fit-cover p-0" />'
  );
  const mapContainerElement = $(
    '<div class="position-absolute end-0 bottom-0 w-25"></div>'
  );
  const mapImageElement = $('<img class="bg-transparent ratio ratio-1x1" />');

  // Fetches the map of the place and adds it to mapImageElement
  const [longitude, latitude] = selectedPhoto.locationCoords;
  mapImageElement.prop(
    "src",
    `https://api.mapbox.com/styles/v1/arashnrim/cldmza7li000t01qt6ypmzlwy/static/${longitude},${latitude},11/256x256?access_token=pk.eyJ1IjoiYXJhc2hucmltIiwiYSI6ImNsZGU1MjgybzA1ZGczcG81aTRlYnNsc2wifQ.pl_hnGv5vMnM1Yi5QXDmYA`
  );
  mapImageElement.prop("alt", "Map of the place");

  // Fetches the place's image and adds it to gameImageElement
  await getDownloadURL(ref(storage, selectedPhoto.photoArray[0])).then(
    function (url) {
      gameImageElement.prop("src", url);
      gameImageElement.prop("alt", "Image of the place");
    }
  );

  gameContainerLoaderElement.siblings().remove();
  mapContainerElement.append(mapImageElement);
  gameContainerElement.append(gameImageElement, mapContainerElement);
}

async function resetRound() {
  // Resets all the variables and elements back to their initial forms
  setButtonsDisabled(true);
  gSelectedPhoto = undefined;
  attempts = [];
  guessFieldElement.val("");
  gameContainerLoaderElement.removeClass("opacity-0").addClass("opacity-100");
}

async function startRound(delayButtonEnable = false) {
  resetRound();

  setTimeout(async function () {
    fetchRandomPhoto()
      .then(async function (selectedPhoto) {
        gSelectedPhoto = selectedPhoto;
        await displayImages(selectedPhoto);
      })
      .then(function () {
        if (!delayButtonEnable) {
          setButtonsDisabled(false);
          gameContainerLoaderElement
            .removeClass("opacity-100")
            .addClass("opacity-0");
        } else {
          setTimeout(function () {
            setButtonsDisabled(false);
            gameContainerLoaderElement
              .removeClass("opacity-100")
              .addClass("opacity-0");
          }, 2500);
        }
      });
  }, 500);
}
window["startRound"] = startRound;

var keyupTimeout;
guessFieldElement.on("keyup", function (event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    clearTimeout(keyupTimeout);
    keyupTimeout = setTimeout(function () {
      checkAnswer();
    }, 500);
  }
});
