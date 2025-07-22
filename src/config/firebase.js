// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut} from "firebase/auth"
import {getFirestore, setDoc,doc} from "firebase/firestore"
import { toast } from "react-toastify";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB9X8aZOhDFHeScOBjF3X9Jn2cvWpqo9V0",
  authDomain: "chat-app-gs-2f3af.firebaseapp.com",
  projectId: "chat-app-gs-2f3af",
  storageBucket: "chat-app-gs-2f3af.firebasestorage.app",
  messagingSenderId: "735293646252",
  appId: "1:735293646252:web:da5c44c56720e59fc60609"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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
      })
      await setDoc(doc(db,"chats",user.uid),{
        chatData:[]
      })
    }catch(error){
      console.error(error)
      toast.error(error.code.split('/')[1].split('-').join(" "));
    }
}

const login = async (email,password) => {
  try{
    await signInWithEmailAndPassword(auth,email,password)
  }catch(error){
    console.error(error)
    toast.error(error.code.split('/')[1].split('-').join(" "));
  }
}

const logout = async () => {
  try{
    await signOut(auth)
  }catch (error){
    console.error(error)
    toast.error(error.code.split('/')[1].split('-').join(" "));
  }
}
export {signup,login,logout,auth,db}