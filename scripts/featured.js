import { db } from "./utils/firebase.js";
import {
  getDocs,
  getDoc,
  collection,
  doc,
  runTransaction
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
    container.dataset.time=placePhoto[i].postTime
    container.dataset.locationName=placePhoto[i].locationName
    container.dataset.locationAddress=placePhoto[i].locationAddress
    container.dataset.coords=placePhoto[i].locationCoords
    container.dataset.displayName=placePhoto[i].displayName
    container.dataset.id=placePhoto[i].id
    container.dataset.likes=placePhoto[i].likes
    container.dataset.hasliked=false
    //This shows the modal when a tile is clicked on

    container.addEventListener("click",function(element){
      const mc=document.getElementById("modal__container")
      const m1=document.getElementById("modal-1")
      mc.style.display="flex";
      document.getElementById("modal-title").innerHTML=container.dataset.title;
      document.getElementById("modal-user").querySelector("span").innerHTML=container.dataset.displayName;
      document.getElementById("modal-image").setAttribute("src",container.dataset.imageURL);
      document.getElementById("modal-description").innerHTML=container.dataset.description;
   
        document.getElementById("like-button").addEventListener("click", async function(){
          console.log("Before",container.dataset.likes)
          try{
            console.log(container.dataset.id)
            const docRef=doc(db,"post",`${container.dataset.id}`); 
            const newLikes= await runTransaction(db, async (transaction) => {
              const sfDoc = await transaction.get(docRef);
              if (!sfDoc.exists()) {
                throw "Document does not exist!";
              }
              console.log(container.dataset.likes)
              if (container.dataset.hasliked==false){
                const newLikes = sfDoc.data().likes + 1;
                container.dataset.likes+=1
                container.dataset.hasliked=true
                transaction.update(docRef, { likes: newLikes })
              }
              else{
                const newLikes = sfDoc.data().likes - 1;
                container.dataset.likes-=1
                container.dataset.hasliked=false
                transaction.update(docRef, { likes: newLikes })
              }
              console.log("After",container.dataset.likes)

              
              
              


            })



          }catch(error){
          console.log("Error getting likes",error)
          }
          })
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
        container.dataset.imageURL=url
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
console.log(document.getElementById("modal__button"))
 document.getElementById("modal__button").addEventListener("click",function(){
  document.getElementById("modal__container").style.display="none";
 })

window.onload = getAllDataOnce;
function openPost(element){ 


}