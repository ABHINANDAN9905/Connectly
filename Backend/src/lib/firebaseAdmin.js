import admin from "firebase-admin";

const buildCredential = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON));
  }

  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });
  }

  return null;
};

let firebaseAdmin = null;

export const getFirebaseAdmin = () => {
  if (firebaseAdmin) return firebaseAdmin;

  const credential = buildCredential();
  if (!credential) return null;

  firebaseAdmin = admin.apps.length
    ? admin.app()
    : admin.initializeApp({
        credential,
      });

  return firebaseAdmin;
};

export const verifyFirebaseIdToken = async (idToken) => {
  const app = getFirebaseAdmin();
  if (!app) {
    throw new Error("Firebase Admin is not configured");
  }

  return app.auth().verifyIdToken(idToken);
};
