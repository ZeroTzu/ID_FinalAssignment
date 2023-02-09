import { db } from "./utils/firebase.js";
import {
  getDocs,
  collection,
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-storage.js";

// Create a reference with an initial file path and name
const storage = getStorage();

async function getAllDataOnce() {
  await getDocs(collection(db, "placePhoto")).then((querySnapshot) => {
    var placePhoto = [];
    querySnapshot.forEach((doc) => {
      placePhoto.push(doc.data());
    });
    getPhoto(placePhoto)
  });
}
var list = []
async function getPhoto(photoDocsList){
  photoDocsList.forEach((element) => {
    list.push(element.file);   
  });
  for (let i = 0; i < list.length; i++) {
    document.body.innerHTML += '<div class="gallery"><img class="col-xs-6 col-sm-4 col-md-2 col-lg-2" id="image' + i + '"></div>'
    var text = "image" + i;
    var pathReference = ref(storage, list[i]);
    await getDownloadURL(pathReference)
    .then((url) => {
      var img = document.getElementById(text);
      img.setAttribute('src', url);
    })
    .catch((error) => {
      // A full list of error codes is available at
      // https://firebase.google.com/docs/storage/web/handle-errors
      switch (error.code) {
        case 'storage/object-not-found':
          // File doesn't exist
          break;
        case 'storage/unauthorized':
          // User doesn't have permission to access the object
          break;
        case 'storage/canceled':
          // User canceled the upload
          break;
  
        // ...
  
        case 'storage/unknown':
          // Unknown error occurred, inspect the server response
          break;
      }
  });
  }
}
  window.onload = getAllDataOnce;

