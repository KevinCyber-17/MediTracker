// js/firebase-config.js
// Initialize Firebase using the compat SDK (this file is loaded after the
// compat scripts in the HTML). Replace values below with your Firebase project
// configuration from the Firebase console.

const firebaseConfig = {
  apiKey: "AIzaSyA3c1tKMpVEKaLUFYV_8jVmsWmUe5LzliI",
  authDomain: "medi-tracker-f4ae9.firebaseapp.com",
  databaseURL: "https://medi-tracker-f4ae9-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "medi-tracker-f4ae9",
  storageBucket: "medi-tracker-f4ae9.appspot.com",
  messagingSenderId: "52661841699",
  appId: "1:52661841699:web:aa1401eca938a8a2c16696",
  measurementId: "G-0M8SKZB0SW"
};

if (typeof firebase !== 'undefined') {
  try {
    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    // Expose auth and db for other scripts
    window.auth = firebase.auth();
    window.db = firebase.firestore();
    console.log('Firebase (compat) initialized.');
  } catch (err) {
    console.warn('Firebase init error:', err);
  }
} else {
  console.warn('Firebase SDK not found; running with localStorage fallback.');
}
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // If using Firestore

export { auth, db };
