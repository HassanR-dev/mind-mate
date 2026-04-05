// auth.js — legacy compatibility shim
// New code should use frontend/js/services/auth.service.js instead
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

// Export current user listener (used by pages not yet migrated)
export const watchAuth = (callback) => {
  onAuthStateChanged(auth, user => callback(user));
};
