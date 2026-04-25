const {createStatus,getStatuses,viewStatus,deleteStatus,getStatusViewers}=require('../controllers/statusController');
const express=require('express');
const router=express.Router();
const authMiddleware=require('../middleware/authMiddleware.js');
const {multerMiddleware}=require('../config/cloudinaryConfig.js');


router.post('/create',authMiddleware,multerMiddleware,createStatus);
router.get('/getStatuses',authMiddleware,getStatuses);
router.get('/view/:statusId',authMiddleware,viewStatus);
router.delete('/delete/:statusId',authMiddleware,deleteStatus);
router.get('/:statusId/viewers',authMiddleware,getStatusViewers);
module.exports=router;