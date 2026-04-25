const twillo=require('twilio');
const dotenv=require('dotenv');
dotenv.config()

//Twillo credentials from env

const accountSID=process.env.TWILLO_ACCOUNT_SID;
const authToken=process.env.TWILLO_AUTH_TOKEN;
const serviceSID=process.env.TWILLO_SERVICE_SID;

const client=twillo(accountSID,authToken);

//send otp to phone number....

const sendOtpToPhoneNumber=async(phoneNumber)=>{
    try{
        console.log('sending otp to this number',phoneNumber)
        if(!phoneNumber)
        {
           throw new Error('Phone number is missing')
        }
        const response=await client.verify.v2.services(serviceSID).verifications.create({
            to:phoneNumber,
            channel:'sms'
    })
console.log(response)
         return response;
    }catch(error)
    {
   console.log(error);
   throw new Error('Otp sending failed')
    
    }
}

const verifyOtp=async(phoneNumber,otp)=>{
    try{
        if(!phoneNumber || !otp)
        {
            throw new Error('Phone number or otp is missing')
        }
        const response=await client.verify.v2.services(serviceSID).verificationChecks.create({
            to:phoneNumber,
            code:otp
    })
        console.log(response)
         return response;
    }catch(error)
    {
   console.log(error);
   throw new Error('Otp verification failed')
    
    }
}

module.exports={sendOtpToPhoneNumber,verifyOtp};