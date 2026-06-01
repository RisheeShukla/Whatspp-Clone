import React from "react";
import {  useEffect, useRef, useState } from "react";
import useUserStore from "../../store/useUserStore";
import useThemeStore from "../../store/themeStore";
import { useChatStore } from "../../store/chatStore";
import { isToday, isYesterday, format } from 'date-fns'
import { FaLaptop, FaLock, FaArrowLeft, FaEllipsisV, FaTimes, FaPaperclip, FaImage, FaFile, FaPaperPlane,FaSmile,FaVideo } from "react-icons/fa";
import MessageBubble from "./MessageBubble";
import EmojiPicker from 'emoji-picker-react'
const isValidate = (date) => {
    return date instanceof Date && !isNaN(date);
}
const ChatWindow = ({ selectedContact, setSelectedContact }) => {

    const [message, setMessage] = useState("");
    const [showEmoji, setShowEmoji] = useState(false);
    const [showFileMenu, setShowFileMenu] = useState(false);
    const [filePreview, setFilePreview] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const typingTimeOutRef = useRef(null);
    const messageEndRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const fileInputRef = useRef(null);
    const { theme } = useThemeStore();
    const { user } = useUserStore();
    const messages = useChatStore((s) => s.messages);
const conversation = useChatStore((s) => s.conversation);
const sendMessage = useChatStore((s) => s.sendMessage);
const addReaction = useChatStore((s) => s.addReaction);
const deleteMessage = useChatStore((s) => s.deleteMessage);
const fetchMessages = useChatStore((s) => s.fetchMessages);
const fetchConversations = useChatStore((s) => s.fetchConversations);
const startTyping = useChatStore((s) => s.startTyping);
const stopTyping = useChatStore((s) => s.stopTyping);

    //get online status and last seen
    const online = useChatStore().isUserOnline(selectedContact?._id);
    const lastSeen =useChatStore().getUserLastSeen(selectedContact?._id);
    const isTyping = useChatStore().isUserTyping(selectedContact?._id);

    useEffect(() => {
        if (selectedContact?._id && conversation?.length > 0) {

            const conversations = conversation.find((conv) => conv.participants.some((participant) => participant._id === selectedContact?._id))
            console.log(conversations)
            if (conversations._id) {
                fetchMessages(conversations._id);
            }
        }

    }, [selectedContact, fetchMessages, conversation])

    useEffect(() => {
        fetchConversations();
    
    }, [fetchConversations])

    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" })

    }
    useEffect(() => {
        scrollToBottom();
    }, [messages])

    useEffect(() => {
        if (message && selectedContact) {
            startTyping(selectedContact._id)
            if (typingTimeOutRef.current) {
                clearTimeout(typingTimeOutRef.current);
            }
            typingTimeOutRef.current = setTimeout(() => {
                 stopTyping(selectedContact._id)
            }, 3000)

        }
        return () => {
            if (typingTimeOutRef.current) {
                clearTimeout(typingTimeOutRef.current);
            }
        }
    }, [message, selectedContact, startTyping, stopTyping])


    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setShowFileMenu(false);
            if (file.type.startsWith("image/")) {
                setFilePreview(URL.createObjectURL(file))
            }
        }
    }

    const handleSendMessage = async () => {
        if (!selectedContact) return;
        setFilePreview(null);
        try {
            const formData = new FormData();
            formData.append("senderId", user._id);
            formData.append("receiverId", selectedContact._id);
            const status = online ? "delivered" : "send";
            formData.append("messageStatus", status);
            if (message.trim())
                formData.append("content", message.trim());
            if (selectedFile) {
                formData.append("media", selectedFile);
            }
            if (!message.trim() && !selectedFile)
            {
                return;
            }
            await sendMessage(formData)
            setMessage("");
            setFilePreview(null)
            setSelectedFile(null);
            setShowFileMenu(false);

        } catch (error) {
            console.log('failed to send message', error)

        }



    }
    const renderDateSeparator = (date) => {
        if (!isValidate(date)) {
            return null;
        }
        let dateString;
        if (isToday(date)) {
            dateString = "Today";
        }
        else if (isYesterday(date)) {
            dateString = 'Yesterday'
        }
        else {
            dateString = format(date, 'EEEE, MMMM d')
            
        }

        return (
                <div className="flex justify-center my-4">
                    <span className={`px-4 py-2 rounded-full text-sm ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                        {dateString}
                    </span>
                </div>
            )
    }
    //Group messaging...........
    const groupedMessages = Array.isArray(messages) && messages.reduce((acc, message) => {
        if (!message.createdAt)
            return acc;
        const date = new Date(message.createdAt)
        if (isValidate(date)) {
            const dateString = format(date, 'yyyy-MM-dd');
            if (!acc[dateString]) {
                acc[dateString] = [];

            }
            acc[dateString].push(message);


        }
        else {
            console.log('Invalid date format',)
        }
        return acc;



    }, {}) || {};
    const handleReaction = (messageId, emoji) => {
        addReaction(messageId, emoji);

    }

    if (!selectedContact) {
        return (
            <div className="flex-1 flex items-center justify-center mx-auto h-screen text-center">
                <div className="max-w-md">
                    <FaLaptop
                        alt='chat-app'
                        className="w-full h-auto" />
                    <h2 className={`text-3xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                        Select a conversation to start chatting
                    </h2>
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
                        Choose a contact from the list  on the left to  begin messaging
                    </p>

                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm mt-8 flex items-center justify-center gap-2`}>
                        <FaLock className="h-4 w-4" />
                        Your  personal to messages are end-to-encrypted....
                    </p>
                </div>

            </div>
        )
    }
    return (
        <div className="flex-1 h-screen w-full flex flex-col">
            <div className={`p-4 ${theme === 'dark' ? "bg-green-500 text-white" : "bg-green-400 text-gray-600"} flex items-center`}>
                <button className="mr-2 focus:outline-none"
                    onClick={() => setSelectedContact(null)}
                >
                    <FaArrowLeft className="h-6 w-6" />
                </button>
                <img
                    src={selectedContact?.profilePicture}
                    alt={selectedContact?.username}
                    className="w-10 h-10 rounded-full" />

                <div className="ml-3 flex-grow">
                    <h2 className="font-semibold text-start">
                        {selectedContact?.username}

                    </h2>
                    {isTyping ? (
                        <div>
                            Typing...
                        </div>) :
                        (
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {online ? 'Online' : lastSeen ? `Last seen ${format(new Date(lastSeen), 'HH:mm')} ` : 'Offline'}
                            </p>

                        )}

                </div>
                <div className="flex items-center space-x-4">
                    <button className="focus:outline-none">
                        <FaVideo className="h-5 w-5" />


                    </button>

                    <button className="focus:outline-none">
                        <FaEllipsisV className="h-5 w-5" />
                    </button>

                </div>

            </div>
            <div className={`flex-1 p-4 overflow-y-auto ${theme === 'dark' ? 'bg-gray-500' : 'bg-gray-300'}`}>
                {Object.entries(groupedMessages).map(([date, msgs]) => (
                    <React.Fragment key={date}>
                        {renderDateSeparator(new Date(date))}
                        {
                            msgs.filter((msg) => msg.conversation === selectedContact.conversation?._id)
                                .map((msg) => (
                                    <MessageBubble
                                        key={msg._id}
                                        message={msg}
                                        theme={theme}
                                        currentUser={user}
                                        onReact={handleReaction}
                                        deleteMessage={deleteMessage}


                                    />
                                ))
                        }
                    </React.Fragment>
                ))}
                <div ref={messageEndRef} />

            </div>
            {filePreview && (
                <div className="relative p-3">
                    {selectedFile?.type.startsWith("video/") ? (
                        <video
                        src={filePreview}
                        controls
                        className="w-80  object-cover rounded-lg mx-auto"/>
                    ):
                    (
                    <img
                    src={filePreview}
                        alt="file-preview"
                        className="w-80 object-cover rounded  shadow-lg mx-auto"
                    />
                )}
                    <button
                        onClick={() => {
                            setSelectedFile(null)
                                setFilePreview(null)
                        }}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                    >
                        <FaTimes className="h-4 w-4" />
                    </button>
                </div>
            )}
            <div className={`p-4 ${theme === 'dark' ? 'bg-gray-200' : 'bg-white'} flex items-center space-x-2 relative`}>
                <button
                    onClick={() => setShowEmoji(!showEmoji)}
                    className="focus:ouline-none">
                    <FaSmile className={`h6 w-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                </button>
                {
                    showEmoji && (
                        <div ref={emojiPickerRef}
                            className="absolute left-0 bottom-16 z-50"

                        >
                            <EmojiPicker
                                onEmojiClick={(emojiObject) => {
                                    setMessage((prev) => prev + emojiObject.emoji)
                                    setShowEmoji(false)
                                }}
                                theme={theme} />

                        </div>
                    )
                }
                <div className="relative ">
                    <button className="focus:outline-none"
                    onClick={()=>setShowFileMenu(!showFileMenu)}
                    >
                        <FaPaperclip className={`h-6 w-6 ${theme==='dark'?'text-gray-400':'text-gray-500'} mt-2`}/>

                    </button>
                   {showFileMenu && (
                    <div className={`absolute bottom-full left-0 mb-2 ${theme==='dark'?'bg-gray-700':'bg-white'} rounded-lg shadow-lg`}>
                        <input
                        type='file'
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*,video/*"
                        
                        />
                        <button
                         onClick={()=>fileInputRef.current.click()}
                         className={`flex items-center px-2 py-2 w-full transition-colors hover:bg-gray-100 ${theme==='dark'?'hover:bg-gray-500':'hover:bg-gray-100'}`}
                         >
                            <FaImage className="mr-2 h-4 w-4"/> Image/Video

                        </button>

                         <button
                         onClick={()=>fileInputRef.current.click()}
                         className={`flex items-center px-2 py-2 w-full transition-colors hover:bg-gray-100 ${theme==='dark'?'hover:bg-gray-500':'hover:bg-gray-100'}`}
                         >
                            <FaFile className="mr-2 h-4 w-4"/> Documents

                        </button>
                        </div>
                   )} 
                    

                </div>
                <input
                type='text'
                value={message}
                onChange={(e)=>setMessage(e.target.value)}
                onKeyPress={(e)=>{
                    if(e.key==='Enter')
                    {
                        handleSendMessage();
                    }
                }}
                placeholder="Type a message"
                className={`flex-grow px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 ${theme==='dark'?'bg-gray-700 text-white border-gray-600':'text-black bg-white border-gray-300'}`}
                />
          <button onClick={handleSendMessage}
          className="focus:outline-none">
            <FaPaperPlane className="h-6 w-6 text-green-500"/>
          </button>

            </div>
        </div>
    )
}
export default ChatWindow;
