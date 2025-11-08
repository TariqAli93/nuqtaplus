import { z } from 'zod';

// User schemas
export const userSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  roleId: z.number().int().positive(),
});

export const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
  totpCode: z.string().length(6).optional(),
});

// Customer schemas
export const customerSchema = z.object({
  name: z.string().min(2),
  phone: z.string(),
  address: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().optional(),
});

// Product schemas
export const productSchema = z.object({
  name: z.string().min(2),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.number().int().positive().optional(),
  description: z.string().optional(),
  costPrice: z.number().positive(),
  sellingPrice: z.number().positive(),
  currency: z.enum(['USD', 'IQD']),
  stock: z.number().int().nonnegative(),
  minStock: z.number().int().nonnegative().optional(),
  unit: z.string().optional(),
  status: z.enum(['available', 'out_of_stock', 'discontinued']).optional(),
});

// Category schemas
export const categorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

// Sale schemas
export const saleItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  discount: z.number().nonnegative().optional(),
});

export const saleSchema = z.object({
  customerId: z.number().int().positive().optional(),
  currency: z.enum(['USD', 'IQD']),
  exchangeRate: z.number().positive().optional(),
  items: z.array(saleItemSchema).min(1),
  discount: z.number().nonnegative().optional(),
  tax: z.number().nonnegative().optional(),
  paymentType: z.enum(['cash', 'installment', 'mixed']),
  paymentMethod: z.enum(['cash', 'card', 'bank_transfer']).optional(),
  paidAmount: z.number().nonnegative().optional(),
  installmentCount: z.number().int().positive().optional(),
  notes: z.string().optional(),
  interestRate: z.number().nonnegative().optional(),
  interestAmount: z.number().nonnegative().optional(),
});

// Payment schemas
export const paymentSchema = z.object({
  saleId: z.number().int().positive().optional(),
  customerId: z.number().int().positive().optional(),
  amount: z.number().positive(),
  currency: z.enum(['USD', 'IQD']),
  exchangeRate: z.number().positive(),
  paymentMethod: z.enum(['cash', 'card', 'bank_transfer']),
  notes: z.string().optional(),
});

// Installment schemas
export const installmentSchema = z.object({
  saleId: z.number().int().positive(),
  customerId: z.number().int().positive(),
  installmentNumber: z.number().int().positive(),
  dueAmount: z.number().positive(),
  currency: z.enum(['USD', 'IQD']),
  dueDate: z.string(),
  notes: z.string().optional(),
});

// Role schemas
export const roleSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

// Permission schemas
export const permissionSchema = z.object({
  name: z.string().min(2),
  resource: z.string().min(2),
  action: z.enum(['create', 'read', 'update', 'delete', 'manage']),
  description: z.string().optional(),
});

// Query schemas
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const settingsSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
});
