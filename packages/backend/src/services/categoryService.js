import db, { saveDatabase } from '../db.js';
import { categories } from '../models/index.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import { eq, like, desc } from 'drizzle-orm';

export class CategoryService {
  async create(categoryData) {
    // Check for duplicate name
    const [existing] = await db
      .select()
      .from(categories)
      .where(eq(categories.name, categoryData.name))
      .limit(1);

    if (existing) {
      throw new ConflictError('Category with this name already exists');
    }

    const [newCategory] = await db.insert(categories).values(categoryData).returning();

    saveDatabase();

    return newCategory;
  }

  async getAll(filters = {}) {
    const { page = 1, limit = 50, search } = filters;
    const offset = (page - 1) * limit;

    let query = db.select().from(categories);

    if (search) {
      query = query.where(like(categories.name, `%${search}%`));
    }

    const results = await query.orderBy(desc(categories.createdAt)).limit(limit).offset(offset);

    return {
      data: results,
      meta: {
        page,
        limit,
      },
    };
  }

  async getById(id) {
    const [category] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);

    if (!category) {
      throw new NotFoundError('Category');
    }

    return category;
  }

  async update(id, categoryData) {
    const [updated] = await db
      .update(categories)
      .set(categoryData)
      .where(eq(categories.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundError('Category');
    }

    saveDatabase();

    return updated;
  }

  async delete(id) {
    const [deleted] = await db.delete(categories).where(eq(categories.id, id)).returning();

    if (!deleted) {
      throw new NotFoundError('Category');
    }

    saveDatabase();

    return { message: 'Category deleted successfully' };
  }
}
