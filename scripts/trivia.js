(function () {
  // Check if there is a valid idToken in the website's cookies
  if (document.cookie === "") {
    window.location.href = "/auth.html";
  }

  const gameImageElement = document.getElementById("game__image");
  const mapImageElement = document.getElementById("game__map");
  const guessFieldElement = document.querySelector("#guess__input");
  const attemptButtonElement = document.querySelector("#guess__attempt");
  const skipButtonElement = document.querySelector("#guess__skip");
  console.log(guessFieldElement)
  function hideIntro() {
    const introElement = document.getElementById("intro");
    introElement.style.opacity = 0;
    setTimeout(function () {
      introElement.parentNode.removeChild(introElement);
      startRound();
    }, 500);
  }
  window["hideIntro"] = hideIntro;

  async function fetchRandomPhoto() {
    const selectedPhoto = await fetch(
      "https://idfinalassignment-8af7.restdb.io/rest/db-placephoto",
      {
        headers: {
          "content-type": "application/json",
          "x-apikey": "63da313e3bc6b255ed0c4536",
          "cache-control": "no-cache",
        },
      }
    )
      .then((response) => response.json())
      .then((data) => data[Math.floor(Math.random() * data.length)]);
    return selectedPhoto;
  }

  async function updatePoints(points) {
    const ok = await fetch(
      `https://idfinalassignment-8af7.restdb.io/rest/db-user/${localStorage.getItem(
        "userID"
      )}`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-apikey": "63da313e3bc6b255ed0c4536",
          "cache-control": "no-cache",
        },
        body: JSON.stringify({
          $inc: { points: points },
          id: localStorage.getItem("userID"),
        }),
      }
    ).then((response) => response.ok);

    if (!ok) {
      alert(
        "Something went wrong while updating your points! Your points will not be updated."
      );
    }
  }

  async function checkAnswer() {
    console.log(attempts);
    const input = guessFieldElement.value;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${input}.json?promximity=${[
      place.longitude,
      place.latitude,
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
        place.latitude,
        place.longitude
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
    }
  }
  window["checkAnswer"] = checkAnswer;

  function displayMap(latitude, longitude) {
    mapImageElement.src = `https://api.mapbox.com/styles/v1/arashnrim/cldmza7li000t01qt6ypmzlwy/static/${longitude},${latitude},11/256x256?access_token=pk.eyJ1IjoiYXJhc2hucmltIiwiYSI6ImNsZGU1MjgybzA1ZGczcG81aTRlYnNsc2wifQ.pl_hnGv5vMnM1Yi5QXDmYA`;
    mapImageElement.classList.toggle("placeholder");
  }

  async function resetRound() {
    // Resets all the variables and elements back to their initial forms
    place = undefined;
    attempts = [];
    attemptButtonElement.disabled = true;
    skipButtonElement.disabled = true;

    const elements = [gameImageElement, mapImageElement];
    elements.forEach(function (element) {
      element.removeAttribute("src");
      element.classList.toggle("placeholder");
    });
  }

  async function startRound() {
    resetRound();

    fetchRandomPhoto()
      .then(function (selectedPhoto) {
        place = selectedPhoto.place[0];
        displayMap(
          selectedPhoto.place[0].latitude,
          selectedPhoto.place[0].longitude
        );
        gameImageElement.src = `https://idfinalassignment.arashnrim.me/media/${selectedPhoto.photo[0]}`;
        gameImageElement.classList.toggle("placeholder");
      })
      .then(function () {
        attemptButtonElement.disabled = false;
        skipButtonElement.disabled = false;
      });
  }
  window["startRound"] = startRound;
})();
