const express=require('express')
const router=express.Router()
const {sendOtp,verifyOTP,updateProfile,logout,checkAuthenticated, getAllUsers}=require('../controllers/authController.js');
const authMiddleware = require('../middleware/authMiddleware.js');
const { multerMiddleware } = require('../config/cloudinaryConfig.js');

router.post('/send-otp',sendOtp);
router.post('/verify-otp',verifyOTP);
router.put('/update-profile',authMiddleware,multerMiddleware,updateProfile)
router.get('/logout',authMiddleware,logout)
router.get('/profile',authMiddleware,checkAuthenticated)
router.get('/users',authMiddleware,getAllUsers)
module.exports=router;