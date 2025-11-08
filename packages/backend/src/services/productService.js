import db, { saveDatabase } from '../db.js';
import { products, categories } from '../models/index.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import { eq, like, or, desc, count, lte } from 'drizzle-orm';

export class ProductService {
  async create(productData, userId) {
    // Check for duplicate SKU
    if (productData.sku) {
      const [existing] = await db
        .select()
        .from(products)
        .where(eq(products.sku, productData.sku))
        .limit(1);

      if (existing) {
        throw new ConflictError('Product with this SKU already exists');
      }
    }

    const [newProduct] = await db
      .insert(products)
      .values({
        ...productData,
        createdBy: userId,
      })
      .returning();

    saveDatabase();

    return newProduct;
  }

  async getAll(filters = {}) {
    const { page = 1, limit = 10, search, categoryId } = filters;
    const offset = (page - 1) * limit;

    let query = db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        barcode: products.barcode,
        description: products.description,
        costPrice: products.costPrice,
        sellingPrice: products.sellingPrice,
        currency: products.currency,
        stock: products.stock,
        minStock: products.minStock,
        unit: products.unit,
        supplier: products.supplier,
        isActive: products.isActive,
        createdAt: products.createdAt,
        category: categories.name,
        status: products.status,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id));

    if (search) {
      query = query.where(
        or(
          like(products.name, `%${search}%`),
          like(products.sku, `%${search}%`),
          like(products.barcode, `%${search}%`)
        )
      );
    }

    if (categoryId) {
      query = query.where(eq(products.categoryId, categoryId));
    }

    const results = await query.orderBy(desc(products.createdAt)).limit(limit).offset(offset);

    const [{ total }] = await db.select({ total: count() }).from(products);

    return {
      data: results,
      meta: {
        total: total || 0,
        page,
        limit,
        totalPages: Math.ceil((total || 0) / limit),
      },
    };
  }

  async getById(id) {
    const [product] = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        barcode: products.barcode,
        categoryId: products.categoryId,
        description: products.description,
        costPrice: products.costPrice,
        sellingPrice: products.sellingPrice,
        currency: products.currency,
        stock: products.stock,
        minStock: products.minStock,
        unit: products.unit,
        supplier: products.supplier,
        isActive: products.isActive,
        createdAt: products.createdAt,
        category: categories.name,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, id))
      .limit(1);

    if (!product) {
      throw new NotFoundError('Product');
    }

    return product;
  }

  async update(id, productData) {
    const [updated] = await db
      .update(products)
      .set({
        ...productData,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(products.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundError('Product');
    }

    saveDatabase();

    return updated;
  }

  async delete(id) {
    const [deleted] = await db.delete(products).where(eq(products.id, id)).returning();

    if (!deleted) {
      throw new NotFoundError('Product');
    }

    saveDatabase();

    return { message: 'Product deleted successfully' };
  }

  async updateStock(productId, quantity) {
    const product = await this.getById(productId);

    const [updated] = await db
      .update(products)
      .set({
        stock: product.stock + quantity,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(products.id, productId))
      .returning();

    saveDatabase();

    return updated;
  }

  async getLowStock() {
    const lowStockProducts = await db
      .select()
      .from(products)
      .where((products) => lte(products.stock, products.minStock));

    return lowStockProducts;
  }
}
