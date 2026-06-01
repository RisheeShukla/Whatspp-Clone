import React, { useState } from 'react'
import useLoginStore from '../../store/useLoginStore';
import countries from '../../utils/countries';
import { avatars } from '../../utils/formatTime';
import { useNavigate } from 'react-router-dom'
import * as yup from 'yup'
// validation Schema
import { yupResolver } from "@hookform/resolvers/yup"
import useUserStore from '../../store/useUserStore';
import { useForm } from 'react-hook-form';
import useThemeStore from '../../store/themeStore';
import { motion } from 'framer-motion'
import { FaArrowLeft, FaChevronDown, FaPlus, FaUser, FaWhatsapp } from 'react-icons/fa'
import Spinner from '../../utils/Spinner';
import { sendOtp, updateUserProfile, verifyOtp } from '../../services/user.service';
import {ToastContainer,toast} from 'react-toastify'

const loginValidationSchema = yup.object().shape({
    phoneNumber: yup.string().nullable().notRequired().matches(/^\d+$/, 'Phone number must be digit').transform((value, originalValue) =>
        originalValue.trim() === "" ? null : value
    ),
    email: yup.string().nullable().notRequired().email('Please enter a valid email').transform((value, originalValue) =>
        originalValue.trim() === "" ? null : value
    )
}).test("at-least-one",
    "Either email or phone number is required",
    function (value) {
        return !!(value.phoneNumber || value.email)
    }
)

const otpValidationSchema = yup.object().shape({
    otp: yup.string().length(6, "Otp must be exactly 6 digits")
})
const profileValidationSchema = yup.object().shape({
    username: yup.string().required("Username is required"),
    agreed: yup.bool().oneOf([true], "You must agree to the terms and conditions")

})

