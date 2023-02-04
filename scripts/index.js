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
  const resultsList = data.features.map((feature) => {
    const div = document.createElement("div");
    div.className = "search__result";
    div.innerHTML = `
      <h3>${feature.text}</h3>
      ${
        feature.properties.category !== undefined
          ? "<p>" + feature.properties.category + "</p>"
          : ""
      }
      <p>${feature.place_name.replace(feature.text + ", ", "")}</p>
    `;
    div.addEventListener("click", () => {
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
    return div;
  });

  const resultsDiv = document.createElement("div");
  resultsDiv.id = "search__results";
  resultsDiv.append(...resultsList);
  const searchContainer = document.querySelector("#aside__header");
  searchContainer.parentNode.insertBefore(
    resultsDiv,
    searchContainer.nextSibling
  );
}
//Gets the current location of the user and calls Mapbox
function getCurrentLocation() {
  function success(position) {
    console.log(position.coords.latitude, position.coords.longitude, position.coords.accuracy);
    console.log((Math.random() - 0.5) * 360, (Math.random() - 0.5) * 100)
    map.flyTo({
      center: [position.coords.longitude,position.coords.latitude],
      essential: true,
      zoom: 15,
    });

  }
  navigator.geolocation.getCurrentPosition(success);

}

function searchLocation() {
  const resultsDiv = document.querySelector("#search__results");
  if (resultsDiv) {
    resultsDiv.parentNode.removeChild(resultsDiv);
  }

  const input = document.querySelector("#search__input").value;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${input}.json?access_token=${mapboxgl.accessToken}&limit=10`;
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      showResults(data);
      return data;
    });
}

// Listens for an enter key press on the search input
const searchInput = document.querySelector("#search__input");
searchInput.addEventListener("keyup", (event) => {
  if (event.keyCode === 13) {
    event.preventDefault();
    searchLocation();
  }
});

//for add_button to display the menu
document
  .getElementById("side__menu__button")
  .addEventListener("click", function () {
    document.getElementById("side__menu").style.display = "block";
    document.getElementById("side__menu__button").style.display = "none";
  });
//for side__menu__back to hide the menu
document
  .getElementById("side__menu__back")
  .addEventListener("click", function () {
    document.getElementById("side__menu__button").style.display = "block";
    document.getElementById("side__menu").style.display = "none";
  });


//For Add Place button to show the add__place__interface
$("#add__place__button").on("click",function(){
  $("#add__place__interface").css("display","flex");
  $("#add__place__interface").toggleClass("float-out");
  console.log("HIHI");
  })
$(".float-out").css({
  right: "0"
});
//for back button to hide add__place__interface
$("#add__place__back__button").on("click",function(){
  $("#add__place__interface").css("display","none");
})

//for Post button to do input validation then POST into firebase server
let titleField=document.getElementById("title")
let descriptionField= document.getElementById("description")

console.log(titleField,descriptionField,document.getElementById("add__place__submit"))
$("#add__place__form").submit(function(event){
  event.preventDefault(); 
  let description=descriptionField.value;
  let title=titleField.value
  console.log(title,description);
  if(title.length<5){
    $("#add__place__form__title").placeholder="Title (Minimum 5-25 characters allowed)"
  }
})

