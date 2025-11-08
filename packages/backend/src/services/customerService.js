import db, { saveDatabase } from '../db.js';
import { customers, sales, saleItems } from '../models/index.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import { eq, like, or, desc, count } from 'drizzle-orm';

export class CustomerService {
  async create(customerData, userId) {
    // Check for duplicate phone
    const [existing] = await db
      .select()
      .from(customers)
      .where(eq(customers.phone, customerData.phone))
      .limit(1);

    if (existing && customerData.phone.trim() !== '') {
      throw new ConflictError(`Customer with phone ${customerData.phone} already exists`);
    }

    const [newCustomer] = await db
      .insert(customers)
      .values({
        ...customerData,
        createdBy: userId,
      })
      .returning();

    saveDatabase();

    return newCustomer;
  }

  async getAll(filters = {}) {
    const { page = 1, limit = 10, search } = filters;
    const offset = (page - 1) * limit;

    let query = db.select().from(customers);

    if (search) {
      query = query.where(
        or(like(customers.name, `%${search}%`), like(customers.phone, `%${search}%`))
      );
    }

    const results = await query.orderBy(desc(customers.createdAt)).limit(limit).offset(offset);

    const [{ total }] = await db.select({ total: count() }).from(customers);

    // join sales table
    query = query.leftJoin(sales, eq(customers.id, sales.customerId));
    query = query.leftJoin(saleItems, eq(sales.id, saleItems.saleId));

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
    const [customer] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);

    if (!customer) {
      throw new NotFoundError('Customer');
    }

    // join sales table and saleItems
    const salesData = await db
      .select()
      .from(sales)
      .where(eq(sales.customerId, id))
      .leftJoin(saleItems, eq(sales.id, saleItems.saleId));

    salesData.forEach((sale) => {
      sale.items = saleItems.filter((item) => item.saleId === sale.id);
    });

    customer.sales = salesData;

    return customer;
  }

  async update(id, customerData) {
    const [updated] = await db
      .update(customers)
      .set({
        ...customerData,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(customers.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundError('Customer');
    }

    saveDatabase();

    return updated;
  }

  async delete(id) {
    const [deleted] = await db.delete(customers).where(eq(customers.id, id)).returning();

    if (!deleted) {
      throw new NotFoundError('Customer');
    }

    saveDatabase();

    return { message: 'Customer deleted successfully' };
  }

  async updateDebt(customerId, amount) {
    const customer = await this.getById(customerId);

    const [updated] = await db
      .update(customers)
      .set({
        totalDebt: (customer.totalDebt || 0) + amount,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(customers.id, customerId))
      .returning();

    if (!updated) {
      throw new NotFoundError('Customer');
    }

    saveDatabase();

    return updated;
  }
}
