# 🎓 Campus Cart

**Campus Cart** is a full-stack student trading platform for buying, selling, and exchanging items within a university community.

## 📋 Features

- ✅ **User Authentication** with JWT
- ✅ **Email Verification** via Gmail SMTP
- ✅ **Secure Password Hashing** with bcrypt
- ✅ **PostgreSQL Database** with comprehensive user schema
- ✅ **Modern Responsive UI** with smooth animations
- ✅ **Protected Routes** and authentication middleware
- ✅ **Reusable React Components**

## 🛠️ Tech Stack

### Backend
- Node.js
- Express.js
- PostgreSQL
- JWT Authentication
- Nodemailer (Gmail SMTP)
- bcryptjs

### Frontend
- React 19
- Vite
- React Router DOM
- Axios
- CSS3 (Custom styling)

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **PostgreSQL** (v12+)
- **npm** or **yarn**
- **Git** (optional)

### 1. Database Setup

Before running the application, set up the PostgreSQL database:

```bash
# Open PostgreSQL CLI
psql -U postgres

# Inside psql, run:
CREATE DATABASE campus_cart;

# Exit psql with \q and run the initialization script
psql -U postgres -d campus_cart -f backend/database/init.sql
```

**Note:** The database name in `.env` is `Campus__Cart` but the actual database should be created as `campus_cart` (lowercase with underscores).

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start development server (with auto-reload)
npm run dev

# Or start production server
npm start
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The frontend will run on `http://localhost:5173`

## 🔐 Environment Variables

The backend `.env` file contains the following configuration (already set):

```env
PORT=5000                                    # Backend server port
DB_HOST=localhost                            # PostgreSQL host
DB_PORT=5432                                 # PostgreSQL port
DB_USER=postgres                             # PostgreSQL username
DB_PASSWORD=935391                           # PostgreSQL password
DB_NAME=campus_cart                          # Database name (lowercase)
JWT_SECRET=this_is_dev_only_change_it       # Change this in production!
SMTP_HOST=smtp.gmail.com                     # Gmail SMTP server
SMTP_PORT=587                                # Gmail SMTP port (TLS)
SMTP_USER=campus.cart7@gmail.com            # Sender email
SMTP_PASS=nmep qifo pdsj fqwz               # Gmail app password
FRONTEND_URL=http://localhost:5173          # Frontend base URL
```

**⚠️ Important:** For production, change:
- `JWT_SECRET` to a secure random string
- `SMTP_PASS` if using different Gmail account
- Database credentials to production values

## 📁 Project Structure

```
Campus__Cart/
├── backend/
│   ├── config/
│   │   ├── db.js              # PostgreSQL connection
│   │   └── email.js           # Email configuration (Nodemailer)
│   ├── controllers/
│   │   └── authController.js  # Authentication logic
│   ├── middleware/
│   │   └── auth.js            # JWT verification middleware
│   ├── routes/
│   │   └── authRoutes.js      # Auth endpoints
│   ├── database/
│   │   └── init.sql           # Database schema
│   ├── .env                   # Environment variables
│   ├── package.json           # Dependencies
│   └── server.js              # Express server entry point
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx     # Navigation bar
    │   │   ├── Navbar.css
    │   │   ├── Footer.jsx     # Footer component
    │   │   └── Footer.css
    │   ├── config/
    │   │   └── axios.js       # Axios instance with interceptors
    │   ├── pages/
    │   │   ├── Landing.jsx    # Home page
    │   │   ├── Landing.css
    │   │   ├── Register.jsx   # Sign up page
    │   │   ├── Login.jsx      # Login page
    │   │   ├── Auth.css       # Shared auth styles
    │   │   ├── Verify.jsx     # Email verification page
    │   │   ├── Verify.css
    │   │   ├── Dashboard.jsx  # User dashboard
    │   │   └── Dashboard.css
    │   ├── App.jsx            # Main App component
    │   ├── App.css
    │   ├── main.jsx           # Entry point
    │   └── index.css          # Global styles
    ├── public/
    │   └── vite.svg
    ├── package.json
    ├── vite.config.js
    └── index.html
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
  - Body: `{ firstName, lastName, email, password, university, graduationYear?, major? }`
  - Returns: User info and sends verification email
  
- `GET /api/auth/verify/:token` - Verify email address
  - Activates account after email verification
  - Returns: Success message
  
- `POST /api/auth/login` - Login user
  - Body: `{ email, password }`
  - Returns: JWT token and user info
  - Requires: Email must be verified
  
- `GET /api/auth/me` - Get current user (requires JWT)
  - Headers: `Authorization: Bearer <token>`
  - Returns: Complete user profile

## 🎨 UI Features

- **Responsive Design** - Works on all devices
- **Smooth Animations** - Fade-in effects and transitions
- **Modern Gradient Colors** - Purple/blue academic theme
- **Reusable Components** - Navbar, Footer, Form elements
- **Card-based Layout** - Clean and organized UI

## 🧪 Testing the Application

1. **Register a new account** at `http://localhost:5173/register`
   - Fill in all required fields (first name, last name, email, password, university)
   - Password must be at least 6 characters
   
2. **Check your email** for verification link
   - Look for an email from `campus.cart7@gmail.com`
   - Click the "Verify Email Address" button in the email
   
3. **Verify your account** by clicking the link
   - You'll be redirected to a verification page
   - On success, you can proceed to login
   
4. **Login** at `http://localhost:5173/login`
   - Use your registered email and password
   - You must verify your email before login
   
5. **View your dashboard** at `http://localhost:5173/dashboard`
   - See your profile information
   - View your stats (ratings, sales, purchases, etc.)

## 🐛 Troubleshooting

### Database Connection Issues
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
- Ensure PostgreSQL is running: `psql -U postgres -c "SELECT 1"`
- Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD in `.env`
- Verify database exists: `psql -U postgres -l | grep campus_cart`

### Email Verification Not Working
```
Error: Failed to send verification email
```
- Check SMTP credentials in `.env` (must be valid Gmail account)
- Enable "Less Secure App Access" on your Gmail account
- Or use an App Password for Gmail with 2FA enabled
- Verify SMTP_HOST and SMTP_PORT are correct

### Frontend Connection Issues
```
Error: Network Error or CORS error
```
- Ensure backend is running on `http://localhost:5000`
- Check FRONTEND_URL in backend `.env`
- Verify axios baseURL in `frontend/src/config/axios.js` matches backend URL
- Check browser console for detailed error messages

### Port Already in Use
```
Error: listen EADDRINUSE :::5000
```
- Change PORT in `.env` to an available port
- Or kill the process using that port: `lsof -i :5000`

## 📝 Notes

- **Email verification is required** before login can succeed
- **JWT tokens expire** after 7 days (configurable in controller)
- **All passwords are hashed** using bcrypt with 10 salt rounds
- **CORS is enabled** for frontend-backend communication
- **Access tokens are stored** in localStorage (use httpOnly in production)

## 🔒 Security Features

- Password hashing with bcrypt (salt rounds: 10)
- JWT-based authentication
- Protected API routes with middleware
- CORS enabled for frontend communication
- Email verification before account activation

## 🎯 Future Enhancements

- Marketplace features (browse/post items)
- Real-time chat messaging
- Advanced search and filters
- User ratings and reviews
- Payment integration
- Image uploads for products

## 📄 License

MIT License - feel free to use this project for learning and development.

## 👥 Support

For issues or questions, contact: campus.cart7@gmail.com

---

Built with ❤️ for students, by students.