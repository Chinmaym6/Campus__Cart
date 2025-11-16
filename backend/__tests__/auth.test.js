import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth.js';

// Mock jwt
jest.mock('jsonwebtoken');

describe('authenticateToken middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('should return 401 if no authorization header', () => {
    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if authorization header does not have Bearer', () => {
    req.headers.authorization = 'invalid';

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
  });

  it('should return 403 if token is invalid', () => {
    req.headers.authorization = 'Bearer invalidtoken';
    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(new Error('Invalid token'), null);
    });

    authenticateToken(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('invalidtoken', process.env.JWT_SECRET, expect.any(Function));
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next if token is valid', () => {
    const user = { id: 1, email: 'test@example.com' };
    req.headers.authorization = 'Bearer validtoken';
    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(null, user);
    });

    authenticateToken(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('validtoken', process.env.JWT_SECRET, expect.any(Function));
    expect(req.user).toEqual(user);
    expect(next).toHaveBeenCalled();
  });
});