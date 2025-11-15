# Campus Cart Backend

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup
Make sure PostgreSQL is installed and running.

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE campus_cart;"

# Run the initialization script
psql -U postgres -d campus_cart -f database/init.sql
```

### 3. Environment Variables
Create a `.env` file (already provided) with the necessary credentials.

### 4. Run the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `GET /api/auth/verify/:token` - Verify email
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (requires JWT)

## Tech Stack
- Node.js
- Express.js
- PostgreSQL
- JWT Authentication
- Nodemailer (Gmail SMTP)
- bcryptjs
