import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db';
import { User, UserRole } from '../models/User';
import { Category } from '../models/Category';
import { Equipment } from '../models/Equipment';
import { Booking, BookingStatus } from '../models/Booking';
import { Review } from '../models/Review';
import { Notification, NotificationType } from '../models/Notification';
import { TrustScore } from '../models/TrustScore';
import { HealthScore } from '../models/HealthScore';

async function clearData(): Promise<void> {
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Equipment.deleteMany({}),
    Booking.deleteMany({}),
    Review.deleteMany({}),
    Notification.deleteMany({}),
    TrustScore.deleteMany({}),
    HealthScore.deleteMany({}),
  ]);
  console.log('[seed] Cleared existing data');
}

async function seed(): Promise<void> {
  await connectDB();
  await clearData();

  // ── Users ──────────────────────────────────────────────
  const admin = await User.create({
    email: 'admin@rentalhub.com',
    passwordHash: 'Admin@123456',
    name: 'Platform Admin',
    role: UserRole.ADMIN,
    verificationLevel: 'full',
    city: 'Chennai',
    location: { type: 'Point', coordinates: [80.2707, 13.0827] },
  });

  const owners = await User.create([
    {
      email: 'owner1@rentalhub.com',
      passwordHash: 'Owner@123456',
      name: 'Karthik Rentals',
      role: UserRole.OWNER,
      verificationLevel: 'full',
      city: 'Chennai',
      location: { type: 'Point', coordinates: [80.2600, 13.0900] },
    },
    {
      email: 'owner2@rentalhub.com',
      passwordHash: 'Owner@123456',
      name: 'Priya Events & Equipment',
      role: UserRole.OWNER,
      verificationLevel: 'full',
      city: 'Bangalore',
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
    },
    {
      email: 'owner3@rentalhub.com',
      passwordHash: 'Owner@123456',
      name: 'Mumbai Pro Gear',
      role: UserRole.OWNER,
      verificationLevel: 'id',
      city: 'Mumbai',
      location: { type: 'Point', coordinates: [72.8777, 19.0760] },
    },
  ]);

  const customers = await User.create([
    {
      email: 'customer1@rentalhub.com',
      passwordHash: 'Customer@123',
      name: 'Arun Kumar',
      role: UserRole.CUSTOMER,
      verificationLevel: 'full',
      city: 'Chennai',
      location: { type: 'Point', coordinates: [80.2500, 13.0700] },
    },
    {
      email: 'customer2@rentalhub.com',
      passwordHash: 'Customer@123',
      name: 'Sneha Sharma',
      role: UserRole.CUSTOMER,
      verificationLevel: 'email',
      city: 'Chennai',
      location: { type: 'Point', coordinates: [80.2400, 13.0600] },
    },
    {
      email: 'customer3@rentalhub.com',
      passwordHash: 'Customer@123',
      name: 'Rahul Verma',
      role: UserRole.CUSTOMER,
      verificationLevel: 'phone',
      city: 'Bangalore',
      location: { type: 'Point', coordinates: [77.6000, 12.9800] },
    },
    {
      email: 'customer4@rentalhub.com',
      passwordHash: 'Customer@123',
      name: 'Divya Nair',
      role: UserRole.CUSTOMER,
      verificationLevel: 'email',
      city: 'Mumbai',
      location: { type: 'Point', coordinates: [72.8800, 19.0800] },
    },
    {
      email: 'customer5@rentalhub.com',
      passwordHash: 'Customer@123',
      name: 'Vikram Singh',
      role: UserRole.CUSTOMER,
      verificationLevel: 'none',
      city: 'Chennai',
      location: { type: 'Point', coordinates: [80.2300, 13.0500] },
    },
  ]);

  console.log(`[seed] Created ${1 + owners.length + customers.length} users`);

  // ── Categories ─────────────────────────────────────────
  const categories = await Category.create([
    { name: 'Cameras', slug: 'cameras', description: 'DSLR, mirrorless, and cinema cameras', icon: 'camera' },
    { name: 'Lenses', slug: 'lenses', description: 'Prime and zoom lenses for all mounts', icon: 'circle' },
    { name: 'Lighting', slug: 'lighting', description: 'Studio strobes, continuous lights, and modifiers', icon: 'sun' },
    { name: 'Audio', slug: 'audio', description: 'Microphones, recorders, and mixers', icon: 'mic' },
    { name: 'Tripods & Supports', slug: 'tripods-supports', description: 'Tripods, monopods, and stabilizers', icon: 'triangle' },
    { name: 'Drones', slug: 'drones', description: 'Aerial photography and videography drones', icon: 'send' },
    { name: 'Power Tools', slug: 'power-tools', description: 'Drills, saws, sanders, and construction tools', icon: 'zap' },
    { name: 'Event Equipment', slug: 'event-equipment', description: 'Stages, tents, chairs, and decor', icon: 'package' },
  ]);

  console.log(`[seed] Created ${categories.length} categories`);

  // ── Equipment ──────────────────────────────────────────
  const equipment = await Equipment.create([
    {
      owner: owners[0]._id,
      category: categories[0]._id,
      name: 'Canon EOS R5 Body',
      description: 'Full-frame mirrorless camera with 45MP sensor, 8K video, and IBIS. Excellent for weddings and commercial shoots.',
      images: ['https://res.cloudinary.com/demo/image/upload/canon-r5.jpg'],
      specs: { sensor: 'Full-frame', resolution: '45MP', video: '8K30', mount: 'RF' },
      location: { type: 'Point', coordinates: [80.2600, 13.0900] },
      city: 'Chennai',
      address: 'T. Nagar, Chennai',
      pricePerDay: 3500,
      deposit: 15000,
      bufferMinutes: 120,
      minRentalHours: 4,
      maxRentalDays: 14,
      rating: 4.8,
      reviewCount: 23,
      isVerified: true,
    },
    {
      owner: owners[0]._id,
      category: categories[1]._id,
      name: 'Canon RF 24-70mm f/2.8L',
      description: 'Professional standard zoom lens with constant f/2.8 aperture. Sharp across the range.',
      images: ['https://res.cloudinary.com/demo/image/upload/rf2470.jpg'],
      specs: { focalLength: '24-70mm', aperture: 'f/2.8', mount: 'RF' },
      location: { type: 'Point', coordinates: [80.2600, 13.0900] },
      city: 'Chennai',
      address: 'T. Nagar, Chennai',
      pricePerDay: 2000,
      deposit: 8000,
      bufferMinutes: 60,
      minRentalHours: 4,
      maxRentalDays: 14,
      rating: 4.9,
      reviewCount: 18,
      isVerified: true,
    },
    {
      owner: owners[0]._id,
      category: categories[2]._id,
      name: 'Godox AD600 Pro Strobe',
      description: '600Ws battery-powered strobe with TTL and high-speed sync. Great for outdoor shoots.',
      images: ['https://res.cloudinary.com/demo/image/upload/ad600.jpg'],
      specs: { power: '600Ws', ttl: true, hss: true, battery: 'Li-ion' },
      location: { type: 'Point', coordinates: [80.2600, 13.0900] },
      city: 'Chennai',
      address: 'T. Nagar, Chennai',
      pricePerDay: 1500,
      deposit: 5000,
      bufferMinutes: 60,
      minRentalHours: 4,
      maxRentalDays: 7,
      rating: 4.7,
      reviewCount: 12,
      isVerified: true,
    },
    {
      owner: owners[1]._id,
      category: categories[3]._id,
      name: 'Rode Wireless GO II',
      description: 'Dual-channel wireless microphone system. Compact, easy to use, great for interviews.',
      images: ['https://res.cloudinary.com/demo/image/upload/rode-go2.jpg'],
      specs: { channels: 2, range: '100m', battery: '7h', connectivity: '3.5mm' },
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      city: 'Bangalore',
      address: 'Koramangala, Bangalore',
      pricePerDay: 800,
      deposit: 2000,
      bufferMinutes: 30,
      minRentalHours: 4,
      maxRentalDays: 7,
      rating: 4.6,
      reviewCount: 31,
      isVerified: true,
    },
    {
      owner: owners[1]._id,
      category: categories[4]._id,
      name: 'Manfrotto Befree Advanced Tripod',
      description: 'Compact travel tripod with ball head. Supports up to 8kg. Great for mirrorless setups.',
      images: ['https://res.cloudinary.com/demo/image/upload/befree.jpg'],
      specs: { maxLoad: '8kg', foldedLength: '40cm', weight: '1.5kg' },
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      city: 'Bangalore',
      address: 'Koramangala, Bangalore',
      pricePerDay: 400,
      deposit: 1000,
      bufferMinutes: 30,
      minRentalHours: 4,
      maxRentalDays: 14,
      rating: 4.5,
      reviewCount: 15,
      isVerified: true,
    },
    {
      owner: owners[1]._id,
      category: categories[5]._id,
      name: 'DJI Mavic 3 Pro',
      description: 'Flagship drone with Hasselblad triple-camera system. 43-min flight time, omnidirectional sensing.',
      images: ['https://res.cloudinary.com/demo/image/upload/mavic3.jpg'],
      specs: { camera: '4/3 CMOS', flightTime: '43min', range: '15km', weight: '958g' },
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      city: 'Bangalore',
      address: 'Koramangala, Bangalore',
      pricePerDay: 5000,
      deposit: 25000,
      bufferMinutes: 120,
      minRentalHours: 4,
      maxRentalDays: 7,
      rating: 4.9,
      reviewCount: 8,
      isVerified: true,
    },
    {
      owner: owners[2]._id,
      category: categories[6]._id,
      name: 'Bosch GSB 24-2 Professional Drill',
      description: 'Heavy-duty 1100W impact drill with 24mm capacity. Includes carrying case and bit set.',
      images: ['https://res.cloudinary.com/demo/image/upload/bosch-drill.jpg'],
      specs: { power: '1100W', chuck: '13mm', speed: '2-speed', weight: '2.8kg' },
      location: { type: 'Point', coordinates: [72.8777, 19.0760] },
      city: 'Mumbai',
      address: 'Andheri West, Mumbai',
      pricePerDay: 600,
      deposit: 2000,
      bufferMinutes: 60,
      minRentalHours: 4,
      maxRentalDays: 30,
      rating: 4.4,
      reviewCount: 19,
      isVerified: true,
    },
    {
      owner: owners[2]._id,
      category: categories[7]._id,
      name: 'Folding Event Table (6ft)',
      description: 'Heavy-duty plastic folding table. Seats 6-8 people. Easy to transport and clean.',
      images: ['https://res.cloudinary.com/demo/image/upload/event-table.jpg'],
      specs: { length: '6ft', material: 'HDPE', weightCapacity: '150kg' },
      location: { type: 'Point', coordinates: [72.8777, 19.0760] },
      city: 'Mumbai',
      address: 'Andheri West, Mumbai',
      pricePerDay: 300,
      deposit: 500,
      bufferMinutes: 30,
      minRentalHours: 4,
      maxRentalDays: 30,
      rating: 4.3,
      reviewCount: 27,
      isVerified: false,
    },
  ]);

  console.log(`[seed] Created ${equipment.length} equipment items`);

  // ── Bookings ───────────────────────────────────────────
  const now = new Date();
  const bookings = await Booking.create([
    {
      equipment: equipment[0]._id,
      customer: customers[0]._id,
      owner: owners[0]._id,
      startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      status: BookingStatus.COMPLETED,
      totalAmount: 7000,
      depositAmount: 15000,
      depositHeld: false,
    },
    {
      equipment: equipment[0]._id,
      customer: customers[1]._id,
      owner: owners[0]._id,
      startDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      status: BookingStatus.CONFIRMED,
      totalAmount: 7000,
      depositAmount: 15000,
      depositHeld: true,
    },
    {
      equipment: equipment[2]._id,
      customer: customers[2]._id,
      owner: owners[0]._id,
      startDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      status: BookingStatus.PICKED_UP,
      totalAmount: 1500,
      depositAmount: 5000,
      depositHeld: true,
    },
    {
      equipment: equipment[5]._id,
      customer: customers[3]._id,
      owner: owners[1]._id,
      startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      status: BookingStatus.IN_USE,
      totalAmount: 15000,
      depositAmount: 25000,
      depositHeld: true,
    },
  ]);

  console.log(`[seed] Created ${bookings.length} bookings`);

  // ── Reviews ────────────────────────────────────────────
  await Review.create([
    {
      booking: bookings[0]._id,
      reviewer: customers[0]._id,
      reviewee: owners[0]._id,
      equipment: equipment[0]._id,
      rating: 5,
      comment: 'Excellent camera, perfectly maintained. Karthik was very helpful with setup.',
      conditionRating: 5,
      isVerifiedRental: true,
    },
    {
      booking: bookings[0]._id,
      reviewer: customers[0]._id,
      reviewee: owners[0]._id,
      equipment: equipment[0]._id,
      rating: 4,
      comment: 'Great condition, minor scuff on the grip. Overall very satisfied.',
      conditionRating: 4,
      isVerifiedRental: true,
    },
  ]);

  console.log('[seed] Created reviews');

  // ── Notifications ──────────────────────────────────────
  await Notification.create([
    {
      user: owners[0]._id,
      type: NotificationType.BOOKING_CONFIRMED,
      title: 'New Booking Confirmed',
      message: 'Sneha Sharma booked Canon EOS R5 Body for 2 days.',
      read: false,
    },
    {
      user: customers[1]._id,
      type: NotificationType.BOOKING_REMINDER,
      title: 'Pickup Reminder',
      message: 'Your Canon EOS R5 Body pickup is scheduled in 3 days.',
      read: false,
    },
  ]);

  console.log('[seed] Created notifications');

  // ── Trust Scores ───────────────────────────────────────
  await TrustScore.create([
    { user: customers[0]._id, score: 92, factors: { onTimeReturns: 95, damageHistory: 100, disputeOutcomes: 100, cancellationRate: 90, verificationLevel: 100, reviewQuality: 85 }, calculatedAt: now },
    { user: customers[1]._id, score: 78, factors: { onTimeReturns: 80, damageHistory: 90, disputeOutcomes: 100, cancellationRate: 70, verificationLevel: 50, reviewQuality: 80 }, calculatedAt: now },
    { user: customers[2]._id, score: 65, factors: { onTimeReturns: 70, damageHistory: 80, disputeOutcomes: 100, cancellationRate: 50, verificationLevel: 50, reviewQuality: 60 }, calculatedAt: now },
    { user: customers[3]._id, score: 45, factors: { onTimeReturns: 50, damageHistory: 60, disputeOutcomes: 80, cancellationRate: 30, verificationLevel: 50, reviewQuality: 40 }, calculatedAt: now },
    { user: customers[4]._id, score: 25, factors: { onTimeReturns: 30, damageHistory: 40, disputeOutcomes: 60, cancellationRate: 20, verificationLevel: 0, reviewQuality: 20 }, calculatedAt: now },
  ]);

  console.log('[seed] Created trust scores');

  // ── Health Scores ──────────────────────────────────────
  await HealthScore.create([
    { equipment: equipment[0]._id, score: 88, factors: { age: 85, usageHours: 90, serviceHistory: 95, overdueMaintenance: 100, damageReports: 80, returnCondition: 90 }, calculatedAt: now },
    { equipment: equipment[1]._id, score: 92, factors: { age: 90, usageHours: 95, serviceHistory: 95, overdueMaintenance: 100, damageReports: 90, returnCondition: 95 }, calculatedAt: now },
    { equipment: equipment[2]._id, score: 75, factors: { age: 70, usageHours: 80, serviceHistory: 75, overdueMaintenance: 60, damageReports: 70, returnCondition: 80 }, calculatedAt: now },
    { equipment: equipment[5]._id, score: 95, factors: { age: 95, usageHours: 95, serviceHistory: 100, overdueMaintenance: 100, damageReports: 95, returnCondition: 95 }, calculatedAt: now },
  ]);

  console.log('[seed] Created health scores');
  console.log('\n[seed] ✅ Seed complete!');
  console.log('\nDemo accounts:');
  console.log('  Admin:    admin@rentalhub.com / Admin@123456');
  console.log('  Owner:    owner1@rentalhub.com / Owner@123456');
  console.log('  Customer: customer1@rentalhub.com / Customer@123');

  await disconnectDB();
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
