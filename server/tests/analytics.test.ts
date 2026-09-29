import request from 'supertest';
import app from '../src/app';
import { connectDB, disconnectDB } from '../src/config/db';
import { User } from '../src/models/User';
import { Equipment } from '../src/models/Equipment';
import { Booking } from '../src/models/Booking';

let ownerCookie: string[];
let customerCookie: string[];

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await disconnectDB();
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Equipment.deleteMany({}),
    Booking.deleteMany({}),
  ]);

  // Create owner
  const ownerRes = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: 'owner@test.com', password: 'Test@123456', name: 'Owner', role: 'owner' });
  ownerCookie = ownerRes.headers['set-cookie'];

  // Create customer
  const custRes = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: 'customer@test.com', password: 'Test@123456', name: 'Customer', role: 'customer' });
  customerCookie = custRes.headers['set-cookie'];

  // Create equipment
  await request(app)
    .post('/api/v1/equipment')
    .set('Cookie', ownerCookie)
    .send({
      category: '66a1b2c3d4e5f6a7b8c9d0e1',
      name: 'Test Camera',
      description: 'A test camera for rental',
      location: { type: 'Point', coordinates: [80.2707, 13.0827] },
      city: 'Chennai',
      pricePerDay: 1000,
      deposit: 5000,
    });
});

describe('Analytics', () => {
  it('should return owner summary', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/owner/summary')
      .set('Cookie', ownerCookie);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totalRevenue');
    expect(res.body.data).toHaveProperty('totalBookings');
    expect(res.body.data).toHaveProperty('utilizationRate');
  });

  it('should return owner revenue trend', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/owner/revenue-trend?days=30')
      .set('Cookie', ownerCookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should return owner top equipment', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/owner/top-equipment?limit=5')
      .set('Cookie', ownerCookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should forbid customer from accessing owner analytics', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/owner/summary')
      .set('Cookie', customerCookie);
    expect(res.status).toBe(403);
  });
});
