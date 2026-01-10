// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

export const firebaseConfig = {
  apiKey: "AIzaSyD4QT7FiZk8JkBoVZgoESQfZITDJwiW0yA",
  authDomain: "mind-mate-ff2cf.firebaseapp.com",
  databaseURL: "https://mind-mate-ff2cf-default-rtdb.firebaseio.com",
  projectId: "mind-mate-ff2cf",
  storageBucket: "mind-mate-ff2cf.appspot.com",
  messagingSenderId: "152881371122",
  appId: "1:152881371122:web:b5afc1e9019074b29a3d6b"
};

export const app = initializeApp(firebaseConfig);
