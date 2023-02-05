import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDOTQFVNf8Uryge39sxBAhmVjhOkzjYiik",
  authDomain: "exdatabase-1a7c3.firebaseapp.com",
  projectId: "exdatabase-1a7c3",
  storageBucket: "exdatabase-1a7c3.appspot.com",
  messagingSenderId: "857622055165",
  appId: "1:857622055165:web:bf5e8559033206db635694",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
