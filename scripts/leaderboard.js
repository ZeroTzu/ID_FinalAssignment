import { db } from "./utils/firebase.js";
import {
  getDocs,
  collection,
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
    AddAllItems(users);
  });
}

var uNo = 0;
var tbody = $("#tbody1");

function AddToTop3(place, username, points, ths) {
  var container, rank;
  switch (place) {
    case 0:
      container = $("#leaderboard__tops-first");
      rank = "1st";
      break;
    case 1:
      container = $("#leaderboard__tops-second");
      rank = "2nd";
      break;
    case 2:
      container = $("#leaderboard__tops-third");
      rank = "3rd";
      break;
  }

  const rankElement = $(`<h2 class="w-100 text-center" id="font-smaller">${rank}</h2>`);
  const usernameElement = $(`<p class="w-100 text-center" id="font-small">${username}</p>`);
  const pointsElement = $(`<p class="w-100 text-center" id="font-small">${points} points</p>`);

  container.append(rankElement);
  container.append(usernameElement);
  container.append(pointsElement);
}

function AddItemToTable(place, username, points, ths) {
  var trow = $("<tr></tr>");
  var td1 = $("<td></td>");
  var td2 = $("<td></td>");
  var td3 = $("<td></td>");
  var td4 = $("<td></td>");

  td1.html(++place);
  td2.html(username);
  td3.html(points);
  td4.html(ths);

  trow.append(td1);
  trow.append(td2);
  trow.append(td3);
  trow.append(td4);

  tbody.append(trow);
}

function AddAllItems(UserDocsList) {
  tbody.html("");
  UserDocsList.forEach((element, index) => {
    console.log(element, index);
    if (index < 3) {
      AddToTop3(
        index,
        element.Username,
        element.Points,
        element.TriviaHighScore
      );
    } else {
      AddItemToTable(
        index,
        element.Username,
        element.Points,
        element.TriviaHighScore
      );
    }
  });
  $("#leaderboard__loader").css("opacity", 0);
}

window.onload = GetAllDataOnce;
