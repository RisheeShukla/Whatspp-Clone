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


const sendOtpToEmail=async(email,otp)=>{
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h1 style="color: #25D366;">Your OTP for WhatsApp Clone</h1>
        <p>Your One-Time Password is: 
            <strong style="font-size: 1.2em; color: #128C7E; background-color: #E0F2F1; padding: 4px 8px; border-radius: 4px; margin-left: 5px;">${otp}</strong>
        </p>
        <p style="color: #d9534f; font-size: 0.9em;">This OTP is valid for 5 minutes.</p>
        <p style="color: #777; font-size: 0.9em;">If you did not request this OTP, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 0.8em; color: #aaa;">WhatsApp Clone</p>
    </div>
    `;
    await transporter.sendMail({
        from:`whatsapp web < ${process.env.EMAIL_USER}`,
        to:email,
        subject:'Your OTP for WhatsApp Clone',
        html:htmlContent
    })


}


module.exports={sendOtpToEmail}





