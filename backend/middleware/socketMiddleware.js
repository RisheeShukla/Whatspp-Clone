const jwt=require('jsonwebtoken')



const socketMiddleware=(socket,next)=>{
    const token=socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
  if(!token)
  {
    return next(new Error('No token provided.Please login to access this resource'));
  }
    try{
        const decode=jwt.verify(token,process.env.JWT_SECRET_KEY);
        socket.userId=decode.userId;
        next();

    }
    catch(error)
    {
        console.log(error);
        return next(new Error('Invalid or expired token'));

    }


}

module.exports=socketMiddleware;
