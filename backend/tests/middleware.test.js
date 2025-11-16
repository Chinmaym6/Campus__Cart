import { authenticateToken } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

// Mock jwt
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn()
}));

describe('Auth Middleware', () => {
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

  it('should call next for valid token', () => {
    req.headers.authorization = 'Bearer validToken';
    const mockUser = { id: 'userId', email: 'test@example.com' };

    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(null, mockUser);
    });

    authenticateToken(req, res, next);

    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
  });

  it('should return 401 for missing token', () => {
    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 for malformed authorization header', () => {
    req.headers.authorization = 'InvalidFormat';

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
  });

  it('should return 403 for invalid token', () => {
    req.headers.authorization = 'Bearer invalidToken';

    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(new Error('Invalid token'), null);
    });

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });
});