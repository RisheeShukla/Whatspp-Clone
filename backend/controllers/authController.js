// Step-1 send otp
const User=require('../modals/User.js');
const Conversation=require('../modals/Conversation.js');
const {sendOtpToEmail}=require('../service/emailService.js');
const {sendOtpToPhoneNumber,verifyOtp}=require('../service/twiloService.js');
const {uploadFileToCloudinary,multerMiddleware}=require('../config/cloudinaryConfig.js');
const {authMiddleware}=require('../middleware/authMiddleware.js');
const {otpGenerator}=require('../utils/optGenerator.js');
const {generateToken}=require('../utils/generateToken.js');
const sendOtp=async(req,res)=>{
    const {phoneNumber,phoneSuffix,email}=req.body;
    const otp=otpGenerator();
    const expiry=new Date(Date.now()+5*(60*1000));
    let user;
   try{
    if(email)
    {
        user=await User.findOne({email});
        if(!user)
        {
            user=new User({email})
        }
        user.emailOtp=otp;
        user.emailOtpExpiry=expiry;
        await user.save();
        await sendOtpToEmail(email,otp);
         return res.ok({email},"Email otp saved successfull")

    }

        if(!phoneNumber || !phoneSuffix)
        {
           return res.notFound('PhoneNumber or phoneSuffix is missing')
        }
        const fullPhoneNumber=`${phoneSuffix}${phoneNumber}`;
        user=await User.findOne({phoneNumber});
        if(!user)
        {
            user=new User({phoneNumber,phoneSuffix})
        }
        await sendOtpToPhoneNumber(fullPhoneNumber);
  
       await user.save();
       return  res.ok({phoneNumber},'Otp sent successfully')
    

   }
   catch(error)
   {
    console.log(error);
    return res.serverError('Otp generation failed',[error.message])
   
   }


}

//Step second verify otp
const verifyOTP=async(req,res)=>{
   
try{
     const {phoneNumber,phoneSuffix,otp,email}=req.body;
        let user;
        if (!otp || otp.length !== 6) {
            return res.badRequest('OTP must be exactly 6 digits');
        }

        if(email)
        {
            user=await User.findOne({email});
            if(!user)
            {
                return res.notFound('User not found with this email')
            }
            const  now=new Date();
            if(user.emailOtp.toString()!==String(otp) || new Date(user.emailOtpExpiry)<now)
            {
                return res.badRequest('Invalid or expired otp')
            }
            user.isVerified=true;
            user.emailOtp=null;
            user.emailOtpExpiry=null;
            await user.save();

        }
        else
        {
            if(!phoneNumber || !phoneSuffix || !otp)
            {
                return res.badRequest('Missing required fields')
            }
            const fullPhoneNumber=`${phoneSuffix}${phoneNumber}`;
              user=await User.findOne({phoneNumber});
              if(!user)
              {
                return res.notFound('User not found with this phone number');
              }
              const result=await verifyOtp(fullPhoneNumber,otp);
            if(result.status!=='approved')
            {
                return res.badRequest('Invalid or expired otp')
            }
            user.isVerified=true;
            await user.save();
        }
        const token=generateToken(user?._id);
        return res.ok({token,user},'Otp verified successfully')
}catch(error)
{
    console.log(error);
    return res.serverError('Otp verification failed',[error.message])
}

   
}

const updateProfile=async(req,res)=>{
     const {username,about,agreed}=req.body;
     const userId=req.id;
     try{
             const user=await User.findById(userId);
           const file=req.file;
           if(file)
            {
                const uploadResult=await uploadFileToCloudinary(file);
                user.profilePicture=uploadResult?.secure_url;
            }
            else if(req.body.profilePicture)
            {
                user.profilePicture=req.body.profilePicture;
            }
            if(username)
            {
                user.username=username;

            }
            if(about)
            {
                user.about=about;
            }
            if(agreed)
            {
                user.agreed=agreed;
            }
         await user.save();

            return res.ok(user,'Profile updated successfully')


     }
     catch(error)
     {
        console.log(error);
        return res.serverError('Profile update failed',[error.message])

     }
}

const checkAuthenticated= async(req,res)=>{
    try{
        const userId=req.id;
      
        if(!userId)
        {
            return res.notFound('UserId not found');
        }
          const user=await User.findById(userId);
          if(!user)
          {
            return res.notFound('User not found');
          }

         return res.ok(user,'User is retrieved successfully') 
      
    }
    catch(error){
        console.log(error);
        return res.serverError('User retrieval failed',[error.message])

    }

}

const logout=(req,res)=>{
    try{
           res.cookie("auth_token",{expires:new Date(0)});
           return res.ok('Logged out successfully')
    }catch(error)
    {
          console.log(error);
          return res.serverError('Logout failed',[error.message])

    }
}

const getAllUsers=async(req,res)=>{
    const userId=req.id;
    try{
      
          const users=await User.find({_id:{$ne:userId}}).select('username profilePicture lastSeen isOnline about phoneNumber phoneSuffix').lean();

       const userWithConversation=await Promise.all(users.map(async(user)=>{
            const conversation=await Conversation.findOne({
                participants:{$all:[userId,user?._id]}
       }).populate(
                {
                    path:'lastMessage',
                    select:'sender receiver content createdAt',

                }
            ).lean();

            return {
                ...user,
                conversation:conversation || null
            }

       }))
       res.ok(userWithConversation,'Users retrieved successfully')
    }
    catch(error)
    {
        console.log(error);
        return res.serverError('Failed to retrieve users',[error.message])

    }
}

module.exports={sendOtp,verifyOTP,updateProfile,logout,checkAuthenticated,getAllUsers} ;
