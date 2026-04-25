import {create} from 'zustand';

import {getSocket} from '../services/chat.service.js';
import axiosInstance from '../services/url.service';


const useStatusStore=create((set,get)=>({
    statuses:[],
    loading:false,
    error:null, 
    setStatuses:(statuses)=>set({statuses}),
    setLoading:(loading)=>set({loading}),
    setError:(error)=>set({error}),

    //Initialize the socket listeners.......
    initializeSocket:()=>{
        const socket=getSocket();
        if(!socket) 
            return;

        //Real-time socket events.....
        socket.on("new_status",(newStatus)=>{
            set((state)=>({
                statuses:state.statuses.some((s)=>s._id===newStatus._id)?state.statuses:[newStatus,...state.statuses]
            }))
        });

        socket.on("status_deleted",(statusId)=>{
            set((state)=>({
                statuses:state.statuses.filter((s)=>s._id!==statusId)
            }))
        });

        socket.on("status_viewed",(statusId,viewers)=>{
            set((state)=>({
                statuses:state.statuses.map((s)=>s._id===statusId?{...s,viewers}:s)
            }))
        });
        



    },
    cleanupSocket:()=>{
        const socket=getSocket();
        if(socket)
        {
            socket.off('new_status');
            socket.off('status_deleted');
            socket.off('status_viewed');
        }
    },
    fetchStatuses:async()=>{
        set({loading:true,error:null})
        try{
            const response=await axiosInstance.get('/status/getStatuses');
            set({statuses:response.data.data})
            get().initializeSocket();
            return response.data;
        }
        catch(error)
        {
            console.error('Error fetching  statuses',error)
            set({error:error.message})
        }
        finally{
            set({loading:false})
        }
    },
    createStatus:async(statusData)=>{
        set({loading:true,error:null})
        try{
            const formData=new FormData();
            if(statusData.file)
            {
                formData.append('media',statusData.file);
            }
            if(statusData.content.trim())
            {
                formData.append('content',statusData.content.trim());
            }
            const response=await axiosInstance.post('/status/create',formData,{
            headers:{
                "Content-Type":"multipart/form-data"
            }
            })
            //add
            if(response.data.success)
            {
                set((state)=>({
                statuses:state.statuses.some((s)=>s._id===response.data.data._id)?state.statuses:[response.data.data,...state.statuses]
            }))
    
            }
            return response.data;
        

        }
        catch(error)
        {
            console.error('Error creating status',error)
            set({error:error.message})

        }
        finally{
            set({loading:false})
        }
    },
    //view status.............

    viewStatus:async(statusId)=>{
        set({loading:true,error:null})
        try{
           const response=await axiosInstance.get(`/status/view/${statusId}`)
           const data=response.data.data

            set((state)=>({
                statuses:state.statuses.map((status)=>status._id===statusId?{...status,data}:status)
            }))


        }
        catch(error)
        {
            console.error('Error viewing status',error)

            set({error:error.message})

        }
        finally{
            set({loading:false})
        }

    },
    deleteStatus:async(statusId)=>{
        set({loading:true,error:null})
        try{
            await axiosInstance.delete(`/status/delete/${statusId}`)
     
            set((state)=>({
                statuses:state.statuses.filter((s)=>s._id!==statusId)
            }))
        

        }
        catch(error)
        {
            console.error('Error deleting status',error)
          set({error:error.message})

        }
        finally{
            set({loading:false})
        }
        },


    getStatusViewers:async(statusId)=>{
        set({loading:true,error:null})
        try{
            const response=await axiosInstance.get(`/status/${statusId}/viewers}`)
            return response.data;

      
        }
        catch(error)
        {
            console.error('Error fetching status viewers',error)
            set({error:error.message})

        }
        finally{
              set({loading:false})
        }

    },
    //helper function for grouped status.......
    getGroupedStatus:()=>{
        const {statuses}=get();
    return statuses.reduce((acc,status)=>{
        const statusUserId=status.user._id;
        if(!acc[statusUserId])
        {
            acc[statusUserId]={
            id:statusUserId,
            name:status.user.username,
            profilePicture:status.user.profilePicture,
            statuses:[],

        };
        }

        acc[statusUserId].statuses.push({
            id:status._id,
            content:status.content,
            contentType:status.contentType,
            createdAt:status.createdAt,
            viewers:status.viewers,

        });
        return acc;
            
        
      
    },{})

    },

    getUserStatuses:(userId)=>{
        const groupedStatus=get().getGroupedStatus();
        return userId?groupedStatus[userId]:null;

    },

    getOtherStatuses:(userId)=>{
        const groupedStatus=get().getGroupedStatus();
        return Object.values(groupedStatus).filter((status)=>status.id!==userId)


    },

    clearError:()=>set({error:null}),
    reset:()=>set({statuses:[],loading:false,error:null}),


}))


export default useStatusStore;