const {Server}=require('socket.io')
const Message=require('../modals/Message');
const User=require('../modals/User');
const Status=require('../modals/Status');
const socketMiddleware=require('../middleware/socketMiddleware');



// Map to store online users ->userId ,socketId
const onlineUsers=new Map();

// Map to track typing status --> userId, [conversatin]:boolean
const typingUsers=new Map();


const initializeSocket=(server)=>{
    const io=new Server(server,{
        cors:{
            origin:process.env.FRONTEND_URL,
            credentials:true,
            methods:['GET','POST','PUT','DELETE','OPTIONS']
        },
        pingTimeout:60000, // increase ping timeout to 60 seconds. Disconnect users after 60 seconds...


    })
    //socket middleware to authenticate socket connection using JWT
    io.use(socketMiddleware);
    // when a new socket connection is established

    io.on('connection',(socket)=>{
        console.log('User connected with socket id',socket.id);
        let userId=null;

        // handle user coonection and  mark them online in  db
        socket.on('user_connected',async(connectingUserId)=>{
            try{
               userId=connectingUserId;
               onlineUsers.set(userId,socket.id); 
               socket.join(userId) // join personal room for direct emits
               //upade user status to online in db
               await User.findByIdAndUpdate(userId,{
                isOnline:true,
                lastSeen:new Date()
               })
            // notify all users that  this user is now online
          io.emit('user_status',{userId,isOnline:true,lastSeen:null})

            }catch(error)
            {
                console.error('Error handling user connection:',error);
              

            }
        })

        // Return oline status of requested user
        socket.on('get_user_status',(requestedUserId,callback)=>{
            const  isOnline=onlineUsers.has(requestedUserId);
            callback({
                userId:requestedUserId,
                isOnline,
                lastSeen:isOnline?null:new Date() // if online, last seen is null, else current time

            });
        
        })
        // forward message to receiver if online
        socket.on('send_message',async(message)=>{
            try{
                const receiverSocketId=onlineUsers.get(message.receiver?._id);
                if(receiverSocketId)
                {
                    io.to(receiverSocketId).emit('receive_message',message);
                }
                   
            }
            catch(error)
            {
                console.error('Error sending message via socket:',error);
                socket.emit('message_error',{error:'Failed to send message via socket'});

            }
        })
       // update Message as read and notify the sender
         socket.on('message_read',async({messageIds,senderId})=>{
            try{
                await Message.updateMany({
                    _id:{$in:messageIds},
                    sender:senderId,
                },{
                    $set:{
                        messageStatus:'read'
                    }
                })
                const senderSocketId=onlineUsers.get(senderId);
                if(senderSocketId)
                {
                   messageIds.forEach(messageId=>{
                    io.to(senderSocketId).emit('message_status_update',{messageId,messageStatus:'read'})

                   })
                }

            }
            catch(error){
                console.error('Error marking messages as read via socket:',error);
                 socket.emit('message_error',{error:'Failed to update message status via socket'});

            }
         })

         // handle typing start event and  auto-stop after  3s....
            socket.on('typing_start',({conversationId,receiverId})=>{
                if(!conversationId || !receiverId || !userId) return;
                if(!typingUsers.has(userId))
                {
                    typingUsers.set(userId,{});
                }
                const userTyping=typingUsers.get(userId);
                userTyping[conversationId]=true;

                // claer any existing timeout for this conversation
                if(userTyping[`${conversationId}_timeout`])
                {
                    clearTimeout(userTyping[`${conversationId}_timeout`]);
                }
                //auto stop after 3s..
                userTyping[`${conversationId}_timeout`]=setTimeout(()=>{
                    userTyping[conversationId]=false;
                    socket.to(receiverId).emit('user_typing',{conversationId,userId,isTyping:false});
                },3000)

                // notify receiver that user has started typing
                socket.to(receiverId).emit('user_typing',{conversationId,userId,isTyping:true});

            })

            socket.on('typing_stop',({conversationId,receiverId})=>{
                if(!conversationId || !receiverId || !userId) return;

                if(typingUsers.has(userId))
                {
                    const userTyping=typingUsers.get(userId);
                    userTyping[conversationId]=false;
                    if(userTyping[`${conversationId}_timeout`])
                    {
                        clearTimeout(userTyping[`${conversationId}_timeout`]);
                        delete userTyping[`${conversationId}_timeout`];
                    }
                }
                socket.to(receiverId).emit('user_typing',{conversationId,userId,isTyping:false});

            })
            // Add or update reaction on message and notify sender
            socket.on('add_reaction',async({messageId,emoji,reactionUserId})=>{
                try{
                    const message=await Message.findById(messageId);
                    if(!message)
                    {
                        return;
                    }
                    const existingReactionIndex=message.reactions.findIndex(r=>String(r.user)===String(reactionUserId));
                   if(existingReactionIndex>-1)
                   {
                    const existing=message.reactions[existingReactionIndex];
                    if(existing.emoji===emoji)
                    {
                        //remove reaction
                        message.reactions.splice(existingReactionIndex,1);
                    }
                    else
                    {
                        message.reactions[existingReactionIndex].emoji=emoji;
                    }
                   }
                   else
                   {
                    //add new reaction
                    message.reactions.push({user:reactionUserId,emoji});

                   }
                   await message.save();
                   const populateMessage=await Message.findById(messageId).populate('sender','username profilePicture')
                   .populate('receiver','username profilePicture')
                   .populate('reactions.user','username profilePicture');

                   const reactionUpdated={
                    messageId,
                    reactions:populateMessage.reactions
                   }
                const senderSocketId=onlineUsers.get(populateMessage.sender._id.toString());
                const  receiverSocketId=onlineUsers.get(populateMessage.receiver._id.toString());
                if(senderSocketId)
                {
                    io.to(senderSocketId).emit('reaction_updated',reactionUpdated);
                }
                if(receiverSocketId)
                {
                    io.to(receiverSocketId).emit('reaction_updated',reactionUpdated);
                }

                }
                catch(error)
                {
                    console.error('Error adding reaction via socket:',error);
               
                }
            })



    const handleDisconnect=async()=>{
        if(!userId) return;
        try{
            onlineUsers.delete(userId);
            // clear all typing timeouts
            if(typingUsers.has(userId))
            {
                const userTyping=typingUsers.get(userId);
                Object.keys(userTyping).forEach(key=>{
                    if(key.endsWith('_timeout'))
                    {
                        clearTimeout(userTyping[key]);
                        delete userTyping[key];
                    }
                })
            }
            await User.findByIdAndUpdate(userId,{

                isOnline:false,
                lastSeen:new Date()
            })
            io.emit('user_status', {userId,isOnline:false,lastSeen:new Date()});
            socket.leave(userId)
            console.log('User disconnected with socket id',userId);


            

        }
        catch(error)
        {
            console.error('Error handling user disconnection:',error);

        }
        
    }
    socket.on('disconnect',handleDisconnect);

    })
io.socketUserMap=onlineUsers; // Expose onlineUsers map for external access if needed   
    return io;
}

module.exports={initializeSocket};

