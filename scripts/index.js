import {
  auth,
  collection,
  db,
  doc,
  onAuthStateChanged,
  ref,
  setDoc,
  storage,
  uploadBytes,
} from "./utils/firebase.js";

var userIsSignedIn;
onAuthStateChanged(auth, (user) => {
  if (user) {
    userIsSignedIn = true;
  } else {
    userIsSignedIn = false;
    $("#add-place__button").css("display", "none");
  }
});

// Loads the Mapbox GL JS library and creates a map
mapboxgl.accessToken =
  "pk.eyJ1IjoiYXJhc2hucmltIiwiYSI6ImNsZGU1MjgybzA1ZGczcG81aTRlYnNsc2wifQ.pl_hnGv5vMnM1Yi5QXDmYA"; // Add your Mapbox access token here
var map = new mapboxgl.Map({
  container: "map__canvas",
  projection: "globe",
  style: "mapbox://styles/mapbox/outdoors-v12",
  zoom: 2.25,
  center: [103.8198, 1.3521],
});

map.on("style.load", () => {
  map.setFog({
    color: "rgb(186, 210, 235)", // Lower atmosphere
    "high-color": "rgb(36, 92, 223)", // Upper atmosphere
    "horizon-blend": 0.02, // Atmosphere thickness (default 0.2 at low zooms)
    "space-color": "rgb(11, 11, 25)", // Background color
    "star-intensity": 0.6, // Background star brightness (default 0.35 at low zooms )
  });
});

map.on("load", async () => {
  const loader = document.querySelector("#map__loader");
  await setTimeout(10000);
  loader.style.opacity = 0;
});

// Calls the Mapbox Geocoding API to search for a location then displays the results
const markers = [];
function showResults(data) {
  const resultsDiv = $(`<div id="search__results"></div>`);
  if (resultsDiv.children().length > 0) {
    resultsDiv.empty();
  }

  data.features.map(function (feature) {
    const div = $(`<div class="search__result"></div>`);
    div.css("position", "relative");
    div.data("coords", [
      feature.geometry.coordinates[0],
      feature.geometry.coordinates[1],
    ]);
    div.data("name", [feature.place_name]);
    div.html(`
      <h3>${feature.text}</h3>
      ${
        feature.properties.category !== undefined
          ? "<p>" + feature.properties.category + "</p>"
          : ""
      }
      <p>${feature.place_name.replace(feature.text + ", ", "")}</p>
    `);

    const addToPost = $(`<button class="add-to-post">Add</button>`);
    addToPost.css("position", "absolute");
    addToPost.css("top", "0");
    addToPost.css("right", "0");

    div.append(addToPost);

    addToPost.on("click", function () {
      userCurrentLocationCoords = div.data("coords");
      userCurrentLocationName = div.data("name");
      $("#add-place__form-location").text(`${userCurrentLocationName}`);
      $("#add-place__container").css("display", "flex");
      checkFields();
    });

    div.on("click", () => {
      markers.forEach((marker) => {
        marker.remove();
      });
      map.flyTo({
        center: feature.center,
        essential: true,
        zoom: 15,
      });
      const marker = new mapboxgl.Marker().setLngLat(feature.center).addTo(map);
      markers.push(marker);
    });

    resultsDiv.append(div);
  });

  console.log(resultsDiv);
  $("#topbar").after(resultsDiv);
}

