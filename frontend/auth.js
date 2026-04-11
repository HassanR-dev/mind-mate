// auth.js
import { app } from "./firebase-config.js";
import { showToast } from "./ui.js";
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
    .then(() => (window.location.href = "dashboard.html"))
    .catch(err => showToast("Login error: " + err.message, "error"));
};

window.signup = () => {
  const email = document.getElementById("email-signup")?.value || document.getElementById("email")?.value;
  const password = document.getElementById("password-signup")?.value || document.getElementById("password")?.value;

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => showToast("Account created!", "success"))
    .catch(err => showToast("Signup error: " + err.message, "error"));
};

window.googleLogin = () => {
  signInWithPopup(auth, provider)
    .then(() => (window.location.href = "dashboard.html"))
    .catch(err => showToast("Google login error: " + err.message, "error"));
};

window.logout = () => {
  signOut(auth)
    .then(() => {
      showToast("Logged out", "success");
      window.location.href = "login.html";
    })
    .catch(err => showToast("Logout error: " + err.message, "error"));
};

// Export current user listener
export const watchAuth = (callback) => {
  onAuthStateChanged(auth, user => callback(user));
};
