import { Request, Response } from 'express';
import { Category } from '../models/Category';
import { catchAsync } from '../utils/catchAsync';
import { ApiError } from '../utils/ApiError';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export const listCategoriesHandler = catchAsync(async (_req: Request, res: Response) => {
  const categories = await Category.find({ deletedAt: null }).sort({ name: 1 });
  res.json({ data: categories });
});

export const createCategoryHandler = catchAsync(async (req: Request, res: Response) => {
  const { name, description, icon, parent } = req.body;
  const existing = await Category.findOne({ name, deletedAt: null });
  if (existing) {
    throw ApiError.conflict('Category with this name already exists');
  }
  const category = await Category.create({ name, slug: slugify(name), description, icon, parent });
  res.status(201).json({ data: category });
});

export const updateCategoryHandler = catchAsync(async (req: Request, res: Response) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!category || category.deletedAt) {
    throw ApiError.notFound('Category not found');
  }
  res.json({ data: category });
});

export const deleteCategoryHandler = catchAsync(async (req: Request, res: Response) => {
  const category = await Category.findByIdAndUpdate(req.params.id, { deletedAt: new Date() }, { new: true });
  if (!category) {
    throw ApiError.notFound('Category not found');
  }
  res.json({ data: { message: 'Category deleted' } });
});
