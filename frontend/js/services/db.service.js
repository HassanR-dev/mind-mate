import { app } from "../../firebase-config.js";
import {
  getDatabase,
  ref,
  push,
  set,
  update,
  remove,
  onValue,
  get
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";
import { getCurrentUser } from "./auth.service.js";

export const db = getDatabase(app);

async function _userRef(path) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  return ref(db, `users/${user.uid}/${path}`);
}

export async function getUserRef(path) {
  return _userRef(path);
}

export async function listenToUserData(path, callback) {
  const dbRef = await _userRef(path);
  return onValue(dbRef, callback);
}

export async function pushUserData(path, data) {
  const dbRef = await _userRef(path);
  return push(dbRef, data);
}

export async function setUserData(path, data) {
  const dbRef = await _userRef(path);
  return set(dbRef, data);
}

export async function updateUserData(path, data) {
  const dbRef = await _userRef(path);
  return update(dbRef, data);
}

export async function removeUserData(path) {
  const dbRef = await _userRef(path);
  return remove(dbRef);
}

export async function getUserData(path) {
  const dbRef = await _userRef(path);
  return get(dbRef);
}

export { ref, push, set, update, remove, onValue, get };
