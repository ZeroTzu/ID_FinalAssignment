
const firebaseConfig = {
    apiKey: "AIzaSyDOTQFVNf8Uryge39sxBAhmVjhOkzjYiik",
    authDomain: "exdatabase-1a7c3.firebaseapp.com",
    projectId: "exdatabase-1a7c3",
    storageBucket: "exdatabase-1a7c3.appspot.com",
    messagingSenderId: "857622055165",
    appId: "1:857622055165:web:bf5e8559033206db635694",
    measurementId: "G-5YMV97BR5B"
  };
  
  firebase.initializeApp(firebaseConfig);
  let db = firebase.firestore();
  
  function GetAllDataOnce(){
    db.collection("users").get().then((querySnapshot)=>{
      var users = [];
      querySnapshot.forEach(doc => {
        users.push(doc.data());
  
      });
      users.sort(function compareFn(a, b){
        return b.Points - a.Points 
  
      })
      AddAllItemsToTheTable(users);
  
    });
  }
   
  function GetAllDataRealtime(){
    db.collection("users").onSnapshot((querySnapshot)=>{
      var users = [];
      querySnapshot.forEach(doc => {
        users.push(doc.data());
  
      });
      AddAllItemsToTheTable(users);
    });
  }
  
  var uNo=0
  var tbody = document.getElementById('tbody1');
  
  function AddItemToTable(username, points, ths){
    var trow = document.createElement('tr');
    var td1 = document.createElement('td');
    var td2 = document.createElement('td'); 
    var td3 = document.createElement('td');
    var td4 = document.createElement('td');
  
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
  
  function AddAllItemsToTheTable(UserDocsList){
    uNo = 0;
    tbody.innerHTML=""; 
    UserDocsList.forEach(element => {
      AddItemToTable(element.Username, element.Points, element.TriviaHighScore);
    });
  }
  
  window.onload = GetAllDataOnce;
  