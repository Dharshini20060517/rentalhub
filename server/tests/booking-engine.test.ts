import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { connectDB, disconnectDB } from '../src/config/db';
import { User } from '../src/models/User';
import { Equipment } from '../src/models/Equipment';
import { Booking } from '../src/models/Booking';
import { BookingHold } from '../src/models/BookingHold';

let authCookie: string[];
let equipmentId: string;

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
    BookingHold.deleteMany({}),
  ]);

  // Create owner
  await request(app)
    .post('/api/v1/auth/register')
    .send({ email: 'owner@test.com', password: 'Test@123456', name: 'Owner', role: 'owner' });

  // Create customer
  const custRes = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: 'customer@test.com', password: 'Test@123456', name: 'Customer', role: 'customer' });
  authCookie = custRes.headers['set-cookie'];

  // Create equipment
  const eqRes = await request(app)
    .post('/api/v1/equipment')
    .set('Cookie', authCookie)
    .send({
      category: '66a1b2c3d4e5f6a7b8c9d0e1',
      name: 'Test Camera',
      description: 'A test camera for rental',
      location: { type: 'Point', coordinates: [80.2707, 13.0827] },
      city: 'Chennai',
      pricePerDay: 1000,
      deposit: 5000,
    });
  equipmentId = eqRes.body.data._id;
});

describe('Booking Engine — Integration', () => {
  it('should create a booking hold and confirm it', async () => {
    const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString();

    // Create hold
    const holdRes = await request(app)
      .post('/api/v1/bookings')
      .set('Cookie', authCookie)
      .send({ equipmentId, startDate, endDate, idempotencyKey: 'test-hold-1' });
    expect(holdRes.status).toBe(201);
    expect(holdRes.body.data.status).toBe('PENDING');

    const bookingId = holdRes.body.data._id;

    // Confirm booking
    const confirmRes = await request(app)
      .post('/api/v1/bookings/confirm')
      .set('Cookie', authCookie)
      .send({ bookingId, paymentId: 'pi_test_123' });
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.status).toBe('CONFIRMED');
  });

  it('should reject booking with past dates', async () => {
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Cookie', authCookie)
      .send({ equipmentId, startDate, endDate, idempotencyKey: 'test-past' });
    expect(res.status).toBe(400);
  });

  it('should reject booking with end date before start date', async () => {
    const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Cookie', authCookie)
      .send({ equipmentId, startDate, endDate, idempotencyKey: 'test-invalid' });
    expect(res.status).toBe(400);
  });

  it('should allow cancel from CONFIRMED state', async () => {
    const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString();

    // Create and confirm booking
    const holdRes = await request(app)
      .post('/api/v1/bookings')
      .set('Cookie', authCookie)
      .send({ equipmentId, startDate, endDate, idempotencyKey: 'test-cancel' });
    const bookingId = holdRes.body.data._id;

    await request(app)
      .post('/api/v1/bookings/confirm')
      .set('Cookie', authCookie)
      .send({ bookingId, paymentId: 'pi_test_123' });

    // Cancel booking
    const cancelRes = await request(app)
      .post(`/api/v1/bookings/${bookingId}/cancel`)
      .set('Cookie', authCookie)
      .send({ reason: 'Changed mind' });
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe('CANCELLED');
  });
});

describe('Booking Engine — State Machine', () => {
  let bookingId: string;

  beforeEach(async () => {
    const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString();
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Cookie', authCookie)
      .send({ equipmentId, startDate, endDate, idempotencyKey: `state-test-${Date.now()}` });
    bookingId = res.body.data._id;
  });

  it('should reject invalid state transition', async () => {
    const res = await request(app)
      .post(`/api/v1/bookings/${bookingId}/transition`)
      .set('Cookie', authCookie)
      .send({ status: 'COMPLETED' });
    expect(res.status).toBe(409);
  });

  it('should allow valid state transition', async () => {
    // PENDING → CANCELLED is valid
    const res = await request(app)
      .post(`/api/v1/bookings/${bookingId}/cancel`)
      .set('Cookie', authCookie)
      .send({ reason: 'Test' });
    expect(res.status).toBe(200);
  });
});
