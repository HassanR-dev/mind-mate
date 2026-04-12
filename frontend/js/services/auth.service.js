import { app } from "../../firebase-config.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

export const auth = getAuth(app);

let _currentUser = null;
let _authReady = false;
const _callbacks = [];

const _authPromise = new Promise((resolve) => {
  onAuthStateChanged(auth, (user) => {
    _currentUser = user;
    if (!_authReady) {
      _authReady = true;
      resolve(user);
    }
    _callbacks.forEach(cb => cb(user));
  });
});

export function getCurrentUser() {
  return _authPromise;
}

export function onUserReady(callback) {
  if (_authReady) {
    callback(_currentUser);
  } else {
    _callbacks.push(callback);
  }
}

export function authGuard() {
  return new Promise((resolve) => {
    onUserReady((user) => {
      if (!user) {
        window.location.href = "login.html";
      } else {
        resolve(user);
      }
    });
  });
}

export async function logout() {
  await signOut(auth);
  window.location.href = "login.html";
}
