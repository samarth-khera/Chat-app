import React from 'react'
import './RightSidebar.css'
import assets from '../../assets/assets'
import { logout } from '../../config/firebase'
const RightSidebar = () => {
  return (
    <div>
      <div className="rs">
        <div className="rs-profile">
            <img src={assets.profile_img} alt="" />
            <h3>Richard Snaford</h3>
            <p>Hey,There i am Richard Sanford using chat app</p>
        </div>
        <hr/>
        <div className="rs-media">
            <p>Media</p>
            <div>
                <img src={assets.pic1} alt="" />
                <img src={assets.pic2} alt="" />
                <img src={assets.pic3} alt="" />
                <img src={assets.pic4} alt="" />
                <img src={assets.pic1} alt="" />
                <img src={assets.pic2} alt="" />
            </div>
            <button onClick={()=>logout()}>Logout</button>
        </div>
    
     </div>
        
    </div>
  )
}

export default RightSidebar
