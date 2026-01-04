/* FILE: src/server/tests/auth.test.ts */
import request from 'supertest';
import { app } from '../index';
import { connectDatabase, closeConnection } from '../db';

describe('Authentication Endpoints', () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await closeConnection();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.ok).toBe(true);
      expect(response.body.message).toBe('Waitless API Server is running');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body.ok).toBe(false);
      expect(response.body.error).toContain('Validation failed');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User'
        })
        .expect(400);

      expect(response.body.ok).toBe(false);
    });

    it('should validate password length', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: '123',
          name: 'Test User'
        })
        .expect(400);

      expect(response.body.ok).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.ok).toBe(false);
    });

    it('should return error for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        })
        .expect(400);

      expect(response.body.ok).toBe(false);
    });
  });

  describe('GET /api/status', () => {
    it('should return server status', async () => {
      const response = await request(app)
        .get('/api/status')
        .expect(200);

      expect(response.body.ok).toBe(true);
      expect(response.body.data.server).toBe('running');
      expect(response.body.data.database).toBe('connected');
    });
  });

  describe('GET /api/nonexistent', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.ok).toBe(false);
      expect(response.body.error).toBe('Route not found');
    });
  });
});