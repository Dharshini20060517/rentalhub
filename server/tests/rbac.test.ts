import request from 'supertest';
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

async function createUserAndLogin(email: string, role: string): Promise<string[]> {
  await request(app)
    .post('/api/v1/auth/register')
    .send({ email, password: 'Test@123456', name: 'Test User', role });
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password: 'Test@123456' });
  return loginRes.headers['set-cookie'];
}

describe('RBAC', () => {
  it('should allow admin to list users', async () => {
    const cookies = await createUserAndLogin('admin@test.com', 'admin');
    const res = await request(app).get('/api/v1/users').set('Cookie', cookies);
    expect(res.status).toBe(200);
  });

  it('should forbid customer from listing users', async () => {
    const cookies = await createUserAndLogin('customer@test.com', 'customer');
    const res = await request(app).get('/api/v1/users').set('Cookie', cookies);
    expect(res.status).toBe(403);
  });

  it('should forbid owner from listing users', async () => {
    const cookies = await createUserAndLogin('owner@test.com', 'owner');
    const res = await request(app).get('/api/v1/users').set('Cookie', cookies);
    expect(res.status).toBe(403);
  });

  it('should allow admin to create categories', async () => {
    const cookies = await createUserAndLogin('admin2@test.com', 'admin');
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Cookie', cookies)
      .send({ name: 'Test Category' });
    expect(res.status).toBe(201);
  });

  it('should forbid customer from creating categories', async () => {
    const cookies = await createUserAndLogin('customer2@test.com', 'customer');
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Cookie', cookies)
      .send({ name: 'Test Category' });
    expect(res.status).toBe(403);
  });
});
