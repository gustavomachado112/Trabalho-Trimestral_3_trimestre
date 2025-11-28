import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCDdN4EMSqEbX9f0Q0TISiwHV0AvCORRUo",
    authDomain: "financiafacil-c9238.firebaseapp.com",
    projectId: "financiafacil-c9238",
    storageBucket: "financiafacil-c9238.firebasestorage.app",
    messagingSenderId: "490435881150",
    appId: "1:490435881150:web:599d421d69747256ec16ef",
    measurementId: "G-S2CHBRQGG3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
