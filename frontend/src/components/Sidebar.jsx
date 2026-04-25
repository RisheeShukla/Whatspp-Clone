import { useState } from "react";
import useLayoutStore from "../store/layoutStore";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import useUserStore from "../store/useUserStore";
import { FaWhatsapp,FaUserCircle, FaCog } from "react-icons/fa";
import { motion } from "framer-motion";
import {MdRadioButtonChecked} from "react-icons/md";


const Sidebar=()=>{
    const location=useLocation();
      const [isMobile,setIsMobile]=useState(window.innerWidth<768)
      const {theme,setTheme}=useLayoutStore();
      const {user}=useUserStore();
      const {activeTab,setActiveTab,selectedContact,setSelectedContact}=useLayoutStore();
     
     useEffect(()=>{
        const handleResize=()=>{
            setIsMobile(window.innerWidth<768)
        }
        window.addEventListener("resize",handleResize)
        return ()=>window.removeEventListener("resize",handleResize);
     },[])
    
     useEffect(()=>{
        if(location.pathname==='/')
        {
            setActiveTab('chats')

        }
        else if(location.pathname==='/status')
        {
            setActiveTab('status')

        }
        else if(location.pathname==='/user-profile')
        {
            setActiveTab('profile')

        }
        else if(location.pathname==='/setting')
        {
            setActiveTab('setting')

        }
        
     },[location,setActiveTab])
     if(isMobile && selectedContact)
        return null

     const SidebarContent=(
        <>
        <Link
        to='/' 
        className={`${isMobile?"":"mb-8"} ${activeTab==='chats'&&'bg-gray-300 shadow-lg  rounded-full'} focuse:outline-none`}
        >
        <FaWhatsapp
        className={`h-6 w-6 ml-3 ${activeTab==='chats'? theme==='dark'?'text-gray-800':"text-gray-700":theme==='dark'?"text-gray-300":"text-gray-800"}`}
        />

        </Link>
 {!isMobile && (
            <div className="mt-10 mb-10"/>
        )}
        <Link
        to='/status' 
        className={`${isMobile?"":"mb-8"} ${activeTab==='status'&&'bg-gray-300 shadow-lg  rounded-full'} focuse:outline-none`}
        >
        <MdRadioButtonChecked
        className={`h-6 w-6 ml-3 ${activeTab==='status'? theme==='dark'?'text-gray-800':"text-gray-700":theme==='dark'?"text-gray-300":"text-gray-800"}`}
        />
        
        </Link>

        {!isMobile && (
            <div className="mt-10 mb-10"/>
        )}
        <Link
        to='/user-profile' 
        className={`${isMobile?"":"mb-8"} ${activeTab==='profile'&&'bg-gray-300 shadow-lg  rounded-full'} focuse:outline-none`}
        >
            {
                user?.profilePicture?(
                  <img src={user.profilePicture}
                  alt='user-profile'
                  className='h-8 w-8 ml-3 rounded-full '
                  />
                ):(<FaUserCircle
                className={`h-6 w-6 ml-3 ${activeTab==='profile'? theme==='dark'?'text-gray-800':"text-gray-700":theme==='dark'?"text-gray-300":"text-gray-800"}`}/>)
            }
       
{!isMobile && (
            <div className="mt-10 mb-10"/>
        )}

        </Link>


        <Link
        to='/setting' 
        className={`${isMobile?"":"mb-8"} ${activeTab==='setting'&&'bg-gray-300 shadow-lg  rounded-full'} focuse:outline-none`}
        >
            <FaCog
                className={`h-6 w-6 ml-3 ${activeTab==='setting'? theme==='dark'?'text-gray-800':"text-gray-700":theme==='dark'?"text-gray-300":"text-gray-800"}`}/>)
            
       


        </Link>
       
        </>
     )
    
    return (
        <motion.div
        initial={{opacity:0}}
        animate={{opacity:1}}
        transition={{duration:0.3}}
       className={`${isMobile?"fixed bottom-0 left-0  h-16":
       "w-16 h-screen border-r-2 "}
       ${theme==='dark'?"bg-gray-800 border-gray-600":"bg-gray-300 border-gray-500"} bg-opacity-90 items-center  py-4 shadow-lg
       ${isMobile ?"flex-row justify-center":"flex-col items-center justify-between"}`}
>
    {SidebarContent}
</motion.div>
    )
}
export default Sidebar;