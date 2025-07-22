import { initializeApp } from "firebase/app";
import { 
  createUserWithEmailAndPassword, 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut 
} from "firebase/auth";
import { getFirestore, setDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";

// ✅ REPLACED with NEW Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC2kcYJaVKZRT210qOpfOQ3X9H3Gh5RGfI",
  authDomain: "chat-app-demo-f0e13.firebaseapp.com",
  projectId: "chat-app-demo-f0e13",
  storageBucket: "chat-app-demo-f0e13.firebasestorage.app",
  messagingSenderId: "670961423979",
  appId: "1:670961423979:web:82cde58b928a6c163bc32e",
  measurementId: "G-R1P359B6KM"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ Signup logic (same)
const signup = async (username,email,password) => {
  try{
    const res = await createUserWithEmailAndPassword(auth,email,password);
    const user = res.user;
    await setDoc(doc(db,"users",user.uid),{
      id:user.uid,
      username:username.toLowerCase(),
      email,
      name:"",
      avatar:"",
      bio:"Hey there i am using chat app",
      lastSeen: Date.now()
    });
    await setDoc(doc(db,"chats",user.uid),{ chatData:[] });
  }catch(error){
    console.error(error);
    toast.error(error.code.split('/')[1].split('-').join(" "));
  }
}

// ✅ Login logic (same)
const login = async (email,password) => {
  try{
    await signInWithEmailAndPassword(auth,email,password);
  }catch(error){
    console.error(error);
    toast.error(error.code.split('/')[1].split('-').join(" "));
  }
}

// ✅ Logout logic (same)
const logout = async () => {
  try{
    await signOut(auth);
  }catch(error){
    console.error(error);
    toast.error(error.code.split('/')[1].split('-').join(" "));
  }
}

export { signup, login, logout, auth, db };
