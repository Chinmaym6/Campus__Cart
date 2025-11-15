# 🚀 Quick Start Guide - Campus Cart

## ⚡ 5-Minute Setup

### Step 1: Database Setup (2 minutes)
```bash
# Open PostgreSQL terminal
psql -U postgres

# Inside PostgreSQL:
CREATE DATABASE campus_cart;

# Exit with \q, then run schema:
psql -U postgres -d campus_cart -f backend/database/init.sql
```

### Step 2: Start Backend (30 seconds)
```bash
cd backend
npm install
npm run dev
# Backend runs on http://localhost:5000
```

### Step 3: Start Frontend (30 seconds)
```bash
# In a new terminal
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

## 📋 Full Workflow Test

1. **Open** `http://localhost:5173` in your browser
2. **Click** "Get Started" → Fill registration form
   - Email: `test@example.com`
   - Password: `password123`
   - Name: `John Doe`
   - University: `Test University`
3. **Check** your email for verification link (Gmail inbox if using test account)
4. **Click** verification link in email
5. **Login** with email and password
6. **View** your dashboard with profile and stats

## 🔍 Verification Email Details

The verification email comes from: `campus.cart7@gmail.com`

Check:
- ✅ Inbox first
- 📁 Spam/Junk folder
- 🔗 Click the "Verify Email Address" button

**Note:** If using Gmail test credentials, verify SMTP settings in `.env`

## 🛠️ Troubleshooting Quick Reference

### Database won't connect?
```bash
# Check if PostgreSQL is running
psql -U postgres -c "SELECT 1;"
# Should return: integer | 1
```

### Port already in use?
```bash
# Find and kill process on port 5000
lsof -i :5000
kill -9 <PID>

# Or change PORT in backend/.env
```

### Email not sending?
- Check SMTP credentials in `.env`
- Enable "Less secure apps" on Gmail account
- Or use Gmail App Password if 2FA enabled

### Frontend can't connect to backend?
- Verify backend is running: `curl http://localhost:5000/api/health`
- Check axios baseURL in `frontend/src/config/axios.js`
- Ensure FRONTEND_URL in backend `.env` is correct

## 📁 Key Files Structure
```
backend/
  ├── server.js              ← Express app entry
  ├── .env                   ← Configuration
  └── controllers/
      └── authController.js  ← Auth logic

frontend/
  ├── src/
  │   ├── App.jsx            ← Routes
  │   ├── pages/
  │   │   ├── Landing.jsx    ← Home
  │   │   ├── Register.jsx   ← Sign up
  │   │   ├── Login.jsx      ← Login
  │   │   ├── Verify.jsx     ← Email verification
  │   │   └── Dashboard.jsx  ← User dashboard
  │   └── config/
  │       └── axios.js       ← API config
  └── vite.config.js
```

## ✅ Checklist Before Running

- [ ] Node.js v18+ installed (`node -v`)
- [ ] PostgreSQL running (`psql -U postgres`)
- [ ] Database created (`psql -l | grep campus_cart`)
- [ ] All `.env` variables configured
- [ ] Port 5000 available
- [ ] Port 5173 available

## 🎯 Test Accounts (Pre-created)

Currently no pre-created accounts. Create your own during registration.

## 📞 Support

Issues? Check:
1. README.md for detailed documentation
2. Backend console for error messages
3. Browser DevTools console for frontend errors
4. `.env` file for configuration
5. Database connection with: `psql -U postgres -d campus_cart`

---

**Happy Trading! 🎓📚💼**