function searchLocation() {
  const resultsDiv = $("#search__results");
  if (resultsDiv.length > 0) {
    resultsDiv.remove();
  }

  const input = $("#search__input").val();
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${input}.json?access_token=${mapboxgl.accessToken}&limit=10`;
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      showResults(data);
      return data;
    });
}

//Gets the current coords of user, calls Mapbox inputing the coords, then gets the name of the closest match.
var userCurrentLocationCoords, userCurrentLocationName;
function getCurrentLocation() {
  async function success(position) {
    userCurrentLocationCoords = [
      position.coords.longitude,
      position.coords.latitude,
    ];
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${position.coords.longitude},${position.coords.latitude}.json?access_token=${mapboxgl.accessToken}`;
      const response = await fetch(url);
      const results = await response.json();
      userCurrentLocationName = results.features[0].place_name;
      $("#add-place__form-location").text(`${userCurrentLocationName}`);
      checkFields();
    } catch (error) {
      console.log("Error", error);
    }

    map.flyTo({
      center: [position.coords.longitude, position.coords.latitude],
      essential: true,
      zoom: 15,
    });
  }

  navigator.geolocation.getCurrentPosition(success);
}
$("#search__button").on("click", function () {
  searchLocation();
});

// Disables the search button if the input is empty
$("#search__input").on("input", function () {
  const input = $("#search__input").val();
  if (input.length > 0) {
    $("#search__button").prop("disabled", false);
  } else {
    $("#search__button").prop("disabled", true);
  }
});

// Listens for an enter key press on the search input
const searchInput = document.querySelector("#search__input");
searchInput.addEventListener("keyup", (event) => {
  if (event.keyCode === 13) {
    event.preventDefault();
    $("#search__button").click();
  }
});

// Toggles the side menu when the menu button is clicked
$("#side-menu__button").on("click", function () {
  $("#side-menu__container").css("display", "block");
  $("#side-menu__button").css("display", "none");
});

$("#side-menu__back").on("click", function () {
  $("#side-menu__button").css("display", "block");
  $("#side-menu__container").css("display", "none");
});

// Gets the current location when clicked
$("#get-location").on("click", function () {
  getCurrentLocation();
});

// Displays the add place container when the add place button is clicked
$("#add-place__button").on("click", function () {
  $("#add-place__container").css("display", "flex");
});

// Hides the add place container when the back button is clicked
$("#add-place__back").on("click", function () {
  $("#add-place__container").css("display", "none");
});

$(".float-out").css({
  right: "0",
});

var images;
$("#add-place__form").submit(async function (event) {
  event.preventDefault();
  let title = $("#add-place__form-title").val();
  let description = $("#add-place__form-description").val();
  if (userIsSignedIn === false) {
    alert("Please sign in before posting!");
    return;
  } else if (
    userCurrentLocationName === undefined ||
    userCurrentLocationCoords === undefined
  ) {
    alert("Please select a location!");
    return;
  } else {
    let user = auth.currentUser,
      uid = user.uid,
      userName = user.displayName,
      currentDate = new Date();
    console.log(`UserName: ${userName} UserID: ${uid}`);
    let postDoc = doc(collection(db, "post"), `${uid}_${format(currentDate)}`);
    let storageRef = ref(storage, `images/${images[0].name}`);
    try {
      await uploadBytes(storageRef, images[0])
        .then(async function () {
          await setDoc(postDoc, {
            uid: uid,
            displayName: userName,
            title: title,
            description: description,
            postTime: currentDate,
            locationName: userCurrentLocationName[0].split(", ")[0],
            locationAddress: userCurrentLocationName[0]
              .split(", ")
              .slice(1)
              .join(", "),
            locationCoords: userCurrentLocationCoords,
            photoArray: [`images/${images[0].name}`],
            likes: 0,
            likesUserIDs: [],
          }).catch(function (error) {
            throw error;
          });
        })
        .catch(function (error) {
          throw error;
        });
    } catch (error) {
      alert(
        "Sorry, something went wrong when uploading your post. Error code: " +
          error
      );
    }
  }
});
function format(inputDate) {
  let date, month, year;

  date = inputDate.getDate();
  month = inputDate.getMonth() + 1;
  year = inputDate.getFullYear();

  date = date.toString().padStart(2, "0");

  month = month.toString().padStart(2, "0");

  return `${date}${month}${year}${inputDate.getHours()}${inputDate.getMinutes()}${inputDate.getSeconds()}`;
}