const Login = () => {
    const { step, setStep, userPhoneData, setUserPhoneData, resetLoginStore } = useLoginStore();
    const { theme, setTheme } = useThemeStore();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectCountry, setSelectCountry] = useState(countries[0]);
    const [otp, setOpt] = useState(["", "", "", "", "", ""])
    const [email, setEmail] = useState("")
    const [profilePicture, setProfilePicture] = useState(null);
    const [profilePictuteFile,setProfilePictureFile]=useState(null);
    const [error, setError] = useState("");
    const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
    const [showDropDown, setShowDropDown] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [loading,setLoading]=useState(false);
    const navigate = useNavigate();
    const { setUser } = useUserStore();
    const {
        register: loginRegister,
        handleSubmit: handleLoginSubmit,
        formState: { errors: loginErrors },

    } = useForm({
        resolver: yupResolver(loginValidationSchema)
    })

    const {

        handleSubmit: handleOtpSubmit,
        formState: { errors: otpErrors },
        setValue: setOtpValue
    } = useForm({
        resolver: yupResolver(otpValidationSchema)
    })

    const {
        register: profileRegister,
        handleSubmit: handleProfileSubmit,
        formState: { errors: profileErrors },
        watch
    } = useForm({
        resolver: yupResolver(profileValidationSchema)
    })

    const ProgressBar = () => (
        <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2.5 mb-6`}>
            <div
                className='bg-green-500 h-2.5  rounded-full transition-all duration-500 ease-in-out'
                style={{ width: `${step / 3 * 100}%` }}>

            </div>

        </div>
    )

    const filterCountries = countries.filter((country) =>
        country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.dialCode.includes(searchTerm)
    )
    const onLoginSubmit=async()=>{
        try{
            setLoading(true);
            if(email)
            {
                const response=await sendOtp(null,null,email)
                console.log(response)
                if(response.success)
                {
                    toast.info('Otp sent successfully to email')
                    setUserPhoneData({email})
                    setStep(2)
                }


            }
            else
            {
                const response=await sendOtp(phoneNumber,selectCountry.dialCode,null)
               if(response.success)
                {
                    toast.info('Otp sent successfully to phoneNumber')
                    setUserPhoneData({phoneNumber,phoneSuffix:selectCountry.dialCode})
                    setStep(2)
                }
            }
        }
        catch(error)
        {
          console.log(error)
          setError(error.message || "failed")

        }
        finally{
            setLoading(false);
        }
    }

    const onOtpSubmit=async()=>{
        try{
            setLoading(true);
            if(!userPhoneData)
            {
                throw new Error('Phone or email data ')
            }
            const otpString=otp.join("");
            let response;
            if(userPhoneData?.email)
            {
                response=await verifyOtp(null,null,otpString,userPhoneData.email)
            }
            else{
                response=await verifyOtp(userPhoneData.phoneNumber,userPhoneData.phoneSuffix,otpString)
            }
        if(response.success)
        {
            toast.success('Otp verified successfull')
            const token=response.data?.token;
            localStorage.setItem('auth_token',token);
            const user=response.data?.user
            if(user?.username && user.profilePicture)
            {
                setUser(user);
                toast.success('Welcome back to whatspp');
                navigate('/');
                resetLoginStore();
            }
            else
            {
                setStep(3);
            }
        
        }

        }
        catch(error)
        {
             console.log(error)
          setError(error.message || "failed to verify otp")
        }
        finally{
            setLoading(false);
        }
    }
    const handleChange=(e)=>{
        const file=e.target.files[0];
        if(file)
        {
            setProfilePictureFile(file)
            setProfilePicture(URL.createObjectURL(file))

        }
      
    }

const onProfileSubmit=async(data)=>{
    try{
        setLoading(true);
        const formData=new FormData();
        formData.append("username",data.username)
        formData.append("agreed",data.agreed)
        if(profilePictuteFile)
        {
            formData.append('media',profilePictuteFile)

        }
        else
        {
            formData.append('profilePicture',selectedAvatar)
        }
        const response=await updateUserProfile(formData);
        if(response.success)
        {
            setUser(response.data)
        toast.success('Welcome to the first time to Whatsapp')
        navigate('/')
        resetLoginStore()
        }

    }
    catch(error)
    {
        console.log(error)
        setError(error.message || "failed to submit profile")

    }
    finally{
        setLoading(false);
    }
}
const handleOtpChange=(index,value)=>{
    const newOtp=[...otp];
    newOtp[index]=value;
   setOpt(newOtp)
   setOtpValue(newOtp.join(""))
   if(value && index<5)
   {
    document.getElementById(`otp-${index+1}`).focus()
   }
}

const handleBack=()=>{
    setStep(1);
    setUserPhoneData(null)
    setOpt(["","","","","",""])
    setError("")

}

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-green-400 to-blue-500'} flex items-center justify-center overflow-hidden`}>
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} p-6 md:pd-8  rounded-lg shadow-2xl w-full max-w-md relative z-10`}
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2, type: "spring", stiffness: 260, damping: 20 }}
                    className='w-24 h-24 bg-green-500 rounded-full mx-auto  mb-6 flex items-center justify-center'
                >
                    <FaWhatsapp className='w-16 h-16 text-white' />

                </motion.div>

                <h1 className={`text-3xl font-bold text-center mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    Whatsapp Login
                </h1>
                <ProgressBar />
                {error && <p className='text-red-500 text-center mb-4'>
                    {error}
                </p>}

                {
                    step === 1 && (
                        <form  onSubmit={handleLoginSubmit(onLoginSubmit)}
                            className='space-y-4'>
                            <p
                                className={`text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                                Enter your phone number to receive OTP

                            </p>
                            <div className='relative '>
                                <div className='flex'>
                                    <div className='relative w-1/3'>
                                        <button
                                            type='button'
                                            className={`flex-shrink-0 z-10 inline-flex items-center
                                                 py-2.5 px-4 text-sm font-medium text-center 
                                                 ${theme === 'dark' ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-gray-100 border-gray-300'} border rounded-s-lg hover:bg-gray-200 focus:right-4 focus:outline-none focus:ring-gray-100`}
                                            onClick={() => setShowDropDown(!showDropDown)}
                                        >
                                            <span>
                                                {selectCountry.flag} {selectCountry.dialCode}
                                            </span>
                                            <FaChevronDown className='ml-2' />
                                        </button>

                                        {showDropDown && (
                                            <div className={`absolute z-10 w-full mt-1 ${theme === 'dark' ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} border rounded-md shadow-lg mx-h-60 overflow-auto`}>

                                                <div className={`sticky top-0 ${theme === 'dark' ? "bg-gray-700" : "bg-white"} p-1`}>
                                                    <input
                                                        type="text"
                                                        placeholder='Search countries'
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        className={`w-full px-2 py-1 border ${theme === 'dark' ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-500"} rounded-md text-sm  focus:outline-none focus:right-2 focus:ring-gray-100`} />
                                                </div>

                                                {
                                                    filterCountries.map((country,)=>(
                                                    

                                                    <button key={country.name}
                                                    type='button'
                                                    className={`w-full text-left px-3 py-2 ${theme==='dark' ? "hover:bg-gray-600":"hover:bg-gray-100"} focus:outline-none focus:bg-gray-100`}
                                                    onClick={()=>{
                                                        setSelectCountry(country)
                                                        setShowDropDown(false)}}
                                                    >
                                                        {country.flag} ({country.dialCode}) {country.name}
                                                    </button>
                                                     ))
                                                }

                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <input
                                        type='text'
                                        {...loginRegister("phoneNumber")}
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        placeholder='Enter your phone number'
                                        className={`w-full px-4 py-2 border ${theme === 'dark' ? "bg-gray-700 border-gray-500 text-white":"bg-white border-gray-300"} rounded-md  focus:outline-none focus:right-2 focus:ring-green-100 ${loginErrors.phoneNumber && "border-red-500"}}`}
                                        />
                                    </div>
                                    {loginErrors.phoneNumber && (
                                        <p className='text-red-500'>{loginErrors.phoneNumber.message}</p>
                                    )}


                                </div>
                                <div className='flex  items-center my-4'>
                                    <div className='flex-grow h-px bg-gray-300'/>
                                    <span className="mx-3  text-gray-500 text-sm font-medium">
                                     OR
                                    </span>
                                      <div className='flex-grow h-px bg-gray-300'/>


                                </div>
                            <div className={`flex items-center border rounded-md px-3 py-2 ${theme === 'dark' ? "bg-gray-700border-gray-600":"bg-white border-gray-300"} mb-3`}>
                             <FaUser className={`mr-2 tex-gray-400 ${theme === 'dark' ? "text-gray-400" : "text-gray-500"}`}/>
                             <input
                                        type='email'
                                        {...loginRegister("email")}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder='Enter your email'
                                        className={`w-full bg-transparent focus:outline-none ${theme === 'dark' ? " text-white":"text-black"} rounded-md  focus:outline-none focus:right-2 focus:ring-green-100 ${loginErrors.email && "border-red-500"}}`}
                                        />

                                        {loginErrors.email && (
                                        <p className='text-red-500'>{loginErrors.email.message}</p>
                                        )
                                        }
                            </div>
                            <button
                            type="submit"
                            className='w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition'
                            >
                                {loading?<Spinner/>:"Send OTP"}

                            </button>
                            </div>

                        </form>
                    )
                }
                {step===2 &&(
                    <form
                    onSubmit={handleOtpSubmit(onOtpSubmit)}
                    className='space-y-4'
                    >
                        <p className={`text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                           Please enter the six digit send to your {userPhoneData.email || userPhoneData.phoneNumber}
                        </p>

                        <div className='flex justify-between'>
                            {otp.map((digit,index)=>(
                                <input
                                key={index}
                                id={`otp-${index}`}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={(e)=>handleOtpChange(index,e.target.value)}
                                className={`w-12 h-12 text-center border ${theme === 'dark' ? "bg-gray-700 border-gray-600 text-white":"bg-white border-gray-300"} rounded-md focus;ring-green-500 ${otpErrors.otp && "border-red-500"}`}
                                
                                />
                                
                            ))}
                            

                        </div>
                        {otpErrors.otp && (
                                    <p className='text-red-500 text-sm'>
                                        {otpErrors.otp.message}
                                    </p>

                                )}
                            <button
                            type="submit"
                            className='w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition'
                            >
                                {loading?<Spinner/>:"Verify Otp"}

                            </button>
                            <button
                            type='button'
                            onClick={handleBack}
                            
                            className={`w-full mt-2 ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'} py-2 rounded-md hover:bg-gray-300 transition flex items-center justify-center`}
                            >
                                <FaArrowLeft className='mr-2'/>
                                Wrong number? Go back
                            </button>

                    </form>
                )}
                {step===3 &&(
                   <form
                   onSubmit={handleProfileSubmit(onProfileSubmit)}
                   className='space-y-4'
                   >
                    <div className='flex flex-col items-center mb-4'>
                        <div className='relative w-24 h-24 mb-2'>
                            <img  src={profilePicture || selectedAvatar}
                            alt='profile'
                            className='w-full h-full rounded-full object-cover border border-black bg-black'
                            />
                            <label
                            htmlFor='profile-picture'
                             className='absolute bottom-0 right-0 bg-green-500 text-white p-2 rounded-full cursor-pointer'>
                                <FaPlus className='w-4 h-4'/>
                                
                            </label>
                            <input
                                type='file'
                                id='profile-picture'
                                accept="image/*"
                                onChange={handleChange}
                                className='hidden'
                                />

                        </div>
                        <p className={`text-sm ${theme==='dark'?"text-gray-300":"text-gray-500"} mb-2`}>
                            Choose an avatar
                        </p>
                        <div className='flex flex-wrap justify-center gap-2'>
                            {avatars.map((avatar,index)=>(
                                <img
                                key={index}
                                src={avatar}
                                alt={`Avatar ${index+1}`}
                                className={`w-12 h-12 rounded-full cursor-pointer transition duration-300 ease-in-out transform hover:scale-110 ${selectedAvatar===avatar ?"ring-2 ring-green-500":""}`}
                                 onClick={()=>setSelectedAvatar(avatar)}
                                />
                            ))}

                        </div>
                    </div>
                    <div className='relative'>
                        <FaUser className={`absolute left-3 top-1/3 transform-y-1/2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}/>
                        <input
                        {...profileRegister("username")}
                        type='text'
                        placeholder='Enter your username'
                        className={`w-full pl-10 pr-3 py-2 border ${theme ==='dark' ? "bg-gray-700 border-gray-600 text-white":"bg-white border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                        
                        />
                        {profileErrors.username && (
                            <p className='text-red-500'>{profileErrors.username.message}</p>
                        )}
                    
                    </div>
                    <div  className='flex items-center space-x-2'>
                        <input
                        type='checkbox'
                        {...profileRegister("agreed")}
                        className={`rounded ${theme==='dark'?"text-green-500 bg-gray-700":"text-green-700"}  focus-ring-1 focus:ring-green-500`}
                        
                        />
                      <label
                      className={`text-sm ${theme==='dark'?"text-gray-300":"text-gray-700"}`}>
                      I agree to the {" "}
                      <a href="#" className='text-red-500 hover:underlined'>
                        Terms and Conditions
                      </a>
                        </label>  

                    {
                        profileErrors.agreed && (
                            <p className='text-red-500'>{profileErrors.agreed.message}</p>
                        )
                    }
                    </div>
                    <button
                    disabled={!watch("agreed") || loading}
                    type='submit'
                    className={`w-full bg-green-500 text-white font-bold py-3 px-4 rounded-md  transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center text-lg ${loading && "opacity-50 cursor-not-allowed"}`}
                    
                
                    >
                        {
                        loading?<Spinner/>:"Update Profile"
                    }

                    </button>

                   </form>
                )}

            </motion.div>


        </div>
    )
}

export default Login;