import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const requiredFirebaseKeys = ["apiKey", "authDomain", "projectId", "appId"];
const missingFirebaseKeys = requiredFirebaseKeys.filter((key) => !firebaseConfig[key]);

let firebaseApp = null;
let firebaseAuthInstance = null;
let firebaseConfigError = "";

if (missingFirebaseKeys.length) {
  firebaseConfigError = `Firebase is not configured. Missing: ${missingFirebaseKeys
    .map((key) => `VITE_FIREBASE_${key.replace(/[A-Z]/g, (match) => `_${match}`).toUpperCase()}`)
    .join(", ")}`;
} else {
  try {
    firebaseApp = initializeApp(firebaseConfig);
    firebaseAuthInstance = getAuth(firebaseApp);
  } catch (error) {
    firebaseConfigError = error?.message || "Firebase failed to initialize";
  }
}

const getFirebaseAuth = () => {
  if (!firebaseAuthInstance) {
    throw new Error(`${firebaseConfigError}. Add your Firebase web app values to frontend/.env.`);
  }

  return firebaseAuthInstance;
};

export const firebaseAuth = firebaseAuthInstance;
export const googleProvider = new GoogleAuthProvider();

export const signInWithGooglePopup = () => signInWithPopup(getFirebaseAuth(), googleProvider);

export const setupRecaptcha = (containerId = "recaptcha-container") => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(getFirebaseAuth(), containerId, {
      size: "invisible",
    });
  }

  return window.recaptchaVerifier;
};

export const sendFirebaseOtp = (phoneNumber, containerId) => {
  const verifier = setupRecaptcha(containerId);
  return signInWithPhoneNumber(getFirebaseAuth(), phoneNumber, verifier);
};
