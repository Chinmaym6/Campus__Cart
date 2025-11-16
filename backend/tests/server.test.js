import request from 'supertest';
import app from '../server.js';

describe('Server', () => {
  describe('GET /api/health', () => {
    it('should return status ok and message', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        message: 'Campus Cart API is running'
      });
    });
  });
});