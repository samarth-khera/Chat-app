import React, { useContext, useEffect } from 'react';
import { Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import Login from './pages/Login/Login';
import Chat from './pages/Chat/Chat';
import ProfileUpdate from './pages/ProfileUpdate/ProfileUpdate';
import UserProfile from './pages/UserProfile/UserProfile';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import { Appcontext } from './context/Appcontext';

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loadUserData } = useContext(Appcontext);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // ✅ Load user data no matter what
          await loadUserData(user.uid, location.pathname);

          if (location.pathname === '/') {
            navigate('/chat');
          }

          // ✅ If already on /chat, /profile, or /user/:id, stay there
        } catch (err) {
          console.warn("Failed to load user data:", err.message);
          // Don't redirect if quota fails
        }
      } else {
        navigate('/'); // No user → go login
      }
    });

    return () => unsubscribe();
  }, [location.pathname, navigate, loadUserData]);

  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path='/' element={<Login />} />
        <Route path='/chat' element={<Chat />} />
        <Route path='/profile' element={<ProfileUpdate />} />
        <Route path='/user/:id' element={<UserProfile />} />
      </Routes>
    </>
  );
};

export default App;

