const Conversation=require('../modals/Conversation.js');
const Message=require('../modals/Message.js');
const {uploadFileToCloudinary,multerMiddleware}=require('../config/cloudinaryConfig.js');

const sendMessage=async(req,res)=>{
               try{
                const {senderId,receiverId,content,messageStatus} = req.body;
                const file=req.file;

                const participants=[senderId,receiverId].sort();
                let conversation=await Conversation.findOne({participants:participants});
                if(!conversation)
                {
                    conversation=new Conversation({participants:participants });
                    await conversation.save();
                }
                let imageOrVideoUrl=null;
                let contentType='text';

                // handle file upload 
               if(file) 
               {
                const result=await uploadFileToCloudinary(file);
                if(!result.secure_url)
                {
                    return res.badRequest('File upload to cloudinary failed');
                }
                imageOrVideoUrl=result.secure_url;
                 if(file.mimetype.startsWith('image'))
                 {
                    contentType='image';
                 }
                 else if(file.mimetype.startsWith('video'))
                 {
                    contentType='video';
                 }
                 else
                 {
                    return res.badRequest('Unsupported file type');
                 }
               

               }
               else if(content?.trim())
               {
                contentType='text';
               }
               else
               {
                return res.badRequest('Message content is required');
               }
               const message=new Message({
                conversation:conversation._id,
                sender:senderId,
                receiver:receiverId,
                content,
                imageOrVideoUrl,
                contentType,
                messageStatus

               })
               await message.save();
               if(message?.content.trim())
               {
              conversation.lastMessage=message._id;  
               }
               conversation.unreadCount+=1;
               await conversation.save();
             const populateMessage=await Message.findById(message._id).populate('sender','username profilePicture').populate('receiver','username profilePicture');  
             
             // Emit event for real-time updates using Socket.IO
             if(req.io && req.socketUserMap)
             {
                const receiverSocketId=req.socketUserMap.get(receiverId);
                if(receiverSocketId)
                {
                    req.io.to(receiverSocketId).emit('receive_message',populateMessage);
                    message.messageStatus='delivered';
                    await message.save();

                }
             }

             return res.ok(populateMessage,'Message sent successfully');
               }
               catch(error)
               {
                console.log(error);
                return res.serverError('Failed to send message',[error.message])
               }
}




const getConversation=async(req,res)=>{
    try{
        const userId=req.id;
        const conversations=await Conversation.find({participants:userId}).populate({
            path:'lastMessage',
            populate:{
                path:'sender receiver',
                select:'username profilePicture'
            }

        })
        .populate('participants','username profilePicture isOnline lastSeen').sort({updatedAt:-1}).lean();  
        return res.ok(conversations,'Conversations retrieved successfully');

    }
    catch(error){
        console.log(error);
                return res.serverError('Failed to get conversations',[error.message])

    }
}

// get messages of specific conversation by conversation id....

const getMessages=async(req,res)=>{
    const {conversationId}=req.params;
    const userId=req.id; 
    try{
        const conversation=await Conversation.findById(conversationId);
        if(!conversation)
        {
            return res.notFound('Conversation not found');
        }
        if(!conversation.participants.includes(userId))
        {
            return res.forbidden('You are not a participant of this conversation');
        }
        const messages=await Message.find({conversation:conversationId}).populate('sender','username profilePicture').populate('receiver','username profilePicture').sort({createdAt:1}).lean();
     await Message.updateMany({
    conversation:conversationId,
    receiver:userId,
    messageStatus:{$in:['send','delivered']}
},{
    $set:{
        messageStatus:'read'
    }
})

       conversation.unreadCount=0;
       await conversation.save();
        return res.ok(messages,'Messages retrieved successfully');
    }
    catch(error)
    {

        console.log(error);
        return res.serverError('Failed to get messages of specific conversation',[error.message])
    }

}

const maskAsRead=async(req,res)=>{
    const {messageIds}=req.body;
    const userId=req.id;
    try{
        let messages=await Message.find({
            _id:{$in:messageIds},
            receiver:userId,
        })
        await Message.updateMany({
            _id:{$in:messageIds},
            receiver:userId,
        },{
            $set:{
                messageStatus:'read'
            }
        })
    // notifying to original sender about message read
        if(req.io && req.socketUserMap)
             {
                for(const message of messages)
                {
                    const senderSocketId=req.socketUserMap.get(message.sender.toString());
                    if(senderSocketId)
                    {
                        const updatedMessage={
                            _id:message._id,
                            messageStatus:'read'
                        }
                        req.io.to(senderSocketId).emit('message_read',updatedMessage);
                    }
                }
             }


        return res.ok(messages,'Messages marked as read successfully');

    }
    catch(error)
    {
        console.log(error);
        res.serverError('Failed to mark messages as read',[error.message])

    }

}
const deleteMessage=async(req,res)=>{
    const {messageId}=req.params;
    const userId=req.id;
    try{
        const message=await Message.findById(messageId);
        if(!message)
        {
            return res.notFound('Message not found');
        }
        if(message.sender.toString()!==userId)
        {
            return res.forbidden('You are not the sender of this message');
        }
        await message.deleteOne();
        if(req.io && req.socketUserMap)
        {
            const receiverSocketId=req.socketUserMap.get(message.receiver.toString());
            if(receiverSocketId)
            {
                req.io.to(receiverSocketId).emit('message_deleted',messageId);
            }
        }
        return res.ok(message,'Message deleted successfully');

    }
    catch(error)
    {
        console.log(error);
        return res.serverError('Failed to delete message',[error.message])
    }
}


    
module.exports={sendMessage, getConversation, getMessages, maskAsRead, deleteMessage};