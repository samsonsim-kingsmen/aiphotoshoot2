import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

// TODO: Replace with your own Firebase project configuration
const firebaseConfig = {
 apiKey: "AIzaSyAyCg4J3Q3J-KjqYhYhzeG18Dr3GG6MlEk",
  authDomain: "genaiphotobooth-60f36.firebaseapp.com",
  projectId: "genaiphotobooth-60f36",
  storageBucket: "genaiphotobooth-60f36.firebasestorage.app",
  messagingSenderId: "493583659263",
  appId: "1:493583659263:web:f2069e14cc0de1bdb71cca",
  measurementId: "G-6XWHQ225S6"
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