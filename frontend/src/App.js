import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './pages/user-login/Login';
import {ToastContainer} from 'react-toastify'
import "react-toastify/dist/ReactToastify.css"
import { ProtectedRoute, PublicRoute } from './Protected';
import HomePage from './components/HomePage';
import UserDetails from './components/UserDetails';
import Status from './pages/StatusSection/Status';
import Settings from './pages/SettingSection/Setting';
import { initializeSocket } from './services/chat.service';
import { useChatStore } from './store/chatStore';
import useUserStore from './store/useUserStore';
function App() {
  const {user}=useUserStore();
  const {setCurrentUser,initsocketListeners,cleanup}=useChatStore()

  useEffect(()=>{
    
    if(!user?._id)
    {
       return

    }
    const socket=initializeSocket(user);
    if(socket)
    {
      setCurrentUser(user);
      initsocketListeners();

    }
    return ()=>{
      cleanup();
    }
  },[user,setCurrentUser,initsocketListeners,cleanup])
  return (
    <>
    <ToastContainer position='top-right' autoClose={3000}/>
    <Router>
      <Routes>
        <Route element={<PublicRoute/>}>
               <Route path='/user-login' element={<Login/>}/>
        </Route>
        <Route element={<ProtectedRoute/>}>
          <Route path='/' element={<HomePage/>}/>
         <Route path='/status' element={<Status/>}/>
         <Route path='/user-profile' element={<UserDetails/>}/>
         <Route path='/setting' element={<Settings/>}/>
          </Route>
       
       
      </Routes>
    </Router>
    
    </>
  );
}

export default App;
