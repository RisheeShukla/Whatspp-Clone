import {io} from 'socket.io-client'
import useUserStore from '../store/useUserStore';

let socket=null;
const Token=localStorage.getItem('auth_token');

export const initializeSocket=(currentUserData)=>{
    if(socket)
    {
        return socket;
    }
    const BACKEND_URL =process.env.REACT_APP_API_URL || "http://localhost:8000";
    socket=io(BACKEND_URL,{
        auth:{Token},
        transports:['websocket','polling'],
        reconnectionAttempts:5,
        reconnectionDelay:1000
    })
// connection events.....
socket.on('connect',()=>{
    console.log('socket connected',socket.id)
    socket.emit('user_connected',currentUserData?._id)



})
socket.on("connect_error",(error)=>{
    console.log(error.message)
    console.log("socket connection error",error)
})

socket.on('disconnect',(reason)=>{
    console.log('socket disconnected',reason)

})
return socket;

}


export const getSocket=()=>{
    if(!socket)
        return initializeSocket();
    return socket;
}

export const disconnectSocket=()=>{
    if(socket)
    {
        socket.disconnect();
        socket=null;
    }
}