// Highlights the image holder when the user drags an image over it
$("#add-place__form-holder").on("dragover", function (event) {
  event.preventDefault();
  $("#add-place__form-holder").addClass("image-hovering");
});

$("#add-place__form-holder").on("dragleave", function (event) {
  event.preventDefault();
  $("#add-place__form-holder").removeClass("image-hovering");
});

// Handles the image upload when the user drops an image on the image holder
var userFiles;
function updateShowImage(image) {
  let thumbnailElement = $("#add-place__form-holder > .post-image");
  $("#add-place__form-holder > #lottie-placeholder").css("display", "none");
  if (thumbnailElement.length == 0) {
    thumbnailElement = $("<img class='post-image'>");
  } else {
    thumbnailElement.prop("src", "");
  }
  thumbnailElement.css("max-width", $("#add-place__form-holder").width());
  thumbnailElement.prop("src", URL.createObjectURL(image));

  $("#add-place__form-holder").append(thumbnailElement);
  $("#add-place__form-holder").removeClass("image-hovering");
}

// Checks if the user has uploaded an image
function didUploadImageType(files) {
  let isAllImage = true;
  let imageTypes = ["image/png", "image/jpeg"];
  if (files.length < 1) {
    isAllImage = "nothing";
  }
  for (let i = 0; i < files.length; i++) {
    if (imageTypes.includes(files[i].type) == false) {
      isAllImage = false;
      break;
    }
  }
  if (isAllImage == false) {
    alert(
      "You uploaded a file that is not an image (PNG or JPEG files). Please try again."
    );
  } else if (isAllImage == "nothing") {
    alert("You have not uploaded any photos. Please add one and try again.");
  }

  return isAllImage;
}

function resetPhoto() {
  $("#add-place__form-holder > .post-image").remove();
  $("#add-place__form-holder > #lottie-placeholder").css("display", "block");
}

$("#add-place__form-holder").on("drop", function (event) {
  event.preventDefault();
  userFiles = null;
  images = null;
  userFiles = event.originalEvent.dataTransfer.files;
  let isAllImage = didUploadImageType(userFiles);
  if (isAllImage !== true) {
    resetPhoto();
    return;
  }
  images = userFiles;
  updateShowImage(images[0]);
});

// Handles the image upload when the user clicks on the image holder
$("#add-place__form-holder").on("click", function () {
  var input = $("<input></input>");
  input.prop("type", "file");
  input.change(function (e) {
    var userFiles = e.target.files;
    let isAllImage = didUploadImageType(userFiles);
    if (isAllImage !== true) {
      resetPhoto();
      return;
    }
    images = userFiles;
    updateShowImage(images[0]);
  });

  input.click();
});

// Displays a semi-transparent div over the image holder when the user hovers over it
$("#add-place__form-holder").on("mouseenter", function (event) {
  event.stopPropagation();
  if (event != "dragover") {
    const seeThroughDiv = $(".see-through-div");
    seeThroughDiv.fadeTo(100, 0.4);
  }
});
$("#add-place__form-holder").on("mouseleave", function (event) {
  if (event != "dragover" && event != "hover") {
    const seeThroughDiv = $(".see-through-div");
    seeThroughDiv.fadeOut(100);
  }
});

// Checks if the fields are valid
function checkFields() {
  let title = $("#add-place__form-title").val();
  let description = $("#add-place__form-description").val();
  let location = $("#add-place__form-location").val();
  let isAllValid = true;
  if (title.length < 1) {
    isAllValid = false;
  } else if (description.length < 1) {
    isAllValid = false;
  } else if (
    location ===
    "No location yet. Search for a place or use your current location."
  ) {
    isAllValid = false;
  }

  if (isAllValid) {
    $("#add-place__form-submit").prop("disabled", false);
  } else {
    $("#add-place__form-submit").prop("disabled", true);
  }
}

// Listens for input in the title and description fields
$("#add-place__form-title").on("input", function () {
  checkFields();
});
$("#add-place__form-description").on("input", function () {
  checkFields();
});
