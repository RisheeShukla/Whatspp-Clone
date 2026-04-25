import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom"
import useUserStore from "./store/useUserStore";
import { checkUserAuth } from "./services/user.service";
import Loader from "./utils/Loader";
import { Outlet } from "react-router-dom";

export const ProtectedRoute=()=>{
    const location=useLocation();
    const [isChecking,setIsChecking]=useState(true);
    
    const {isAuthenticated,clearUser,setUser}=useUserStore();
    useEffect(()=>{
        const verifyAuth=async()=>{
            console.log('Protected Route: Starting authentication check.');
            try{
                const result=await checkUserAuth();
                console.log('Protected Route: Auth check completed. Result:', result);
                if(result.isAuthenticated)
                {
                    console.log('Protected Route: User is authenticated. Setting user data.');
                    setUser(result.user);
                }
                else{
                    console.log('Protected Route: User is not authenticated. Clearing user data.');
                    clearUser();
                }
            }
            catch(error)
            {
                console.error('Protected Route: An error occurred during auth check.', error);
                clearUser();
            }
            finally{
                console.log('Protected Route: Finished auth check. Hiding loader.');
                setIsChecking(false);

            }

        }
        verifyAuth();
    
    },[setUser,clearUser])

    if(isChecking)
    {
        return <Loader/>
    }
    if(!isAuthenticated)
    {
        return <Navigate to='user-login' state={{from:location}} replace={true} />
    }
    //user is  auth -render protected route
    return <Outlet/>

}
export const PublicRoute=()=>{
    const {isAuthenticated}=useUserStore();
    if(isAuthenticated)
    {
        return <Navigate to='/' replace={true}/>
    
    }
    return <Outlet/>

}