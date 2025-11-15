# Campus Cart - Setup Guide

## Prerequisites

Before getting started, ensure you have:
- Node.js (v18+)
- PostgreSQL (v14+) installed and running
- npm or yarn package manager

## Quick Setup

### 1. Database Setup

First, create the database and user:

```bash
# Open PostgreSQL terminal
psql -U postgres

# Then run these commands:
CREATE DATABASE "Campus__Cart";

# Connect to the database
\c "Campus__Cart"

# Initialize the database schema
```

Then run the initialization script:

```bash
cd backend
npm run init-db
```

This will create all the required tables and indexes.

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies (already done if node_modules exists)
npm install

# Start the development server
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (already done if node_modules exists)
npm install

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:5173`

## Environment Variables

The `.env` files are already configured with development values:

**Backend (.env):**
- PORT=5000
- DB_HOST=localhost
- DB_PORT=5432
- DB_USER=postgres
- DB_PASSWORD=935391
- DB_NAME=Campus__Cart
- JWT_SECRET=this_is_dev_only_change_it
- SMTP_HOST=smtp.gmail.com
- SMTP_PORT=587
- SMTP_USER=campus.cart7@gmail.com
- SMTP_PASS=nmep qifo pdsj fqwz
- FRONTEND_URL=http://localhost:5173

## Testing the Application

### 1. Register a New Account
- Go to `http://localhost:5173/register`
- Fill in the registration form
- You'll receive a verification email (check the console for email content in dev)

### 2. Verify Email
- Click the verification link in the email or copy it from the console
- Navigate to `http://localhost:5173/verify/{token}`

### 3. Login
- Go to `http://localhost:5173/login`
- Use your registered credentials
- You'll be redirected to the dashboard

## API Endpoints

### Authentication Routes

**Register**
- POST `/api/auth/register`
- Body: `{ firstName, lastName, email, password, confirmPassword, university, graduationYear?, major? }`

**Login**
- POST `/api/auth/login`
- Body: `{ email, password }`
- Returns: `{ token, user: { id, email } }`

**Verify Email**
- GET `/api/auth/verify/:token`
- Returns: `{ success: true, message }`

## Project Structure

```
Campus__Cart/
├── backend/
│   ├── config/
│   │   ├── database.js        # PostgreSQL connection
│   │   └── init-db.sql        # Database schema
│   ├── middleware/
│   │   └── auth.js            # JWT verification middleware
│   ├── routes/
│   │   └── auth.js            # Authentication endpoints
│   ├── scripts/
│   │   └── init-db.js         # Database initialization script
│   ├── server.js              # Express application entry point
│   ├── package.json
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── Navbar.css
    │   │   ├── Footer.jsx
    │   │   └── Footer.css
    │   ├── pages/
    │   │   ├── Landing.jsx
    │   │   ├── Landing.css
    │   │   ├── Register.jsx
    │   │   ├── Register.css
    │   │   ├── Login.jsx
    │   │   ├── Login.css
    │   │   ├── Verify.jsx
    │   │   ├── Verify.css
    │   │   ├── Dashboard.jsx
    │   │   └── Dashboard.css
    │   ├── config/
    │   │   └── axios.js        # Axios instance with JWT interceptor
    │   ├── App.jsx
    │   ├── App.css
    │   ├── index.css
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Verify credentials in `.env`
- Check that the database `Campus__Cart` exists

### Email Verification Not Working
- In development, email content is logged to the backend console
- Check the verification link in the console output
- Email sending requires valid SMTP credentials

### CORS Issues
- Ensure both frontend and backend are running
- Check `FRONTEND_URL` in backend `.env`
- Verify the `cors` middleware is configured in `server.js`

### Port Already in Use
- Backend (5000): `netstat -ano | findstr :5000` (Windows)
- Frontend (5173): The Vite server will try another port automatically

## Next Steps

After verification, the application is ready for the marketplace features:
- Product listings
- User messaging
- Reviews and ratings
- Location-based search
- Transaction management
