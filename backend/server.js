const express=require('express');
const app=express();
const mongoose=require('mongoose');
const cookieParser=require('cookie-parser');
const bodyParser=require('body-parser');
const response=require('./utils/responseHandlers.js')
const {initializeSocket}=require('./service/socketService.js');    
const http=require('http');
const cors=require('cors');
const dotenv=require('dotenv');
dotenv.config();


const PORT=process.env.PORT || 8000;

const corsOptions={
    origin:process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials:true,
}

app.use(cors(corsOptions))
app.use(response)
app.use(express.json());// parse json data from request body
app.use(cookieParser());//parse token on every request
app.use(bodyParser.urlencoded({extended:true}));


// create server 
const server=http.createServer(app);
const io=initializeSocket(server);


//apply socket middleware before routes
app.use((req,res,next)=>{
          req.io=io;
          req.socketUserMap=io.socketUserMap;
          next();
})
//// routes...
app.use('/api/auth',require('./routes/authRoute'));
app.use('/api/chat',require('./routes/chatRoutes'));
app.use('/api/status',require('./routes/statusRoute'));



mongoose.connect(
    process.env.MONGO_URI
).then(()=>{
console.log('Database connected')
}).catch((err)=>{
    console.log(err);
})






server.listen(PORT,(req,res)=>{
    console.log('Server running on this port',PORT)
})