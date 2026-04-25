import React, { useState, useEffect } from "react";
import useThemeStore from "../../store/themeStore";
import useStatusStore from "../../store/useStatusStore";
import { set } from "date-fns";
import Layout from "../../components/Layout";
import StatusPreview from "./StatusPreview";
import { motion } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
import useUserStore from "../../store/useUserStore";
import { FaCamera, FaEllipsisH, FaPlus, FaTimes } from "react-icons/fa";
import formatTimestamp from "../../utils/formatTime";
import StatusList from "./StatusList";



const Status = () => {

    const [previewContact, setPreviewContact] = useState(null);
    const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
    const [showOptions, setShowOptions] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [showCreateModel, setShowCreateModel] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [filePreview, setFilePreview] = useState(null);
    const { theme } = useThemeStore((state) => state.theme)
    const { user } = useUserStore();
    const { statuses, loading, error, fetchStatuses, createStatus, viewStatus, deleteStatus, getStatusViewers,
        getUserStatuses, getOtherStatuses, clearError, reset, initializeSocket, cleanupSocket } = useStatusStore();

    const userStatus = getUserStatuses(user?._id);
    const otherStatus = getOtherStatuses(user?._id);
    useEffect(() => {
        fetchStatuses();
        initializeSocket();
        return () => {
            cleanupSocket();
        }

    }, [user?._id])
    useEffect(()=>{
        statuses.forEach(status=>{
            if(status.expiresAt && new Date(status.expiresAt)<new Date())
            {
                deleteStatus(status.id);
            }
        })
    },[statuses])

    useEffect(() => {
        return () => {
            clearError();
        }
    }, [])

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
                setFilePreview(URL.createObjectURL(file))
            }
        }
    };


    const handleCreateStatus = async () => {
        if (!newStatus.trim() && !selectedFile) {
            return;
        }
        try {
            await createStatus({
                content: newStatus,
                file: selectedFile
            })
            setNewStatus("");
            setSelectedFile(null);
            setFilePreview("");
            setShowCreateModel(false);

        }
        catch (error) {
            console.error('Error creating status', error)

        }

    }
    const handleViewStatus = async (statusId) => {
        try {
            await viewStatus(statusId);


        } catch (error) {
            console.error('Error viewing status', error)

        }
    }


    const handleDeleteStatus = async (statusId) => {
        try {
            await deleteStatus(statusId);
            setShowOptions(false);
            handlePreviewClose();


        } catch (error) {
            console.error('Error deleting status', error)

        }
    }

    const handlePreviewClose = () => {
        setPreviewContact(null);
        setCurrentStatusIndex(0);

    }

    const handlePreviewNext = () => {
        if (currentStatusIndex < previewContact.statuses.length - 1) {
            setCurrentStatusIndex(currentStatusIndex + 1);

        }
        else {
            handlePreviewClose();
        }
    }

    const handlePreviewPrevious = () => {
        setCurrentStatusIndex(prev => Math.max(prev - 1, 0))
    }

    const handleStatusPreview = (contact, statusIndex = 0) => {
        setPreviewContact(contact);
        setCurrentStatusIndex(statusIndex);
        if (contact.statuses[statusIndex]) {
            console.log(contact.statuses[statusIndex])
            handleViewStatus(contact.statuses[statusIndex].id);

        }

    }





    return (
        <Layout
            isStatusPreview={!!previewContact}
            statusPreviewContent={previewContact &&
                (
                    <StatusPreview
                        contact={previewContact}
                        currentIndex={currentStatusIndex}
                        onNext={handlePreviewNext}
                        onPrevious={handlePreviewPrevious}
                        onClose={handlePreviewClose}
                        theme={theme}
                        currentUser={user}
                        onDelete={handleDeleteStatus}
                        onStatusView={handleStatusPreview}
                        loading={loading}
                    />)
            }
        >

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className={`flex-1 h-screen border-r ${theme === 'dark' ? 'bg-[rgb(12,19,24)] text-white border-gray-600' : 'bg-gray-100 text-black'}`}
            >
                <div
                    className={`flex justify-between items-center shadow-md   ${theme === 'dark' ? 'bg-[rgb(17,27,33)]' : 'bg-white '} p-4`}
                >
                    <h2 className="text-2xl font-bold">
                        Status
                    </h2>

                </div>
                {error && (
                    <div className="bg-red-100 border-red-400 text-red-700 px-4 py-3 rounded mx-4 mt-2">
                        <span className="block sm:inline">{error}</span>
                        <button
                            onClick={clearError}
                            className="float-right text-red-500 hover:text-red-700">
                            <RxCross2 className="h-4 w-4" />
                        </button>
                    </div>
                )}
                <div className="overflow-y-auto h-[calc(100bh-64px)]">
                    <div
                        className={`flex p-3 space-x-4 shadow-md ${theme === 'dark' ? 'bg-[rgb(17,27,33)] ' : 'bg-white'}`}
                    >
                        <div
                            className="relative cursor-pointer"
                            onClick={() => userStatus ? handleStatusPreview(userStatus) : setShowCreateModel(true)}
                        >
                            <img
                                src={user?.profilePicture}
                                alt={user?.username}
                                className="w-12 h-12 rounded-full object-cover"
                            />

                            {
                                userStatus ? (
                                    <>
                                        <svg className="absolute top-0 left-0 w-12 h-12"
                                            viewBox="0 0 100 100"
                                        >
                                            {userStatus.statuses.map((status, index) => {
                                                const circumference = 2 * Math.PI * 48;
                                                const segmentLength = circumference / userStatus.statuses.length;
                                                const offset = index * segmentLength;
                                                return (
                                                    <circle
                                                        key={index}
                                                        cx='50'
                                                        cy='50'
                                                        r='48'
                                                        fill='none'
                                                        stroke='#25D366'
                                                        strokeWidth="4"
                                                        strokeDasharray={`${segmentLength - 5}5`}
                                                        strokeDashoffset={-offset}
                                                        transform={`rotate(-90 50 50)`}
                                                    />
                                                )
                                            }

                                            )}


                                        </svg>
                                        <button className="absolute bottom-0 right-0 bg-green-500 text-white p-1 rounded-full"

                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setShowCreateModel(true)
                                            }}>
                                            <FaPlus className="h-2 w-2" />
                                        </button>
                                    </>) : (

                                    <button className="absolute bottom-0 right-0 bg-green-500 text-white p-1 rounded-full"

                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setShowCreateModel(true)
                                        }}>
                                        <FaPlus className="h-2 w-2" />
                                    </button>
                                )

                            }

                        </div>
                        <div className="flex flex-col items-start flex-1">
                            <p className="font-semibold">
                                My Status
                            </p>
                            <p className={` text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {userStatus ? `${userStatus.statuses.length} 
                                status${userStatus.statuses.length > 1 ? 'es' : ''}  ${formatTimestamp(userStatus.statuses[userStatus.statuses.length - 1].createdAt)}` : 'Tap to get status updates'}
                            </p>
                        </div>

                        {
                            userStatus && (
                                <button
                                    className="ml-auto"
                                    onClick={() => setShowOptions(!showOptions)}
                                >
                                    <FaEllipsisH
                                        className={`h-5 w-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />

                                </button>
                            )
                        }

                    </div>

                    {showOptions && userStatus && (
                        <div
                            className={` shadow-md  p-2 ${theme === 'dark' ? 'bg-[rgb(17,27,33)] ' : 'bg-white'}`}>

                            <button
                                className="w-full text-left text-green-500 py-2 hover:bg:gray-100 px-2 rounded flex items-center"
                                onClick={() => {
                                    setShowCreateModel(true)
                                    setShowOptions(false)
                                }}>
                                <FaCamera className="inline-block mr-2" /> Add Status
                            </button>

                            <button
                                className="w-full text-left text-blue-500 py-2 hover:bg:gray-100 px-2 rounded"
                                onClick={() => {
                                    handleStatusPreview(userStatus)
                                    setShowOptions(false)
                                }}>
                                Add Status
                            </button>
                        </div>
                    )}

                    {
                        loading && (
                            <div className="flex justify-center items-center p-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2  border-green-500">
                                </div>
                            </div>
                        )
                    }

                    {!loading && otherStatus.length > 0 && (
                        <div className={`p-4 space-y-4 shadow-md mt-4 ${theme === 'dark' ? 'bg-[rgb(17,27,33)]' : 'bg-white'
                            }`}>

                            <h3
                                className={` font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                Recent Updates
                            </h3>
                            {otherStatus.map((contact, index) => (
                                <React.Fragment key={index}>
                                    <StatusList
                                        contact={contact}
                                        onPreview={() => handleStatusPreview(contact)}
                                        theme={theme}
                                    />
                                    {
                                        index < otherStatus.length - 1 && (
                                            <hr
                                                className={`${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
                                            />
                                        )
                                    }

                                </React.Fragment>

                            ))}
                        </div>
                    )}

                    {!loading && statuses.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                            <div className={`text-6xl mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`}>
                                📱
                            </div>
                            <h3 className={`text-lg font-semibold  mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                No Status Updates yet
                            </h3>
                            <p className={`text-sm  ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                                Be the first to share a status update
                            </p>
                        </div>
                    )}

                </div>


                {
                    showCreateModel && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div
                                className={`p-6 rounded-lg max-w-md w-full mx-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>

                                <h3 className={`text-lg font-semibold  ${theme === 'dark' ? 'text-white' : 'text-black'} mb-4`}>
                                    Create Status

                                </h3>

                                {filePreview && (
                                    <div className="relative p-3">
                                        {selectedFile?.type.startsWith("video/") ? (
                                            <video
                                                src={filePreview}
                                                controls
                                                className="w-full h-32  object-cover rounded border-2 border-gray-400 " />
                                        ) :
                                            (
                                                <img
                                                    src={filePreview}
                                                    alt="file-preview"
                                                    className="w-full  h-32 object-cover rounded border-2 border-gray-400 "
                                                />
                                            )}

                                    </div>
                                )}
                                <textarea
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    placeholder="Whats on your mind"
                                    className={`w-full p-3 rounded-lg mb-4 border
                                                ${theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-400'}`}
                                    rows={3} />

                                <input
                                    type='file'
                                    accept="image/*,video/*"
                                    onChange={handleFileChange}
                                    className="mb-4 "
                                />
                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={() => {
                                            setShowCreateModel(false)
                                            setNewStatus("")
                                            setSelectedFile(null)
                                            setFilePreview(null)
                                        }}
                                        disabled={loading}
                                        className="px-4 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md"
                                    >
                                        Cancel

                                    </button>

                                    <button
                                        onClick={() => {
                                            handleCreateStatus()
                                        }}
                                        disabled={loading || (!newStatus.trim() && !selectedFile)}
                                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"

                                    >
                                        {loading ? 'Creating...' : 'Create'}

                                    </button>
                                </div>
                            </div>
                        </div>

                    )
                }




            </motion.div>
        </Layout>

    )
}
export default Status;