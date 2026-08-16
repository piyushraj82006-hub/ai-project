import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// ─── Firebase Config ───
const firebaseConfig = {
  apiKey: "AIzaSyAmZ4SjxmCL8cmHJhGbIOXQxqJQRtRDnOs",
  authDomain: "scroll-d95c6.firebaseapp.com",
  projectId: "scroll-d95c6",
  storageBucket: "scroll-d95c6.firebasestorage.app",
  messagingSenderId: "357050314974",
  appId: "1:357050314974:web:848e46b67e7b335fb1124f",
  measurementId: "G-CQ9KKC19DL"
};

// ─── Initialize Services ───
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// ─── Google Auth Provider ───
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// ─── Helper: Create/Update Firestore User Doc ───
async function ensureUserDoc(firebaseUser) {
  if (!firebaseUser) return;
  const userRef = doc(db, 'users', firebaseUser.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // First-time user — create doc
    await setDoc(userRef, {
      displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      email: firebaseUser.email,
      photoURL: firebaseUser.photoURL || null,
      college: null,
      department: null,
      semester: null,
      enrolledCourses: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    // Returning user — update last login timestamp
    await setDoc(userRef, { updatedAt: serverTimestamp() }, { merge: true });
  }
}

// ─── Auth Functions ───

/**
 * Sign up with email/password and create Firestore user doc.
 */
export async function signUp(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await firebaseUpdateProfile(cred.user, { displayName });
  }
  await ensureUserDoc(cred.user);
  return cred.user;
}

/**
 * Sign in with email/password.
 */
export async function signIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserDoc(cred.user);
  return cred.user;
}

/**
 * Sign in with Google popup and create/update Firestore user doc.
 */
export async function signInGuest() {
  const cred = await signInAnonymously(auth);
  await ensureUserDoc(cred.user);
  return cred.user;
}

/**
 * Sign in with Google popup and create/update Firestore user doc.
 */
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  await ensureUserDoc(result.user);
  return result.user;
}

/**
 * Sign out.
 */
export async function signOutUser() {
  await firebaseSignOut(auth);
}

/**
 * Subscribe to auth state changes.
 * @returns unsubscribe function
 */
export function onAuthStateChanged(callback) {
  return firebaseOnAuthStateChanged(auth, callback);
}

/**
 * Update the Firebase Auth profile (displayName, photoURL).
 */
export async function updateProfile(user, data) {
  await firebaseUpdateProfile(user, data);
}
