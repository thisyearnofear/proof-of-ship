import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import config from "@/config/environment";

// Use environment configuration
const firebaseConfig = config.firebase;

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
  // Add global error handler for Firestore
  window.addEventListener("unhandledrejection", (event) => {
    if (event.reason && event.reason.name === "FirebaseError") {
      // Log errors in development only
      if (process.env.NODE_ENV === "development") {
        console.error("Firebase Error:", event.reason.code, event.reason.message);
        
        if (event.reason.code === "permission-denied") {
          console.warn("Permission denied. Check Firestore security rules.");
          console.warn("Current user:", auth.currentUser ? auth.currentUser.uid : "Not signed in");
        }
      }
      
      // In production, send to error monitoring service
      if (process.env.NODE_ENV === "production" && window.gtag) {
        window.gtag('event', 'exception', {
          description: `Firebase Error: ${event.reason.code}`,
          fatal: false
        });
      }
    }
  });
}
