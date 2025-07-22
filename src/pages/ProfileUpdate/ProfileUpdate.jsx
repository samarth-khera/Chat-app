import React, { useContext, useEffect, useState } from 'react';
import './ProfileUpdate.css';
import assets from '../../assets/assets';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import upload from '../../lib/upload';
import { Appcontext } from '../../context/Appcontext';

const ProfileUpdate = () => {
  const navigate = useNavigate();
  const { setUserData } = useContext(Appcontext);

  const [image, setImage] = useState(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [uid, setUid] = useState('');
  const [prevImage, setPrevImage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (!image && !prevImage) {
        toast.error("Please upload a profile picture");
        setLoading(false);
        return;
      }

      const docRef = doc(db, "users", uid);
      let avatarUrl = prevImage;

      if (image) {
        const url = await upload(image);
        if (!url) {
          toast.error("Image upload failed. Try again.");
          setLoading(false);
          return;
        }
        avatarUrl = url;
        setPrevImage(url);
      }

      await updateDoc(docRef, {
        name,
        bio,
        avatar: avatarUrl,
      });

      toast.success("Profile updated successfully!");
      const snap = await getDoc(docRef);
      setUserData(snap.data());
      navigate('/chat');
    } catch (err) {
      console.error("Profile update error:", err);
      toast.error("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || '');
          setBio(data.bio || '');
          setPrevImage(data.avatar || '');
        }
      } else {
        navigate('/');
      }
    });
  }, [navigate]);

  const avatarPreview = image
    ? URL.createObjectURL(image)
    : prevImage || assets.avatar_icon;

  return (
    <div className="profile">
      <div className="profile-container">
        <form onSubmit={handleProfileUpdate}>
          <h3>Profile Details</h3>
          <label htmlFor="avatar">
            <input
              onChange={(e) => setImage(e.target.files[0])}
              type="file"
              id="avatar"
              accept=".png, .jpg, .jpeg"
              hidden
            />
            <img src={avatarPreview} alt="avatar" />
            Upload profile image
          </label>
          <input
            onChange={(e) => setName(e.target.value)}
            value={name}
            type="text"
            placeholder="Your name"
            required
          />
          <textarea
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            placeholder="Write profile bio"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
        </form>

        <img
          className="profile-pic"
          src={avatarPreview}
          alt="profile"
        />
      </div>
    </div>
  );
};

export default ProfileUpdate;





