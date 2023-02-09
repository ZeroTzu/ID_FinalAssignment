import { db } from "./utils/firebase.js";
import {
  getDocs,
  collection,
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

import {
  getStorage,
  ref,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-storage.js";

// Create a reference with an initial file path and name
const storage = getStorage();
var placePhoto = []    ;
async function getAllDataOnce() {
  await getDocs(collection(db, "post")).then((querySnapshot) => {

    
    querySnapshot.forEach((doc) => {
      placePhoto.push(doc.data());
    });
    placePhoto.forEach(function(obj,index ){
      const newObj={...obj,index:index}
      placePhoto[index]=newObj
      console.log(newObj)
    })
    getPhoto(placePhoto);
  });
}
var list = [];
async function getPhoto(photoDocsList) {
  photoDocsList.forEach((element) => {
    element.photoArray.forEach((photo) => {
      list.push({
        path: photo,
        locationName: element.locationName,
        postTime: element.postTime,
        title: element.title,
      });
    });
  });

  for (let i = 0; i < list.length; i++) {
    const container = document.createElement("div");
    container.classList.add(
      "gallery__image-container",
      "col-xs-6",
      "col-sm-4",
      "border",
      "border-white",
      "p-0"
    );
    container.dataset.index=i
    container.dataset.title=placePhoto[i].title
    container.dataset.description=placePhoto[i].description
    container.dataset.time=placePhoto[i].postTIme
    container.dataset.locationName=placePhoto[i].locationName
    container.dataset.locationAddress=placePhoto[i].locationAddress
    container.dataset.coords=placePhoto[i].locationCoords
    
    container.addEventListener("click",function(element){
      console.log(container.dataset)
    })

    const image = document.createElement("img");
    image.classList.add("gallery__image-img");
    image.style.objectFit="cover";
    image.style.height="100%";
    image.id = "image" + i;

    const textContainer = document.createElement("div");
    textContainer.classList.add("gallery__image-text");
    textContainer.innerHTML = `
    <h5>${list[i].title}</h5>
    <span>${list[i].locationName}</span>
    <span>${new Date(list[i].postTime.seconds * 1000).toDateString()}</span>
    `;

    container.append(image);
    container.append(textContainer);
    document.querySelector("#gallery").querySelector("#images__container").append(container);
    var pathReference = ref(storage, list[i].path);
    await getDownloadURL(pathReference)
      .then((url) => {
        var img = document.getElementById("image" + i);
        img.setAttribute("src", url);
      })
      .catch((error) => {
        // A full list of error codes is available at
        // https://firebase.google.com/docs/storage/web/handle-errors
        switch (error.code) {
          case "storage/object-not-found":
            // File doesn't exist
            break;
          case "storage/unauthorized":
            // User doesn't have permission to access the object
            break;
          case "storage/canceled":
            // User canceled the upload
            break;

          // ...

          case "storage/unknown":
            // Unknown error occurred, inspect the server response
            break;
        }
      });
  }
}
window.onload = getAllDataOnce;
function openPost(element){ 


}