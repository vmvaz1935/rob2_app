// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBMT64mXXhFvPXzE5P-JfknrzDnDHd2liI",
  authDomain: "rob2-app-6421e.firebaseapp.com",
  projectId: "rob2-app-6421e",
  storageBucket: "rob2-app-6421e.firebasestorage.app",
  messagingSenderId: "871511141871",
  appId: "1:871511141871:web:93f41e7e85c96fd8049a1a",
  measurementId: "G-L6B5K36SR3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Analytics (optional)
export const analytics = getAnalytics(app);

export default app;
