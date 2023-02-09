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

async function getAllDataOnce() {
  await getDocs(collection(db, "post")).then((querySnapshot) => {
    var placePhoto = [];
    querySnapshot.forEach((doc) => {
      placePhoto.push(doc.data());
    });
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

    const image = document.createElement("img");
    image.classList.add("gallery__image-img");
    image.id = "image" + i;

    const textContainer = document.createElement("div");
    textContainer.classList.add("gallery__image-text");
    textContainer.innerHTML = `
    <h2>${list[i].title}</h2>
    <span>${list[i].locationName}</span>
    <span>${new Date(list[i].postTime.seconds * 1000).toDateString()}</span>
    `;

    container.append(image);
    container.append(textContainer);
    document.querySelector("#gallery > .row").append(container);
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
