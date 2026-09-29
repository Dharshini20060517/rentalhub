import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { connectDB, disconnectDB } from '../src/config/db';
import { User } from '../src/models/User';

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await disconnectDB();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Auth', () => {
  const registerPayload = {
    email: 'test@example.com',
    password: 'Test@123456',
    name: 'Test User',
    role: 'customer',
  };

  describe('POST /api/v1/auth/register', () => {
    it('should register a new customer', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(registerPayload);
      expect(res.status).toBe(201);
      expect(res.body.data.email).toBe(registerPayload.email);
      expect(res.body.data.role).toBe('customer');
    });

    it('should reject duplicate email', async () => {
      await request(app).post('/api/v1/auth/register').send(registerPayload);
      const res = await request(app).post('/api/v1/auth/register').send(registerPayload);
      expect(res.status).toBe(409);
    });

    it('should reject invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...registerPayload, email: 'not-an-email' });
      expect(res.status).toBe(400);
    });

    it('should reject short password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...registerPayload, password: 'short' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(registerPayload);
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: registerPayload.email, password: registerPayload.password });
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(registerPayload.email);
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: registerPayload.email, password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });

    it('should reject non-existent user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'somepassword' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    it('should return user with valid token', async () => {
      await request(app).post('/api/v1/auth/register').send(registerPayload);
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: registerPayload.email, password: registerPayload.password });
      const cookies = loginRes.headers['set-cookie'];
      const res = await request(app).get('/api/v1/auth/me').set('Cookie', cookies);
      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('customer');
    });
  });
});
