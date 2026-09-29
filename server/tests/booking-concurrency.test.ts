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

describe('Booking Engine — Concurrency', () => {
  it('should allow exactly one booking when 50 parallel requests are made for the same slot', async () => {
    const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString();

    // Fire 50 parallel booking requests
    const requests = Array.from({ length: 50 }, (_, i) =>
      request(app)
        .post('/api/v1/bookings')
        .set('Cookie', authCookie)
        .send({
          equipmentId,
          startDate,
          endDate,
          idempotencyKey: `concurrency-test-${i}`,
        })
    );

    const results = await Promise.all(requests);

    // Count successes (201) and conflicts (409)
    const successes = results.filter((r) => r.status === 201);
    const conflicts = results.filter((r) => r.status === 409);

    expect(successes).toHaveLength(1);
    expect(conflicts).toHaveLength(49);

    // Verify only one booking exists in the database
    const bookings = await Booking.find({ equipment: equipmentId, status: { $ne: 'CANCELLED' } });
    expect(bookings).toHaveLength(1);
  });

  it('should reject booking with overlapping dates', async () => {
    const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString();

    // First booking succeeds
    const first = await request(app)
      .post('/api/v1/bookings')
      .set('Cookie', authCookie)
      .send({ equipmentId, startDate, endDate, idempotencyKey: 'first-booking' });
    expect(first.status).toBe(201);

    // Overlapping booking fails
    const overlapStart = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString();
    const overlapEnd = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    const second = await request(app)
      .post('/api/v1/bookings')
      .set('Cookie', authCookie)
      .send({ equipmentId, startDate: overlapStart, endDate: overlapEnd, idempotencyKey: 'second-booking' });
    expect(second.status).toBe(409);
  });

  it('should reject booking with same idempotency key', async () => {
    const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString();

    const first = await request(app)
      .post('/api/v1/bookings')
      .set('Cookie', authCookie)
      .send({ equipmentId, startDate, endDate, idempotencyKey: 'duplicate-key' });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/v1/bookings')
      .set('Cookie', authCookie)
      .send({ equipmentId, startDate, endDate, idempotencyKey: 'duplicate-key' });
    expect(second.status).toBe(409);
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
    // PENDING → COMPLETED is invalid
    const res = await request(app)
      .post(`/api/v1/bookings/${bookingId}/transition`)
      .set('Cookie', authCookie)
      .send({ status: 'COMPLETED' });
    expect(res.status).toBe(409);
  });

  it('should allow cancel from PENDING', async () => {
    const res = await request(app)
      .post(`/api/v1/bookings/${bookingId}/cancel`)
      .set('Cookie', authCookie)
      .send({ reason: 'Changed mind' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CANCELLED');
  });
});
