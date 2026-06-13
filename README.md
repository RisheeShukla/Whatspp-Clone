<h4>Deployment Link(Vercel)</h4>--> <Link> </Linl>https://whatspp-clone-irud.vercel.app/ </Link>


# WhatsApp Clone - Real-time Chat Application

This is a full-stack, real-time chat application inspired by WhatsApp. It's built with a modern tech stack featuring React for the frontend and a Node.js/Express.js backend. The application supports one-on-one messaging, user authentication, status updates, media sharing, and more.

## Key Features

- **User Authentication**: Secure OTP-based (One-Time Password) sign-up and login via Email or Phone Number (Twilio).
- **Real-time Messaging**: Instant one-on-one messaging powered by Socket.IO.
- **User Presence**: See online status and last seen timestamps for users.
- **Typing Indicators**: Know when the other person is typing a message.
- **Message Status**: Track message status with sent, delivered, and read receipts.
- **Media Sharing**: Upload and share images and videos, hosted on Cloudinary.
- **Message Reactions**: React to messages with emojis.
- **Status Updates**: Share ephemeral status updates (stories) that expire after 24 hours.
- **User Profiles**: Users can set their profile picture and an "about" status.
- **Responsive Design**: A clean and responsive UI built with Tailwind CSS and DaisyUI.

## Tech Stack

### Frontend

- **Framework**: [React](https://reactjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [DaisyUI](https://daisyui.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Routing**: [React Router](https://reactrouter.com/)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) with [Yup](https://github.com/jquense/yup) for validation
- **Real-time Communication**: [Socket.IO Client](https://socket.io/docs/v4/client-api/)
- **HTTP Requests**: [Axios](https://axios-http.com/)
- **UI & Animations**: [Framer Motion](https://www.framer.com/motion/), [React Icons](https://react-icons.github.io/react-icons/), [React Toastify](https://fkhadra.github.io/react-toastify/)

### Backend

- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) ODM
- **Real-time Communication**: [Socket.IO](https://socket.io/)
- **Authentication**: [JSON Web Tokens (JWT)](https://jwt.io/)
- **File Storage**: [Cloudinary](https://cloudinary.com/) for media uploads
- **OTP & SMS Service**: [Twilio](https://www.twilio.com/)
- **Email Service**: [Nodemailer](https://nodemailer.com/)
- **Middleware**: [Multer](https://github.com/expressjs/multer) (for file handling), [CORS](https://github.com/expressjs/cors)

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- A MongoDB instance (local or cloud-based like MongoDB Atlas)
- A Cloudinary account for media storage
- A Twilio account for SMS-based OTP
- An email provider that allows SMTP (like Gmail with an "App Password") for email-based OTP

### Backend Setup

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```

2.  Install the dependencies:
    ```bash
    npm install
    ```

3.  Create a `.env` file in the `backend` root directory and populate it with your credentials. See the `Environment Variables` section below for the required keys.

4.  Start the backend server:
    ```bash
    npm start
    ```
    The server will start on the port specified in your `.env` file (defaults to `8000`).

### Frontend Setup

1.  In a new terminal, navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```

2.  Install the dependencies:
    ```bash
    npm install
    ```

3.  Start the frontend development server:
    ```bash
    npm start
    ```
    The application will automatically open in your browser at `http://localhost:3000`.

## Environment Variables

Create a `.env` file in the `backend` directory and add the following variables:

```
PORT=8000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
FRONTEND_URL=http://localhost:3000

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Twilio
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
TWILIO_VERIFY_SID=your_twilio_verify_service_sid

# Nodemailer (for email OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

This README should give anyone who visits your repository a clear understanding of your project. Let me know if you'd like any adjustments!

<!--
[PROMPT_SUGGESTION]Refactor the `chatStore.js` to improve readability and maintainability.[/PROMPT_SUGGESTION]
[PROMPT_SUGGESTION]Add error boundaries to the React components to handle potential UI crashes gracefully.[/PROMPT_SUGGESTION]
