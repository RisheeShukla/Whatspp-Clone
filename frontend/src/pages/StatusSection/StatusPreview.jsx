
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import formatTimestamp from "../../utils/formatTime";
import { FaChevronCircleLeft, FaChevronCircleRight, FaTimes, FaTrash } from "react-icons/fa";
const StatusPreview = ({contact,
    currentIndex,
    onNext,
    onPrevious,
    onClose,
    theme,
    currentUser,
    onDelete,
    onStatusView,
loading}) => {

    const [progess,setProgess]=useState(0);
    const currentStatus = contact.statuses[currentIndex];
    const isOwner=contact.id===currentUser._id;
useEffect(()=>{
    setProgess(0)
    let current=0;
    const interval=setInterval(()=>{
        current+=2;
        setProgess(current);
        if(current>=100)
        {
            clearInterval(interval);
            onNext();
        }
    
    },100)
    return ()=>{
        clearInterval(interval);
    }


},[currentIndex, onNext])

const handleDeleteStatus=()=>{
    if(onDelete && currentUser?._id)
    {
        onDelete(currentStatus.id);

    }
    if(contact.statuses.length===1)
    {
        onClose();
    }
    else{
        onPrevious();

    }
}
if(!currentStatus)
{
   return  null;
}

    return (
        <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                exit={{ opacity: 0 }}
                className={`fixed inset-0  h-full w-full bg-black bg-opacity-90z-50 flex  items-center justify-center`}
                style={{backdropFilter: 'blur(5px)'}}
                onClick={onClose}
                >
                    <div
                    className="relative w-full h-full max-w-4xl mx-auto flex justify-center items-center"
                    onClick={(e)=>e.stopPropagation()}>

                    
                    <div className={`w-full h-full ${theme==='dark'?'bg-[#202c33]':'bg-gray-800'} relative`}>
                        <div className="absolute top-0 left-0 right-0 flex justify-between p-4 z-10 gap-1">
                         {contact?.statuses.map((_,index)=>(
                            <div className="h-1 bg-gray-400 bg-opacity-50 flex-1 rounded-full overflow-hidden">
                                <div className="h-full bg-white transition-all duration-100 ease-linear rounded-full"
                                style={{width:index<currentIndex?'100%':index===currentIndex?`${progess}%`:'0%'}}>
                                    </div>

                                </div>
                         ))}
                        </div>
                        <div className="absolute  top-8 left-4 right-16 z-10 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <img
                                src={contact?.profilePicture}
                                alt={contact?.name}
                                className="w-14 h-14 rounded-full object-cover border-2 border-white"
                               />
                               <div>
                        <p className="text-white font-semibold">{contact?.name}</p>
                        <p className="text-gray-300 text-sm">{formatTimestamp(currentStatus.createdAt)}</p>
                        </div>
                            </div>

                         {
                            isOwner && (
                                <div className="flex items-center space-x-2 ">
                                    <button
                                    onClick={handleDeleteStatus}
                                    className="text-white bg-red-500 bg-opacity-70 rounded-full p-2 hover:bg-opacity-90 transition-all">
                                        <FaTrash className="h-4 w-4"/>
                                    </button>
                                    </div>
                            )
                         }   

                        </div>
                        <div className="w-full h-full flex items-center justify-center">
                            {
                                currentStatus.contentType==='text'?(
                                    <div className="text-white text-center p-0">
                                        <p className="text-2xl font-medium">
                                             {currentStatus.content}
                                        </p>
                                        </div>
                                ):
                                    currentStatus.contentType==='image'?(
                                        <img
                                        src={currentStatus.content}
                                        alt="Status"
                                        className="max-w-full max-h-full object-contain "
                                        />             

                                ): currentStatus.contentType==='video' ?(
                                    <video
                                    src={currentStatus.content}
                                    className="max-w-full max-h-full object-contain "
                                    controls
                                    muted
                                    autoPlay


                                    />

                                    )
                                    :
                                    null}

                        </div>
                        <button 
                        onClick={onClose}
                        className="absolute top-9 right-3 text-white bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-70 transition-all z-10"
                        >
                            <FaTimes className='h-5 w-5'/>
                        </button>

                        {
                            currentIndex>0 && (

                                <button 
                        onClick={onPrevious}
                        className="absolute left-4 top-1/2  transition -translate-y-1/2 text-white bg-green-400 bg-opacity-50 rounded-full p-3 hover:bg-opacity-70 "
                        >
                            <FaChevronCircleLeft className='h-5 w-5 '/> 
                        </button>


                            )
                        }

                         {
                            currentIndex<contact.statuses.length-1 && (

                                <button 
                        onClick={onNext}
                        className="absolute right-4 top-1/2  transition -translate-y-1/2 text-white bg-green-500 bg-opacity-50 rounded-full p-3 hover:bg-opacity-70 "
                        >
                            <FaChevronCircleRight className='h-5 w-5 '/>
                        </button>


                            )
                        }


                        

                    </div>
</div>
            </motion.div>
    )
}
export default StatusPreview;