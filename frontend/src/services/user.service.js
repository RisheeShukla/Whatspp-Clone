
import axiosInstance from "./url.service"
import { disconnectSocket } from "./chat.service";
export const sendOtp=async(phoneNumber,phoneSuffix,email)=>{
    try{
        const response=await axiosInstance.post('auth/send-otp',{
            phoneNumber,
            phoneSuffix,
            email
        })
        return response.data;

    }
   catch(error)
   {
    throw error.response ? error.response.data : error.message;

   }
}

export const verifyOtp=async(phoneNumber,phoneSuffix,otp,email)=>{
    try{
        const response=await axiosInstance.post('/auth/verify-otp',{
            phoneNumber,
            phoneSuffix,
            otp,
            email

        })
        return response.data;

    }
   catch(error)
   {
    throw error.response ? error.response.data : error.message;

   }
}

export const updateUserProfile=async(updatedData)=>{
    try{
        const response=await axiosInstance.put('/auth/update-profile',updatedData)
        return response.data;

    }
   catch(error)
   {
    throw error.response ? error.response.data : error.message;

   }
}

export const checkUserAuth=async()=>{
      try{
        const response=await axiosInstance.get('/auth/profile')
        if(response.data.success)
        {
            return {isAuthenticated:true,user:response.data?.data}
        }
        else{
       
            return {isAuthenticated:false};
        }
    }
    catch(error)
    {
        throw error.response ? error.response.data : error.message;
    
    }

    
    }
export const logoutUser=async()=>{
    try{
        const response=await axiosInstance.get('/auth/logout')
        disconnectSocket();
        
            return response.data;
        
    }
    catch(error)
    {
        throw error.response ? error.response.data : error.message;
    
    }
}

export const getAllUsers=async()=>{
    try{
        const response=await axiosInstance.get('/auth/users')
        
            return response.data;
        
        
        
    }
    catch(error)
    {
        throw error.response ? error.response.data : error.message;
    
    }
}