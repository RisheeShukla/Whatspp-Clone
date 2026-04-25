const jwt=require('jsonwebtoken')



const authMiddleware=(req,res,next)=>{
    const authHeader=req.headers['authorization'];
    if(!authHeader || !authHeader.startsWith('Bearer '))
    {
        return res.unauthorized('No token provided.Please login to access this resource');
    }
    const authToken=authHeader.split(' ')[1];
    try{
        const decode=jwt.verify(authToken,process.env.JWT_SECRET_KEY);
        req.id=decode.userId;
        next();

    }
    catch(error)
    {
        console.log(error);
        return res.unauthorized('Invalid or expired token');

    }


}

module.exports=authMiddleware;

