import { Equipment } from '../models/Equipment';
import { Category } from '../models/Category';
import { Booking, BookingStatus } from '../models/Booking';
import { logger } from '../config/logger';

export interface SearchFilters {
  category?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  availableFrom?: Date;
  availableTo?: Date;
  search?: string;
}

export interface ParsedQuery {
  filters: SearchFilters;
  originalQuery: string;
  confidence: number;
}

/**
 * Parse a natural-language search query into structured filters.
 * Rule-based approach — LLM enhancement comes in Phase 9.
 */
export async function parseSearchQuery(query: string): Promise<ParsedQuery> {
  const filters: SearchFilters = {};
  const lowerQuery = query.toLowerCase();

  // ── Extract Price ──────────────────────────────────────
  const underMatch = lowerQuery.match(/under\s+₹?(\d+)/);
  if (underMatch) {
    filters.maxPrice = parseInt(underMatch[1], 10);
  }

  const betweenMatch = lowerQuery.match(/between\s+₹?(\d+)\s+and\s+₹?(\d+)/);
  if (betweenMatch) {
    filters.minPrice = parseInt(betweenMatch[1], 10);
    filters.maxPrice = parseInt(betweenMatch[2], 10);
  }

  // ── Extract Location ───────────────────────────────────
  const inMatch = lowerQuery.match(/\bin\s+([a-z]+)/);
  if (inMatch) {
    filters.city = inMatch[1].charAt(0).toUpperCase() + inMatch[1].slice(1);
  }

  // ── Extract Category ───────────────────────────────────
  const categoryKeywords: Record<string, string[]> = {
    camera: ['camera', 'dslr', 'mirrorless', 'canon', 'nikon', 'sony'],
    lens: ['lens', 'zoom', 'prime'],
    lighting: ['light', 'strobe', 'flash', 'continuous'],
    audio: ['audio', 'microphone', 'mic', 'recorder', 'sound'],
    drone: ['drone', 'dji', 'aerial', 'quadcopter'],
    tripod: ['tripod', 'monopod', 'stand', 'support'],
    'power tool': ['drill', 'saw', 'sander', 'power tool', 'construction'],
    event: ['event', 'party', 'wedding', 'tent', 'table', 'chair'],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((kw) => lowerQuery.includes(kw))) {
      const cat = await Category.findOne({ name: { $regex: category, $options: 'i' } });
      if (cat) {
        filters.category = cat._id.toString();
        break;
      }
    }
  }

  // ── Extract Date Range ─────────────────────────────────
  const thisWeekend = lowerQuery.includes('weekend');
  const nextWeek = lowerQuery.includes('next week');
  const thisMonth = lowerQuery.includes('this month');

  if (thisWeekend) {
    const now = new Date();
    const saturday = new Date(now);
    saturday.setDate(now.getDate() + (6 - now.getDay()));
    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);
    filters.availableFrom = saturday;
    filters.availableTo = sunday;
  } else if (nextWeek) {
    const now = new Date();
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + (8 - now.getDay()));
    const nextSunday = new Date(nextMonday);
    nextSunday.setDate(nextMonday.getDate() + 6);
    filters.availableFrom = nextMonday;
    filters.availableTo = nextSunday;
  } else if (thisMonth) {
    const now = new Date();
    filters.availableFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    filters.availableTo = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  // ── Extract Duration ───────────────────────────────────
  const forMatch = lowerQuery.match(/for\s+(?:a\s+)?(\w+)\s+(?:shoot|rental|trip|event)/);
  if (forMatch) {
    const duration = forMatch[1].toLowerCase();
    if (duration.includes('day')) {
      filters.availableFrom = new Date();
      filters.availableTo = new Date(Date.now() + 24 * 60 * 60 * 1000);
    } else if (duration.includes('week')) {
      filters.availableFrom = new Date();
      filters.availableTo = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
  }

  // ── Confidence ─────────────────────────────────────────
  const hasPrice = filters.minPrice !== undefined || filters.maxPrice !== undefined;
  const hasLocation = filters.city !== undefined;
  const hasCategory = filters.category !== undefined;
  const hasDate = filters.availableFrom !== undefined;
  const confidence = Math.min(0.3 + (hasPrice ? 0.2 : 0) + (hasLocation ? 0.2 : 0) + (hasCategory ? 0.2 : 0) + (hasDate ? 0.1 : 0), 0.95);

  logger.info('NL search parsed', { query, filters, confidence });

  return { filters, originalQuery: query, confidence };
}

/**
 * Search equipment using parsed natural-language filters.
 */
export async function searchWithFilters(filters: SearchFilters) {
  const query: Record<string, unknown> = { deletedAt: null, isActive: true };

  if (filters.category) query.category = filters.category;
  if (filters.city) query.city = filters.city;
  if (filters.minPrice || filters.maxPrice) {
    query.pricePerDay = {};
    if (filters.minPrice) (query.pricePerDay as Record<string, number>).$gte = filters.minPrice;
    if (filters.maxPrice) (query.pricePerDay as Record<string, number>).$lte = filters.maxPrice;
  }
  if (filters.search) {
    query.$text = { $search: filters.search };
  }

  // Date availability
  if (filters.availableFrom && filters.availableTo) {
    const overlapping = await Booking.find({
      status: { $in: [BookingStatus.CONFIRMED, BookingStatus.PICKED_UP, BookingStatus.IN_USE] },
      startDate: { $lt: filters.availableTo },
      endDate: { $gt: filters.availableFrom },
      deletedAt: null,
    }).distinct('equipment');
    query._id = { $nin: overlapping };
  }

  return Equipment.find(query).populate('category', 'name slug').sort({ rating: -1 }).limit(20);
}
