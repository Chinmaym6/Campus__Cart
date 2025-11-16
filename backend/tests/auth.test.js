import request from 'supertest';
import app from '../server.js';
import pool from '../config/database.js';

// Mock the database pool
jest.mock('../config/database.js', () => ({
  query: jest.fn()
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}));

// Mock jwt
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn()
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn()
}));

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn()
  }))
}));

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Mock database responses
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // No existing user
        .mockResolvedValueOnce({}) // Insert user
        .mockResolvedValueOnce({}); // Insert verification

      // Mock bcrypt
      const bcrypt = require('bcryptjs');
      bcrypt.hash.mockResolvedValue('hashedPassword');

      // Mock uuid
      const { v4: uuidv4 } = require('uuid');
      uuidv4.mockReturnValueOnce('userId').mockReturnValueOnce('verificationToken');

      // Mock nodemailer
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport();
      transporter.sendMail.mockResolvedValue({});

      const userData = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        university: 'Test University'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Registration successful');
      expect(pool.query).toHaveBeenCalledTimes(3);
    });

    it('should return error for missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body.error).toBe('Missing required fields');
    });

    it('should return error for password mismatch', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'different',
          firstName: 'John',
          lastName: 'Doe',
          university: 'Test University'
        })
        .expect(400);

      expect(response.body.error).toBe('Passwords do not match');
    });

    it('should return error for short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: '123',
          confirmPassword: '123',
          firstName: 'John',
          lastName: 'Doe',
          university: 'Test University'
        })
        .expect(400);

      expect(response.body.error).toBe('Password must be at least 6 characters');
    });

    it('should return error for existing email', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'existingId' }] });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          university: 'Test University'
        })
        .expect(409);

      expect(response.body.error).toBe('Email already registered');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user successfully', async () => {
      const user = {
        id: 'userId',
        email: 'test@example.com',
        password_hash: 'hashedPassword',
        email_verified: true,
        first_name: 'John',
        last_name: 'Doe',
        profile_photo_url: 'photo.jpg'
      };

      pool.query
        .mockResolvedValueOnce({ rows: [user] }) // User exists
        .mockResolvedValueOnce({}); // Update last_active

      const bcrypt = require('bcryptjs');
      bcrypt.compare.mockResolvedValue(true);

      const jwt = require('jsonwebtoken');
      jwt.sign.mockReturnValue('token');

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBe('token');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should return error for missing email or password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body.error).toBe('Email and password required');
    });

    it('should return error for non-existent email', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' })
        .expect(401);

      expect(response.body.error).toBe('Email doesnt exist');
    });

    it('should return error for unverified email', async () => {
      const user = { email_verified: false };
      pool.query.mockResolvedValueOnce({ rows: [user] });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(403);

      expect(response.body.error).toBe('Email not verified. Check your inbox for verification link.');
    });

    it('should return error for wrong password', async () => {
      const user = { email_verified: true, password_hash: 'hash' };
      pool.query.mockResolvedValueOnce({ rows: [user] });

      const bcrypt = require('bcryptjs');
      bcrypt.compare.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' })
        .expect(401);

      expect(response.body.error).toBe('Password wrong');
    });
  });
});