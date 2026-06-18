const nodemailer=require('nodemailer');
const dotenv=require('dotenv');
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_HOST,
  port: Number(process.env.BREVO_PORT),
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS,
  },

  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
});


const sendOtpToEmail=async(email,otp)=>{
    const htmlContent=`<h1 >Your OTP is:<strong className="text-blue-500 bg-blue-100 p-2 rounded-md"> ${otp} </strong></h1>
    <p className="text-red-500 text-lg">This OTP is valid for 5 minutes.</p>
    <p className="text-gray-600">If you did not request this OTP, please ignore this email.</p>
    `
    await transporter.sendMail({
        from:`RRR< ${process.env.EMAIL_USER}`,
        to:email,
        subject:'Your OTP for WhatsApp Clone',
        html:htmlContent
    })


}


module.exports={sendOtpToEmail}




