const nodemailer=require('nodemailer');
const dotenv=require('dotenv');
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


transporter.verify((error,success)=>{

    if(error)
    {
        console.log('Gmail coonection failed',error);
    }
    else
    {
        console.log('Gmail configured successfully')
    }



})

const sendOtpToEmail=async(email,otp)=>{
    const htmlContent=`<h1 >Your OTP is:<strong className="text-blue-500 bg-blue-100 p-2 rounded-md"> ${otp} </strong></h1>
    <p className="text-red-500 text-lg">This OTP is valid for 5 minutes.</p>
    <p className="text-gray-600">If you did not request this OTP, please ignore this email.</p>
    `
    await transporter.sendMail({
        from:`whatsapp web < ${process.env.EMAIL_USER}`,
        to:email,
        subject:'Your OTP for WhatsApp Clone',
        html:htmlContent
    })


}


module.exports={sendOtpToEmail}




