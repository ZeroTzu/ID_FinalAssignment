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
    // User is signed out
    userIsSignedIn = false;
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

  data.features.map(function (feature) {
    const div = $(`<div class="search__result"></div>`);
    div.css("position", "relative");
    div.data("coords", [feature.geometry.longitude, feature.geometry.latitude]);
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
      $("#add-place__form-location").html(function () {
        return `${userCurrentLocationName}`;
      });
      $("#add-place__container").css("display", "flex");
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

  $("#aside__header").after(resultsDiv);
}

function searchLocation() {
  const resultsDiv = $("#search__results");
  if (resultsDiv) {
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
      $("#add-place__form-location").html(function () {
        return `${userCurrentLocationName}`;
      });
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
    searchLocation();
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

//for Post button to do input validation then POST into firebase server
var images;
$("#add-place__form").submit(async function (event) {
  event.preventDefault();
  let title = $("#add-place__form-title").val();
  let description = $("#add-place__form-description").val();
  if (title.length < 5) {
    $("#add-place__form-title").prop(
      "placeholder",
      "Title (Minimum 5-25 characters allowed)"
    );
  }
  if (userIsSignedIn == false) {
    console.log("Unable to post...user isn't signed in");
    //do something to alert user in html here PLS
    return;
  } else {
    console.log("User IS signed in");
    let user = auth.currentUser;
    let uid = user.uid;
    let userName = user.displayName;
    let currentDate = new Date();
    console.log(`UserName: ${userName} UserID: ${uid}`);
    let postDoc = doc(collection(db, "post"), `${uid}_${format(currentDate)}`);
    let storageRef = ref(storage, `images/${images[0].name}`); //SOME ERROR HERE
    await uploadBytes(storageRef, images[0])
      .then((snapshot) => {
        console.log("Uploaded a blob or file!");
      })
      .catch(function (error) {
        console.log(error);
      })
      .finally(() => {
        setDoc(postDoc, {
          uid: uid,
          displayName: userName,
          title: title,
          description: description,
          postTime: currentDate,
          locationName: userCurrentLocationName.split(", ")[0],
          locationAddress: userCurrentLocationName
            .split(", ")
            .slice(1)
            .join(", "),
          locationCoords: userCurrentLocationCoords,
          photoArray: [`images/${images[0].name}`],
        });
      });
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
//function to highlight imagebox when dragged over
$("#add-place__form-holder").on("dragover", function (event) {
  event.preventDefault();
  $("#add-place__form-holder").addClass("image-hovering");
});

$("#add-place__form-holder").on("dragleave", function (event) {
  event.preventDefault();
  $("#add-place__form-holder").removeClass("image-hovering");
});

//drop Handler for users to drop an image into image__holder
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
function checkAllImages(files) {
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
    console.log("Unsupported file type detected: png and jpeg files only");
  } else if (isAllImage == "nothing") {
    console.log("No Files Detected");
  }

  return isAllImage;
}

$("#add-place__form-holder").on("drop", function (event) {
  event.preventDefault();
  userFiles = null;
  images = null;
  userFiles = event.originalEvent.dataTransfer.files;
  let isAllImage = checkAllImages(userFiles);
  if (isAllImage != true) {
    return;
  }
  images = userFiles;
  updateShowImage(images[0]);
});

//onclick event and hover event for image__holder to activate file explorer
$("#add-place__form-holder").on("click", function () {
  var input = $("<input></input>");
  input.prop("type", "file");
  input.change(function (e) {
    // getting a hold of the file reference
    var userFiles = e.target.files;
    // // setting up the reader
    // var reader = new FileReader();
    // // here we tell the reader what to do when it's done reading...
    // reader.onload = readerEvent => {
    //    userFiles = readerEvent.target.result; // this is the content!
    //    console.log( userFiles );
    // }
    let isAllImage = checkAllImages(userFiles);
    if (isAllImage != true) {
      console.log("Not all image");
      return;
    }
    images = userFiles;
    updateShowImage(images[0]);
  });

  input.click();
});

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
