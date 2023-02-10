import { db, auth, onAuthStateChanged } from "./utils/firebase.js";
import {
  getDocs,
  getDoc,
  collection,
  doc,
  runTransaction,
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

import {
  getStorage,
  ref,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-storage.js";

var user;
onAuthStateChanged(auth, function (u) {
  if (u) {
    user = u;
  } else {
    document.getElementById("like-count").style.display = "none";
    document.getElementById("like-button").style.display = "none";
  }
});

// Create a reference with an initial file path and name
const storage = getStorage();
var placePhoto = [];
async function getAllDataOnce() {
  await getDocs(collection(db, "post")).then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      placePhoto.push(doc.data());
    });
    placePhoto.forEach(function (obj, index) {
      const newObj = { ...obj, index: index };
      placePhoto[index] = newObj;
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

    container.dataset.index = i;
    container.dataset.title = placePhoto[i].title;
    container.dataset.description = placePhoto[i].description;
    container.dataset.time = placePhoto[i].postTime;
    container.dataset.locationName = placePhoto[i].locationName;
    container.dataset.locationAddress = placePhoto[i].locationAddress;
    container.dataset.coords = placePhoto[i].locationCoords;
    container.dataset.displayName = placePhoto[i].displayName;
    container.dataset.id = placePhoto[i].id;
    container.dataset.likes = placePhoto[i].likes;
    if (user !== undefined) {
      container.dataset.hasliked = placePhoto[i].likesUserIDs.includes(
        user.uid
      );
    }

    // This shows the modal when a tile is clicked on
    container.addEventListener("click", function (element) {
      const mc = document.getElementById("modal__container");
      const m1 = document.getElementById("modal__card");
      mc.style.display = "flex";
      document.getElementById("modal__title").innerHTML =
        container.dataset.title;
      document.getElementById("modal__user").innerText =
        "By " + container.dataset.displayName;
      document
        .getElementById("modal__image")
        .setAttribute("src", container.dataset.imageURL);
      document.getElementById("modal__description").innerHTML =
        container.dataset.description;
      document.getElementById("like-count").innerHTML = container.dataset.likes;

      document
        .getElementById("like-button")
        .addEventListener("click", async function () {
          try {
            const docRef = doc(db, "post", `${container.dataset.id}`);
            await runTransaction(db, async (transaction) => {
              const sfDoc = await transaction.get(docRef);
              if (!sfDoc.exists()) {
                throw "Document does not exist!";
              }
              let newLikesUserIDs = sfDoc.data().likesUserIDs;
              let newLikes = sfDoc.data().likes;
              if (newLikesUserIDs.includes(user.uid)) {
                newLikes--;
                newLikesUserIDs = newLikesUserIDs.filter(
                  (id) => id !== user.uid
                );
              } else {
                newLikes++;
                newLikesUserIDs.push(user.uid);
              }

              document.getElementById("like-count").innerHTML = newLikes;
              transaction.update(docRef, {
                likes: newLikes,
                likesUserIDs: newLikesUserIDs,
              });
            });
          } catch (error) {
            console.log(error);
          }
        });
    });

    const image = document.createElement("img");
    image.classList.add("gallery__image-img");
    image.style.objectFit = "cover";
    image.style.height = "100%";
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
    document
      .querySelector("#gallery")
      .querySelector("#images__container")
      .append(container);
    var pathReference = ref(storage, list[i].path);
    await getDownloadURL(pathReference)
      .then((url) => {
        var img = document.getElementById("image" + i);
        img.setAttribute("src", url);
        container.dataset.imageURL = url;
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

document.getElementById("modal__button").addEventListener("click", function () {
  document.getElementById("modal__container").style.display = "none";
});

window.onload = getAllDataOnce;
function openPost(element) {}
