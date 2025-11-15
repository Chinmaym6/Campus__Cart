import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';
import pool from '../config/database.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Multer config for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const generateToken = (userId, email) => {
  return jwt.sign(
    { id: userId, email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const generateVerificationToken = () => {
  return uuidv4();
};

router.post('/register', async (req, res) => {
  try {
    const { email, password, confirmPassword, firstName, lastName, university, graduationYear, major } = req.body;

    if (!email || !password || !confirmPassword || !firstName || !lastName || !university) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = generateVerificationToken();
    const userId = uuidv4();

    await pool.query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, university, graduation_year, major, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE)`,
      [userId, email, hashedPassword, firstName, lastName, university, graduationYear || null, major || null]
    );

    await pool.query(
      `INSERT INTO email_verifications (token, user_id, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
      [verificationToken, userId]
    );

    const verificationUrl = `${process.env.FRONTEND_URL}/verify/${verificationToken}`;

    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Verify Your Campus Cart Email',
        html: `
          <h2>Welcome to Campus Cart!</h2>
          <p>Hi ${firstName},</p>
          <p>Click the link below to verify your email and activate your account:</p>
          <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email
          </a>
          <p>Or copy this link: ${verificationUrl}</p>
          <p>This link expires in 24 hours.</p>
        `
      });
    } catch (emailError) {
      console.warn('⚠ Email sending failed (development mode):', emailError.message);
      console.log(`📧 VERIFICATION TOKEN (for development): ${verificationToken}`);
      console.log(`📧 VERIFICATION LINK: ${verificationUrl}`);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Check your email for verification link.',
      token: verificationToken
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await pool.query(
      'SELECT id, email, password_hash, email_verified FROM users WHERE email = $1',
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(401).json({ error: 'Email doesnt exist' });
    }

    const userRecord = user.rows[0];

    if (!userRecord.email_verified) {
      return res.status(403).json({ error: 'Email not verified. Check your inbox for verification link.' });
    }

    const validPassword = await bcrypt.compare(password, userRecord.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Password wrong' });
    }

    const token = generateToken(userRecord.id, userRecord.email);

    await pool.query(
      'UPDATE users SET last_active_at = NOW() WHERE id = $1',
      [userRecord.id]
    );

    res.json({
      success: true,
      token,
      user: {
        id: userRecord.id,
        email: userRecord.email,
        first_name: userRecord.first_name,
        last_name: userRecord.last_name,
        profile_photo_url: userRecord.profile_photo_url
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const verification = await pool.query(
      `SELECT user_id, expires_at FROM email_verifications
       WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );

    if (verification.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    const userId = verification.rows[0].user_id;

    await pool.query(
      'UPDATE users SET email_verified = TRUE WHERE id = $1',
      [userId]
    );

    await pool.query(
      'DELETE FROM email_verifications WHERE token = $1',
      [token]
    );

    res.json({
      success: true,
      message: 'Email verified successfully! You can now login.'
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Forgot Password - Send OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const user = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with 15-minute expiration
    await pool.query(
      'INSERT INTO password_resets (email, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'15 minutes\')',
      [email, otp]
    );

    // Send email (development mode - log OTP)
    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Password Reset OTP - Campus Cart',
        html: `
          <h2>Password Reset</h2>
          <p>Your OTP for password reset is: <strong>${otp}</strong></p>
          <p>This OTP expires in 15 minutes.</p>
        `
      });
    } catch (emailError) {
      console.warn('⚠ Email sending failed (development mode):', emailError.message);
      console.log(`📧 PASSWORD RESET OTP for ${email}: ${otp}`);
    }

    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const reset = await pool.query(
      'SELECT id FROM password_resets WHERE email = $1 AND token = $2 AND expires_at > NOW()',
      [email, otp]
    );

    if (reset.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Generate reset token
    const resetToken = uuidv4();

    // Update the reset record with token (or create a new field, but for simplicity, use id as token or add token)
    // Actually, better to add reset_token to table, but since already created, perhaps delete and insert new.

    // For now, delete the OTP and create a reset token entry
    await pool.query('DELETE FROM password_resets WHERE email = $1', [email]);

    // Insert reset token with 15 min expiry
    await pool.query(
      'INSERT INTO password_resets (email, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'15 minutes\')',
      [email, resetToken]
    );

    res.json({ success: true, resetToken });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'OTP verification failed' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: 'Reset token and new password are required' });
    }

    // Find the reset record
    const reset = await pool.query(
      'SELECT email FROM password_resets WHERE token = $1 AND expires_at > NOW()',
      [resetToken]
    );

    if (reset.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const email = reset.rows[0].email;

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hashedPassword, email]);

    // Delete reset record
    await pool.query('DELETE FROM password_resets WHERE token = $1', [resetToken]);

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

// Upload Profile Photo
router.post('/upload-photo', upload.single('photo'), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const photoPath = `/uploads/${req.file.filename}`;

    await pool.query('UPDATE users SET profile_photo_url = $1 WHERE id = $2', [photoPath, userId]);

    res.json({ success: true, photoUrl: photoPath });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ error: 'Photo upload failed' });
  }
});

// Get Profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const user = await pool.query(
      `SELECT id, email, email_verified, first_name, last_name, phone_number, phone_verified,
              profile_photo_url, bio, university, graduation_year, major, location_text,
              level, total_points, total_sales, total_purchases, total_revenue,
              avg_rating, total_reviews_received, avg_response_time, last_active_at,
              total_meetups_completed, meetup_reliability_score
       FROM users WHERE id = $1`,
      [userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user: user.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update Profile
router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const {
      bio,
      phone_number,
      university,
      graduation_year,
      major,
      location_text
    } = req.body;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (bio !== undefined) {
      updates.push(`bio = $${paramIndex++}`);
      values.push(bio);
    }
    if (phone_number !== undefined) {
      updates.push(`phone_number = $${paramIndex++}`);
      values.push(phone_number);
    }
    if (university !== undefined) {
      updates.push(`university = $${paramIndex++}`);
      values.push(university);
    }
    if (graduation_year !== undefined) {
      updates.push(`graduation_year = $${paramIndex++}`);
      values.push(graduation_year);
    }
    if (major !== undefined) {
      updates.push(`major = $${paramIndex++}`);
      values.push(major);
    }
    if (location_text !== undefined) {
      updates.push(`location_text = $${paramIndex++}`);
      values.push(location_text);
    }

    if (updates.length > 0) {
      values.push(userId);
      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
      await pool.query(query, values);
    }

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

// Update Email
router.put('/update-email', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Check if email is already taken
    const existing = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    // Generate verification token
    const verificationToken = generateVerificationToken();

    // Insert verification
    await pool.query(
      `INSERT INTO email_verifications (token, user_id, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
      [verificationToken, userId]
    );

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email-change/${verificationToken}?newEmail=${encodeURIComponent(email)}`;

    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Verify Your New Email - Campus Cart',
        html: `
          <h2>Verify Your New Email</h2>
          <p>Click the link below to verify your new email address:</p>
          <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify New Email
          </a>
          <p>Or copy this link: ${verificationUrl}</p>
          <p>This link expires in 24 hours.</p>
        `
      });
    } catch (emailError) {
      console.warn('⚠ Email sending failed:', emailError.message);
    }

    res.json({ success: true, message: 'Verification email sent to new email address' });
  } catch (error) {
    console.error('Update email error:', error);
    res.status(500).json({ error: 'Failed to update email' });
  }
});

// Verify Email Change
router.get('/verify-email-change/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { newEmail } = req.query;

    if (!newEmail) return res.status(400).json({ error: 'New email required' });

    const verification = await pool.query(
      `SELECT user_id FROM email_verifications
       WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );

    if (verification.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    const userId = verification.rows[0].user_id;

    // Update email and set verified
    await pool.query(
      'UPDATE users SET email = $1, email_verified = TRUE WHERE id = $2',
      [newEmail, userId]
    );

    // Delete verification token
    await pool.query('DELETE FROM email_verifications WHERE token = $1', [token]);

    res.json({ success: true, message: 'Email updated successfully' });
  } catch (error) {
    console.error('Verify email change error:', error);
    res.status(500).json({ error: 'Failed to verify email change' });
  }
});

router.put('/update-location', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const { lat, lng, address } = req.body;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const locationPoint = `POINT(${lng} ${lat})`; // Note: lng lat for PostGIS

    await pool.query(
      'UPDATE users SET location = ST_GeomFromText($1, 4326), location_text = $2 WHERE id = $3',
      [locationPoint, address || null, userId]
    );

    res.json({ success: true, message: 'Location updated successfully' });
  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({ error: 'Location update failed' });
  }
});

router.post('/upload-photo', upload.single('photo'), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const photoUrl = `/uploads/${req.file.filename}`;

    await pool.query(
      'UPDATE users SET profile_photo_url = $1 WHERE id = $2',
      [photoUrl, userId]
    );

    res.json({ success: true, photoUrl });
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
