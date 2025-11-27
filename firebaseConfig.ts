// @ts-ignore
const firebase = window.firebase;

const firebaseConfig = {
  apiKey: "AIzaSyCaLJoqDMerrJHAfuu-PXaBo9FIFQfUTEs",
  authDomain: "xfinitive-water.firebaseapp.com",
  projectId: "xfinitive-water",
  storageBucket: "xfinitive-water.firebasestorage.app",
  messagingSenderId: "155542093746",
  appId: "1:155542093746:web:91f9414b5d53cc89406eab",
  measurementId: "G-6S9S00535R"
};

// Initialize Firebase (Singleton Pattern)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const db = firebase.firestore();