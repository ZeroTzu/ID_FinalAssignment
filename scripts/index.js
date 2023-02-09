import {auth,app,onAuthStateChanged,db,storage ,getDocs ,collection , onSnapshot ,ref,uploadBytes,setDoc,doc} from "./utils/firebase.js";


// Loads the Mapbox GL JS library and creates a map

var userIsSignedIn;
onAuthStateChanged(auth, (user) => {
  if (user) {
    userIsSignedIn=true
  } else {
    // User is signed out
    userIsSignedIn=false
  }
});



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

//Gets the current coords of user,calls mapbox inputing the coords, gets name of the closest match,
var userCurrentLocationCoords;
var userCurrentLocationName;
function getCurrentLocation() {
  async function success(position) {
    userCurrentLocationCoords=[position.coords.longitude,position.coords.latitude]
    try{
      const url=`https://api.mapbox.com/geocoding/v5/mapbox.places/${position.coords.longitude},${position.coords.latitude}.json?access_token=${mapboxgl.accessToken}`;
      const response= await fetch(url);
      const results= await response.json();
      console.log(results);
      userCurrentLocationName=results.features[0].place_name;
      $("#location").html(function(i,currentHTML){
        return `Location: ${userCurrentLocationName}`
      });
    } catch(error){
      console.log("Error",error)
    }
    
    map.flyTo({
      center: [position.coords.longitude,position.coords.latitude],
      essential: true,
      zoom: 15,
    });

  }
  navigator.geolocation.getCurrentPosition(success);

}
$("#search__button").on("click",searchLocation())
$("#add__place__button").on("click",getCurrentLocation())
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
$("#add__place__button").on("click",async function(){
  $("#add__place__interface").css("display","flex");
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
var images;
$("#add__place__form").submit(async function(event){
  event.preventDefault(); 
  let title=document.getElementById("title").value;
  let description=document.getElementById("description").value;
  console.log(title,description,images[0]);
  console.log(description,title,document.getElementById("add__place__submit"))
  if(title.length<5){
    $("#add__place__form__title").placeholder="Title (Minimum 5-25 characters allowed)"
  }
  if (userIsSignedIn==false){
    console.log("Unable to post...user isn't signed in")
    //do something to alert user in html here PLS
    return
  }
  else{
    console.log("User IS signed in")
    let user=auth.currentUser;
    let uid=user.uid;
    let userName=user.displayName;
    let currentDate=new Date()
    console.log(`UserName: ${userName} UserID: ${uid}`)
    let postDoc =doc(collection(db,"post"),`${uid}_${format(currentDate)}`)
    let storageRef=ref(storage,`images/${images[0].name}`)//SOME ERROR HERE
    await uploadBytes(storageRef,images[0]).then((snapshot)=>{
      console.log('Uploaded a blob or file!')
  

      
      
    }).catch(function(error){
      console.log(error)
    }).finally(()=>{
      setDoc(postDoc,{ 
        uid: uid, 
        displayName: userName,
        title: title,
        description: description,
        postTime:currentDate,
        locationName:userCurrentLocationName,
        locationCoords:userCurrentLocationCoords,
        photoArray:[`photos/${images[0].name}`]
      })  
    })
  }
})
function format(inputDate) {
  let date, month, year;

  date = inputDate.getDate();
  month = inputDate.getMonth() + 1;
  year = inputDate.getFullYear();

    date = date
        .toString()
        .padStart(2, '0');

    month = month
        .toString()
        .padStart(2, '0');

  return `${date}${month}${year}${inputDate.getHours()}${inputDate.getMinutes()}${inputDate.getSeconds()}`;
}
//function to highlight imagebox when dragged over
document.getElementById("image__holder").addEventListener('dragover',function(event){
  event.preventDefault();
  console.log("drag over")
  document.getElementById("image__holder").classList.add("image__hover")
  
})
document.getElementById("image__holder").addEventListener('dragleave',function(event){
  event.preventDefault();
  document.getElementById("image__holder").classList.remove("image__hover")

})

//drop Handler for users to drop an image into image__holder
document.getElementById("image__holder").addEventListener("drop",function(event){
  event.preventDefault();
  function updateShowImage(image){
    console.log("Running updateImage")
    let thumbnailElement=document.getElementById("image__holder").querySelector(".post__image")
    if(!thumbnailElement){
      console.log(document.getElementById("image__holder").querySelector("#placeholder__lottie"));
      document.getElementById("image__holder").querySelector("#placeholder__lottie").style.display="none";
      thumbnailElement=document.createElement("img");
      thumbnailElement.style.maxWidth=("100%");
      thumbnailElement.style.maxHeight=("100%");
      thumbnailElement.classList.add("post__image");
      thumbnailElement.src=URL.createObjectURL(image);
      document.getElementById("image__holder").appendChild(thumbnailElement);
      console.log("Image drop initiated",image)
      document.getElementById("image__holder").classList.remove("image__hover")
    }
    else{
      console.log("Logged not")
      document.getElementById("image__holder").classList.remove("image__hover")
    }
    
  }
  let userFiles=event.dataTransfer.files
  console.log("Detected drop")
  let isAllImage=true;
  let imageTypes= ['image/png', 'image/jpeg'];
  if (userFiles.length<1){
    console.log("No Files Detected")
    return "nothing";
  }
  for (let i=0;i<userFiles.length;i++){
    if(imageTypes.includes(userFiles[i].type)==false){
      isAllImage=false;
      break;
    }
  }
  if(isAllImage==false){
    console.log("Unsupported file type detected: png and jpeg files only")
    return
  }
  images=[userFiles[0]];
  updateShowImage(images[0])
})

//onclick event and hover event for image__holder to activate file explorer
$("#image__holder").mouseenter(function(event){
  event.stopPropagation();
  console.log("mouse over event")
  if (event!="dragover"){
    const see__through__div=$("#see__through__div")
    see__through__div.fadeTo(100,0.4)
  }
})
document.getElementById("image__holder").addEventListener("mouseleave",function(event){
  console.log("mouse out event")
  if (event!="dragover"&&event!="hover"){
    const see__through__div=$("#see__through__div")
    see__through__div.fadeOut(100)
  }
})

