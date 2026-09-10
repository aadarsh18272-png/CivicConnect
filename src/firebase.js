import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAb0hwxBLr6pb5bBIvyQGHCSoqzGSx0c9E",
  authDomain: "civicconnect-2310c.firebaseapp.com",
  projectId: "civicconnect-2310c",
  storageBucket: "civicconnect-2310c.firebasestorage.app",
  messagingSenderId: "585893443397",
  appId: "1:585893443397:web:003dfc653453aa4cf1f02c",
  measurementId: "G-SVCYKFHH25"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;