import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
    apiKey: "AIzaSyChtb33NI1GIgXF_6eYrzwSeue0bqlvmg0",
    authDomain: "capstone2026-3e225.firebaseapp.com",
    projectId: "capstone2026-3e225",
    storageBucket: "capstone2026-3e225.firebasestorage.app",
    messagingSenderId: "784798789240",
    appId: "1:784798789240:web:e0a744f94483a9ca35878d",
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export default app
