import {create} from 'zustand'
import { getSocket } from '../services/chat.service';
import { reach } from 'yup';
import axiosInstance from '../services/url.service';

export const useChatStore=create((set,get)=>({
    conversation:[],
    currentConversation:null,
    currentUser:null,
    messages:[],
    loading:false,
    error:null,
    onlineUsers:new Map(),
    typingUsers:new Map(),
    
    //socket event listener.....
    initsocketListeners:()=>{
        const socket=getSocket();
        if(!socket) return;
        // remove existing listeners to prevent duplicate.......
        socket.off('receive_message');
        socket.off('user_typing');
        socket.off('user_status');

        socket.off('message_send');
        socket.off('message_error');
        socket.off('message_deleted')

        //listen for incoming messages..
        socket.on('receive_message',(message)=>{


        })

        //confirm message delivered

        socket.on('message_send',(message)=>{
            set((state)=>({
                messages:state.messages.map((msg)=> msg._id===message._id?{...msg}:msg)
            }))
        })
        //update message status
        socket.on('message_status_update',({messageId,messageStatus})=>{
            set((state)=>({
                messages:state.messages.map((msg)=>msg._id===messageId?{...msg,messageStatus}:msg)

            }))
    })


    // handle reaction on message

     socket.on('reaction_updated',({messageId,reactions})=>{
            set((state)=>({
                messages:state.messages.map((msg)=>msg._id===messageId?{...msg,reactions}:msg)

            }))
    })

    //handle remove message from localstore
     socket.on('message_deleted',({deletedMessageId})=>{
            set((state)=>({
                messages:state.messages.filter((msg)=>msg._id!==deletedMessageId)

            }))
    })
// handle any message sending error...
socket.on('message_error',(error)=>{
    console.log("message errors",error)
})
//listner for typing users....
socket.on('user_typing',({conversationId,userId,isTyping})=>{
    set((state)=>{
        const newTypingUsers=new Map(state.typingUsers);
        if(!newTypingUsers.has(conversationId))
        {
            newTypingUsers.set(conversationId, new Set()); // Initialize with a Set, not an object
        }
        const typingSet=newTypingUsers.get(conversationId); // Get the Set after ensuring it exists
        if(isTyping)
        {
          typingSet.add(userId)  

        }
        else
        {
            typingSet.delete(userId);

        }
        return {typingUsers:newTypingUsers}

    })
})
//track users online/offline status

        socket.on("user_status", ({ userId, isOnline, lastSeen }) => {
            set((state) => {
                const newOnlineUsers = new Map(state.onlineUsers);
                newOnlineUsers.set(userId, { isOnline, lastSeen });
                return { onlineUsers: newOnlineUsers };
            });
        });

        // emit status check for all users in conversation list..
        const { conversation, currentUser } = get();
        if (conversation.length > 0 && currentUser?._id) {
            const uniqueOtherUserIds = new Set();
            conversation.forEach((conv) => {
                const otherParticipant = conv.participants.find((p) => p._id !== currentUser._id);
                if (otherParticipant?._id) {
                    uniqueOtherUserIds.add(otherParticipant._id);
                }
            });

            uniqueOtherUserIds.forEach((userId) => {
                socket.emit('get_user_status', userId, (status) => {
                    set((state) => {
                        const newOnlineUsers = new Map(state.onlineUsers);
                        newOnlineUsers.set(status.userId, { isOnline: status.isOnline, lastSeen: status.lastSeen });
                        return { onlineUsers: newOnlineUsers };
                    });
                });
            });
        }
    }, // Closing brace for initsocketListeners
      setCurrentUser:(user)=>set({currentUser:user}),
      fetchConversations:async()=>{
        set({loading:true,error:null})
        try{
            const response=await axiosInstance.get('/chat/conversations')
         
            const data = response.data.data;

set({ conversation: data });



            get().initsocketListeners();
            return response.data;

        }
        catch(error)
        {
            set({error:error.message})
            
        }
        finally{
            set({loading:false})

        }

      },
  //fetch message for a conversation
  fetchMessages:async(conversationId)=>{
    if(!conversationId) return;
    set({loading:true,error:null})
   try{
    const response=await axiosInstance.get(`/chat/conversations/${conversationId}/messages`)
    set({messages:response.data?.data,
        currentConversation:conversationId,

    })
    const {markMessagesAsRead}=get();
    markMessagesAsRead();
    return response.data;



   }catch(error)
   {
    set({error:error.message})
   }
   finally{
    set({loading:false})

   }
  },
  //send message in real time
   sendMessage:async(formData)=>{

    const senderId=formData.get('senderId');
    const receiverId=formData.get('receiverId');
    const media=formData.get('media');
    const content=formData.get('content');
    const messageStatus=formData.get('messageStatus');
    set({loading:true,error:null})
    const socket=getSocket();
  const {conversation}=get();
   let conversationId=null;
   if(conversation.length>0)
   {
    const newconversation=conversation.find((conv)=>conv.participants.some((p)=>p._id===senderId) && conv.participants.some((p)=>p._id===receiverId))
       if(newconversation)
       {
        conversationId=newconversation._id;
        set({currentConversation:conversationId})
       }
   }
   //temp message before actual response...
   const tempId=`temp-${Date.now()}`
   const optimisticMessage={
    _id:tempId,
    sender:senderId,
    receiver:receiverId,
    conversation:conversationId,
    imageOrVideoUrl:media && typeof media!=='string'?URL.createObjectURL(media):null,
    content:content,
    messageStatus:messageStatus,
    contentType:media?media.type.startsWith('image')?"image":"video":"text",
   }
   set((state)=>({
    messages:[...state.messages,optimisticMessage]

   }))
   set({loading:true,error:null})
   try{
    const response=await axiosInstance.post('/chat/send-message',formData,{
        headers:{
            'Content-Type':'multipart/form-data'
        }
    
   })
   set((state)=>({
    messages:state.messages.map((msg)=>msg._id===tempId?response.data?.data:msg)

   }))
   return response.data;

   }catch(error)
{
    console.log(error)
    set((state)=>({
    messages:state.messages.map((msg)=>msg._id===tempId?{...msg,messageStatus:'failed'}:msg)

   }))
    set({error:error.message})
}
finally{
    set({loading:false})


}
},
   receiveMessage:(message)=>{
    if(!message)
    {
        return;
    }
    const {currentConversation,currentUser,messages}=get();
    const messageExist=messages.some((msg)=>msg._id===message._id)
    if(messageExist)
    {
        return

    }
    if(currentConversation===message.conversation)
    {
        set((state)=>({
            messages:[...state.messages,message]
        }))
    
    }
    //automatically mark as read
    if(message.receiver?._id===currentUser._id)
    {
        get.markMessagesAsRead();

    
    }

    //update conversation preview and unread count
    set((state)=>{
        const updateConversations=state.conversation?.map((conv)=>{
            if(conv._id===message.conversation)
            {
                return{
                    ...conv,
                    lastMessage:message,
                    unreadCount:message?.receiver?._id===currentUser._id?(conv.unreadCount || 0)+1:(conv.unreadCount || 0)
                }
            }
            return conv;
        })
        return { conversation: updateConversations }
    })


    

   },

//mark as read...

markMessagesAsRead:async()=>{
    const  {messages,currentUser}=get();
    if(!messages.length || !currentUser)
    {
        return;

    }
    const unreadIds=messages.filter((msg)=>msg.receiver._id===currentUser._id && msg.messageStatus!=='read').map(
        (msg)=>msg._id

    ).filter(Boolean)

    if(unreadIds.length===0)
    {
        return 
    }
    try{
        const response=await axiosInstance.put('/chat/messages/mark-as-read',{
            messageIds:unreadIds
        })
        set((state)=>({
            messages:state.messages.map((msg)=>unreadIds.includes(msg._id)?{...msg,messageStatus:'read'}:msg)
        }))

     const socket=getSocket();
  if(socket)
  {
    socket.emit('message_read',{messageIds:unreadIds,senderId:messages[0]?.sender._id})
  }
    }
    catch(error)
    {
          console.error('Error marking messages as read:',error);
    
    }

},
deleteMessage:async(messageId)=>{
          set({loading:true,error:null})

    try{
        await axiosInstance.delete(`/chat/messages/${messageId}`)
      set((state)=>({
        messages:state.messages.filter((msg)=>msg._id!==messageId)
      }))
    }
    catch(error)
    {
        console.error('Error deleting message:',error);
       set({error:error.message})
    }
},



addReaction:async(messageId,emoji)=>{
   const  socket=getSocket();
   const {currentUser}=get()
   if(socket && currentUser)
   {
    socket.emit('add_reaction',{
        messageId,
        emoji,
        userId:currentUser?._id
    })
   }

},
startTyping:(receiverId)=>{
    const {currentConversation}=get();
    const socket=getSocket();
 if(socket && receiverId)
 {
    socket.emit('typing_start',{
        conversationId:currentConversation,
        receiverId:receiverId
    })

 


 }
},

// Renamed to stopTyping to avoid duplication
stopTyping:(receiverId)=>{
    const {currentConversation}=get();
    const socket=getSocket();
 if(socket && receiverId)
 {
    socket.emit('typing_stop',{
        conversationId:currentConversation,
        receiverId:receiverId
    });
 }
},
isUserTyping:(userId)=>{
    const {typingUsers,currentConversation}=get();
if(!currentConversation || !typingUsers.has(currentConversation) || !userId)
{
    return false;
}

return typingUsers.get(currentConversation).has(userId);

},
      
isUserOnline:(userId)=>{
    if(!userId)
    {
        return null;
    }
    const {onlineUsers}=get();
    return onlineUsers.get(userId)?.isOnline || false;

},
getUserLastSeen:(userId)=>{
    if(!userId)
    {
        return null;
    }
    const {onlineUsers}=get();
    return onlineUsers.get(userId)?.lastSeen || null;

},

cleanup:()=>{
    set({
        conversation:[],
        currentConversation:null,
      
        messages:[],
        onlineUsers:new Map(),
        typingUsers:new Map(),
    
    })
}
}))