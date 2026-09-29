import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate, optionalAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { UserRole } from '../models/User';
import {
  listEquipmentHandler,
  getEquipmentHandler,
  getAvailabilityHandler,
  createEquipmentHandler,
  updateEquipmentHandler,
  deleteEquipmentHandler,
} from '../controllers/equipment.controller';

const router = Router();

const listQuerySchema = z.object({
  category: z.string().optional(),
  city: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  minRating: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
  radius: z.string().optional(),
  availableFrom: z.string().optional(),
  availableTo: z.string().optional(),
});

const createSchema = z.object({
  category: z.string().min(1),
  name: z.string().min(2).max(200),
  description: z.string().min(10).max(5000),
  images: z.array(z.string().url()).default([]),
  specs: z.record(z.union([z.string(), z.number(), z.boolean()])).default({}),
  location: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()]),
  }),
  city: z.string().min(1),
  address: z.string().optional(),
  pricePerDay: z.number().positive(),
  pricePerHour: z.number().positive().optional(),
  deposit: z.number().min(0).default(0),
  bufferMinutes: z.number().min(0).default(60),
  minRentalHours: z.number().min(1).default(1),
  maxRentalDays: z.number().min(1).default(30),
});

const updateSchema = createSchema.partial();

router.get('/', optionalAuth, validate({ query: listQuerySchema }), listEquipmentHandler);
router.get('/:id', optionalAuth, getEquipmentHandler);
router.get('/:id/availability', getAvailabilityHandler);
router.post('/', authenticate, requireRole(UserRole.OWNER, UserRole.ADMIN), validate({ body: createSchema }), createEquipmentHandler);
router.patch('/:id', authenticate, requireRole(UserRole.OWNER, UserRole.ADMIN), validate({ body: updateSchema }), updateEquipmentHandler);
router.delete('/:id', authenticate, requireRole(UserRole.OWNER, UserRole.ADMIN), deleteEquipmentHandler);

export default router;
