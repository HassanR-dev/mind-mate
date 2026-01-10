// auth.js
import { app } from "./firebase-config.js";
import {
  getAuth,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Make these global so onclick="" works in HTML
window.login = () => {
  const email = document.getElementById("email")?.value || document.getElementById("email-login")?.value;
  const password = document.getElementById("password")?.value || document.getElementById("password-login")?.value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => (window.location.href = "index.html"))
    .catch(err => alert("Login error: " + err.message));
};

window.signup = () => {
  const email = document.getElementById("email-signup")?.value || document.getElementById("email")?.value;
  const password = document.getElementById("password-signup")?.value || document.getElementById("password")?.value;

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => alert("Account created!"))
    .catch(err => alert("Signup error: " + err.message));
};

window.googleLogin = () => {
  signInWithPopup(auth, provider)
    .then(() => (window.location.href = "index.html"))
    .catch(err => alert("Google login error: " + err.message));
};

window.logout = () => {
  signOut(auth).then(() => {
    alert("Logged out");
    window.location.href = "login.html";
  });
};

// Export current user listener
export const watchAuth = (callback) => {
  onAuthStateChanged(auth, user => callback(user));
};
