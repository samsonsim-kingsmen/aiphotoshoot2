import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

// TODO: Replace with your own Firebase project configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export const uploadImage = async (dataUrl: string): Promise<string> => {
    // Generate a unique file name for the image
    const fileName = `${new Date().getTime()}-${Math.random().toString(36).substring(2, 8)}.jpg`;
    const storageRef = ref(storage, `uploads/${fileName}`);

    try {
        // 'uploadString' with 'data_url' format handles the Base64 data URL directly
        const snapshot = await uploadString(storageRef, dataUrl, 'data_url');
        
        // Get the public download URL for the uploaded image
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error("Upload failed", error);
        throw new Error("Failed to upload image to Firebase Storage.");
    }
};