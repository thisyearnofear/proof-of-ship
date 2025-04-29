import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// For debugging
console.log("Firebase Config:", {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "Set" : "Not set",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "Set" : "Not set",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "Set" : "Not set",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    ? "Set"
    : "Not set",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    ? "Set"
    : "Not set",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? "Set" : "Not set",
});

// Initialize Firebase
let firebaseApp;

if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApps()[0]; // if already initialized, use that one
}

// Auth export
export const auth = getAuth(firebaseApp);

// Initialize Firestore with standard configuration
export const db = getFirestore(firebaseApp);

// Add error handling for Firestore operations
if (typeof window !== "undefined") {
  console.log("Setting up Firestore error handling");

  // Add global error handler for Firestore
  window.addEventListener("unhandledrejection", (event) => {
    if (event.reason && event.reason.name === "FirebaseError") {
      console.error("Firebase Error:", event.reason.code, event.reason.message);

      // You can add custom error handling here
      if (event.reason.code === "permission-denied") {
        console.log(
          "Permission denied. This could be due to Firestore security rules."
        );
        console.log(
          "Current user:",
          auth.currentUser ? auth.currentUser.uid : "Not signed in"
        );
      }
    }
  });
}
