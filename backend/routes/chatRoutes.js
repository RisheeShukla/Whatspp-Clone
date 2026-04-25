const express=require('express')
const router=express.Router()

const {sendMessage, getConversation, getMessages, maskAsRead, deleteMessage}=require('../controllers/chatController.js');
const authMiddleware = require('../middleware/authMiddleware.js');
const { multerMiddleware } = require('../config/cloudinaryConfig.js');


router.post('/send-message',authMiddleware,multerMiddleware,sendMessage);
router.get('/conversations',authMiddleware,getConversation);
router.get('/conversations/:conversationId/messages',authMiddleware,getMessages);
router.put('/messages/mark-as-read',authMiddleware,maskAsRead);
router.delete('/messages/:messageId',authMiddleware,deleteMessage);
module.exports=router;