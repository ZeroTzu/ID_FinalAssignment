import { db } from "./utils/firebase.js";
import {
  getDocs,
  collection,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

async function GetAllDataOnce() {
  await getDocs(collection(db, "users")).then((querySnapshot) => {
    var users = [];
    querySnapshot.forEach((doc) => {
      users.push(doc.data());
    });
    users.sort(function compareFn(a, b) {
      return b.Points - a.Points;
    });
    AddAllItemsToTheTable(users);
  });
}

function GetAllDataRealtime() {
  onSnapshot(collection(db, "users"), (querySnapshot) => {
    var users = [];
    querySnapshot.forEach((doc) => {
      users.push(doc.data());
    });
    AddAllItemsToTheTable(users);
  });
}

var uNo = 0;
var tbody = document.getElementById("tbody1");

function AddItemToTable(username, points, ths) {
  var trow = document.createElement("tr");
  var td1 = document.createElement("td");
  var td2 = document.createElement("td");
  var td3 = document.createElement("td");
  var td4 = document.createElement("td");

  td1.innerHTML = ++uNo;
  td2.innerHTML = username;
  td3.innerHTML = points;
  td4.innerHTML = ths;

  trow.appendChild(td1);
  trow.appendChild(td2);
  trow.appendChild(td3);
  trow.appendChild(td4);

  tbody.appendChild(trow);
}

function AddAllItemsToTheTable(UserDocsList) {
  uNo = 0;
  tbody.innerHTML = "";
  UserDocsList.forEach((element) => {
    AddItemToTable(element.Username, element.Points, element.TriviaHighScore);
  });
}

window.onload = GetAllDataOnce;
