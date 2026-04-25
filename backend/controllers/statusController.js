const Status=require('../modals/Status.js');
const {uploadFileToCloudinary}=require('../config/cloudinaryConfig.js');

const createStatus=async(req,res)=>{
               try{
                const {content} = req.body;
                const file=req.file;
                const userId=req.id;
        
                let mediaUrl=null;
                let finalContentType=null;

                // handle file upload 
               if(file) 
               {
                const result=await uploadFileToCloudinary(file);
                if(!result.secure_url)
                {
                    return res.badRequest('File upload to cloudinary failed');
                }
                mediaUrl=result.secure_url;
                 if(file.mimetype.startsWith('image'))
                 {
                    finalContentType='image';
                 }
                 else if(file.mimetype.startsWith('video'))
                 {
                    finalContentType='video';
                 }
                 else
                 {
                    return res.badRequest('Unsupported file type');
                 }
               

               }
               else if(content?.trim())
               {
                finalContentType='text';
               }
               else
               {
                return res.badRequest('Message content is required');
               }

               const expiresAt=new Date();
               expiresAt.setHours(expiresAt.getHours()+24);
               const status=new Status({
                user:userId,
                content:mediaUrl || content,
                contentType:finalContentType,
                expiresAt
               })
               await status.save();
         const populateStatus=await Status.findById(status._id).populate('user','username profilePicture')
         .populate('viewers','username profilePicture');      


            //Emit socket event ......
            if(req.io && req.socketUserMap)
            {
                //Broadcast the new status to all online users except the creator....
                for(const [connectedUserId,socketId] of req.socketUserMap)
                {
                    if(connectedUserId!==userId)
                    {
                        req.io.to(socketId).emit('new_status',populateStatus);
                    }


                }

            }

        


             return res.ok(populateStatus,'Status created successfully');
               }
               catch(error)
               {
                console.log(error);
                return res.serverError('Failed to create status',[error.message])
               }
}


const getStatuses=async(req,res)=>{
    try{
        const userId=req.id;
        const statuses=await Status.find({
            expiresAt:{$gt:new Date()}
        }).populate('user','username profilePicture').
        populate('viewers','username profilePicture').sort({createdAt:-1});
        return res.ok(statuses,'Statuses retrieved successfully')
    }

    catch(error)
    {
        console.log(error)
        return res.serverError('Failed to fetch the statuses')
    }
}

const viewStatus=async(req,res)=>{
    const {statusId}=req.params
    const userId=req.id;
    try{
    const status=await Status.findById(statusId)
    if(!status)
    {
       return  res.notFound('status is not available');
    }
    if(!status.viewers.includes(userId))
    {

        status.viewers.push(userId);
        await status.save();
    }
        const updatedStatus=await Status.findById(statusId).populate('user','username profilePicture').
         populate('viewers','username profilePicture')

        //Emit socket event...
      if(req.io && req.socketUserMap)  
      {
        const statusOwnerSocketId=req.socketUserMap.get(status.user.toString());
        if(statusOwnerSocketId)
        {
            const viewData={
                statusId,
                viewerId:userId,
                totalViewers: updatedStatus.viewers.length,
                viewers:updatedStatus.viewers
            }
            req.io.to(statusOwnerSocketId).emit('status_viewed',viewData);
    
        }
        else
        {
            console.log('Status owner is not online, cannot emit status_viewed event');
        }
      }
      return res.ok(updatedStatus,'Status viewed successfully ');

    }

    //Emit socket event
    catch(error){
        console.log(error)
        res.serverError('Failed to view the status')

    }
}


const deleteStatus=async(req,res)=>{
    const {statusId}=req.params;
    const userId=req.id;
    try{
        const status=await Status.findById(statusId);
        if(!status)
        {
            return res.notFound('Status not found');
        }
        if(status?.user.toString()!==userId)
        {
            return res.forbidden('You are not authorized to delete this status');
        }
        await status.deleteOne();
        if(req.io && req.socketUserMap)
        {
            for(const [connectedUserId,socketId] of req.socketUserMap)
            {
                if(connectedUserId!==userId)
                {
                    req.io.to(socketId).emit('status_deleted',statusId);
                }
            }

        }
        return res.ok('Status deleted successfully');


    }
    catch(error)
    {
        console.log(error)
        return res.serverError('Failed to delete the status')
    }
}

const getStatusViewers=async(req,res)=>{
    try{
        const {statusId}=req.params;
        const status=await Status.findById({
            statusId
        }).populate('user','username profilePicture').
        populate('viewers','username profilePicture').sort({createdAt:-1});
        return res.ok(status,'Statuses retrieved successfully')
    }

    catch(error)
    {
        console.log(error)
        return res.serverError('Failed to fetch the status')
    }
}

module.exports={createStatus,getStatuses,viewStatus,deleteStatus,getStatusViewers}