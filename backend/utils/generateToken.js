const jwt=require('jsonwebtoken');
const dotenv=require('dotenv');
dotenv.config();

const generateToken=(userId)=>{
    return  jwt.sign({userId},process.env.JWT_SECRET_KEY,{expiresIn:'7d'})
}


module.exports={generateToken};