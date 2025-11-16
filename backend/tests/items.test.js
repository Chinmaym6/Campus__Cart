import request from 'supertest';
import app from '../server.js';
import pool from '../config/database.js';

// Mock the database pool
jest.mock('../config/database.js', () => ({
  connect: jest.fn(),
  query: jest.fn()
}));

// Mock the auth middleware
jest.mock('../middleware/auth.js', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: 'userId' };
    next();
  }
}));

// Mock multer
jest.mock('multer', () => {
  const multer = () => ({
    array: () => (req, res, next) => {
      req.files = []; // Mock files
      next();
    },
    diskStorage: jest.fn(),
    single: jest.fn()
  });
  multer.diskStorage = jest.fn();
  return multer;
});

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  unlink: jest.fn()
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn()
}));

// Mock path
jest.mock('path', () => ({
  extname: jest.fn()
}));

describe('Items Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/items/categories', () => {
    it('should return categories', async () => {
      const mockCategories = [
        { id: 1, name: 'Books', slug: 'books', sort_order: 1 }
      ];

      pool.query.mockResolvedValue({ rows: mockCategories });

      const response = await request(app)
        .get('/api/items/categories')
        .expect(200);

      expect(response.body).toEqual(mockCategories);
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
    });

    it('should insert default categories if none exist', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // No categories
        .mockResolvedValueOnce({}) // Insert
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Books' }] }); // Select after insert

      const response = await request(app)
        .get('/api/items/categories')
        .expect(200);

      expect(pool.query).toHaveBeenCalledTimes(3);
    });
  });

  describe('POST /api/items', () => {
    it('should create a new item successfully', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };

      pool.connect.mockResolvedValue(mockClient);
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 'itemId', title: 'Test Item' }] }) // INSERT
        .mockResolvedValueOnce({}); // COMMIT

      const itemData = {
        title: 'Test Item',
        description: 'Test description',
        price: '100',
        condition: 'new',
        category_id: '1'
      };

      const response = await request(app)
        .post('/api/items')
        .set('Authorization', 'Bearer validToken')
        .send(itemData)
        .expect(201);

      expect(response.body.title).toBe('Test Item');
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should return error for missing required fields', async () => {
      const response = await request(app)
        .post('/api/items')
        .set('Authorization', 'Bearer validToken')
        .send({ title: 'Test' })
        .expect(400);

      expect(response.body.error).toBe('Missing required fields');
    });

    it('should return error for insufficient photos when status is available', async () => {
      const itemData = {
        title: 'Test Item',
        description: 'Test description',
        price: '100',
        condition: 'new',
        category_id: '1',
        status: 'available'
      };

      const response = await request(app)
        .post('/api/items')
        .set('Authorization', 'Bearer validToken')
        .send(itemData)
        .expect(400);

      expect(response.body.error).toContain('At least 3 photos');
    });
  });

  describe('GET /api/items/my-listings', () => {
    it('should return user listings', async () => {
      const mockListings = [
        { id: '1', title: 'Item 1', category_name: 'Books' }
      ];

      pool.query.mockResolvedValue({ rows: mockListings });

      const response = await request(app)
        .get('/api/items/my-listings')
        .set('Authorization', 'Bearer validToken')
        .expect(200);

      expect(response.body).toEqual(mockListings);
    });
  });

  describe('PUT /api/items/:id', () => {
    it('should update item successfully', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };

      pool.connect.mockResolvedValue(mockClient);
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 'itemId' }] }) // Ownership check
        .mockResolvedValueOnce({ rows: [{ id: 'itemId', title: 'Updated' }] }) // UPDATE
        .mockResolvedValueOnce({}); // COMMIT

      const updateData = { title: 'Updated Title' };

      const response = await request(app)
        .put('/api/items/123')
        .set('Authorization', 'Bearer validToken')
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe('Updated');
    });

    it('should return error for unauthorized update', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };

      pool.connect.mockResolvedValue(mockClient);
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [] }); // No ownership

      const response = await request(app)
        .put('/api/items/123')
        .set('Authorization', 'Bearer validToken')
        .send({ title: 'Updated' })
        .expect(403);

      expect(response.body.error).toBe('Not authorized to update this item');
    });
  });

  describe('DELETE /api/items/:id', () => {
    it('should delete item successfully', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: '123' }] });

      const response = await request(app)
        .delete('/api/items/123')
        .set('Authorization', 'Bearer validToken')
        .expect(200);

      expect(response.body.message).toBe('Item deleted successfully');
    });

    it('should return error for not found item', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .delete('/api/items/123')
        .set('Authorization', 'Bearer validToken')
        .expect(404);

      expect(response.body.error).toBe('Item not found or not authorized');
    });
  });
});