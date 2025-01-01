import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDaGBzrFB2B8Bl_kWtdv-Z5I-A7HO7e6kA",
    authDomain: "employeedashboard-3b484.firebaseapp.com",
    projectId: "employeedashboard-3b484",
    storageBucket: "employeedashboard-3b484.firebasestorage.app",
    messagingSenderId: "234501757864",
    appId: "1:234501757864:web:a09cebf36a6456bdf11b9d",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
