# 🎯 دليل أفضل الممارسات البرمجية - CodeLIMS

## 📖 المحتويات

1. [معايير كتابة الكود](#معايير-كتابة-الكود)
2. [معالجة الأخطاء](#معالجة-الأخطاء)
3. [الأمان](#الأمان)
4. [الأداء](#الأداء)
5. [الاختبارات](#الاختبارات)
6. [التوثيق](#التوثيق)

---

## معايير كتابة الكود

### 1. تسمية المتغيرات والدوال

#### ✅ جيد

```javascript
// استخدام أسماء واضحة ومعبرة
const userFullName = 'John Doe';
const totalSalesAmount = calculateTotal(items);

async function createNewSale(saleData) {
  // Implementation
}

// Constants بأحرف كبيرة
const MAX_LOGIN_ATTEMPTS = 5;
const API_BASE_URL = 'http://localhost:3000';
```

#### ❌ سيء

```javascript
// أسماء غير واضحة
const x = 'John Doe';
const tmp = calc(data);

function doStuff(d) {
  // Implementation
}
```

### 2. هيكلة الكود

#### ✅ جيد

```javascript
// وظيفة واحدة لكل دالة (Single Responsibility)
async function validateUserCredentials(username, password) {
  if (!username || !password) {
    throw new ValidationError('Username and password are required');
  }

  return true;
}

async function authenticateUser(credentials) {
  await validateUserCredentials(credentials.username, credentials.password);

  const user = await findUserByUsername(credentials.username);
  const isValid = await verifyPassword(credentials.password, user.password);

  if (!isValid) {
    throw new AuthenticationError('Invalid credentials');
  }

  return user;
}
```

#### ❌ سيء

```javascript
// دالة تقوم بأكثر من مهمة
async function login(credentials) {
  // Validation
  if (!credentials.username) throw new Error('Username required');
  if (!credentials.password) throw new Error('Password required');

  // Database query
  const user = await db.select().from(users)...;

  // Password verification
  const isValid = await bcrypt.compare(...);

  // Token generation
  const token = jwt.sign(...);

  // Logging
  console.log('User logged in');

  // Response
  return { user, token };
}
```

---

## معالجة الأخطاء

### 1. استخدام Custom Error Classes

```javascript
// تعريف أنواع الأخطاء
export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

// الاستخدام
if (!email.includes('@')) {
  throw new ValidationError('Invalid email format');
}
```

### 2. معالجة الأخطاء في async/await

#### ✅ جيد

```javascript
async function fetchUserData(userId) {
  try {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  } catch (error) {
    // Log the error
    logger.error({ error, userId }, 'Failed to fetch user');

    // Re-throw if it's an operational error
    if (error instanceof AppError) {
      throw error;
    }

    // Wrap unexpected errors
    throw new DatabaseError('Failed to fetch user data');
  }
}
```

### 3. معالجة الأخطاء في Frontend

```javascript
// في Pinia Store
async fetchProducts(params = {}) {
  this.loading = true;
  const notificationStore = useNotificationStore();

  try {
    const response = await api.get('/products', { params });

    // Validate response
    if (!response.data) {
      throw new Error('Invalid response from server');
    }

    this.products = response.data;
    return response;
  } catch (error) {
    // Extract meaningful error message
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      'فشل تحميل المنتجات';

    notificationStore.error(errorMessage);

    // Re-throw for component handling if needed
    throw error;
  } finally {
    this.loading = false;
  }
}
```

---

## الأمان

### 1. حماية كلمات المرور

```javascript
// استخدام bcrypt لتشفير كلمات المرور
import bcrypt from 'bcryptjs';

export async function hashPassword(password) {
  // Validate password strength
  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters');
  }

  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// عدم إرجاع كلمة المرور في الاستجابة
const userWithoutPassword = { ...user };
delete userWithoutPassword.password;
return userWithoutPassword;
```

### 2. التحقق من الصلاحيات

```javascript
// Middleware للتحقق من الصلاحيات
export function requirePermission(permission) {
  return async (request, reply) => {
    const user = request.user;

    if (!user) {
      throw new AuthenticationError('Not authenticated');
    }

    if (!hasPermission(user, permission)) {
      throw new AuthorizationError(`You don't have permission to ${permission}`);
    }
  };
}

// الاستخدام
fastify.post(
  '/sales',
  {
    preHandler: [authenticate, requirePermission('create:sales')],
  },
  createSale
);
```

### 3. SQL Injection Prevention

```javascript
// ✅ جيد - استخدام Drizzle ORM
const users = await db.select().from(users).where(eq(users.username, userInput)).limit(1);

// ❌ سيء - Raw SQL بدون parameterization
const query = `SELECT * FROM users WHERE username = '${userInput}'`;
```

### 4. XSS Prevention

```javascript
// في Vue.js، استخدام v-text بدلاً من v-html للمحتوى غير الموثوق
<!-- ✅ جيد -->
<div v-text="userInput"></div>

<!-- ❌ خطر -->
<div v-html="userInput"></div>

// Sanitize HTML إذا كان لابد من استخدامه
import DOMPurify from 'dompurify';

const cleanHtml = DOMPurify.sanitize(dirtyHtml);
```

---

## الأداء

### 1. Database Optimization

```javascript
// ✅ استخدام Indexes
export const sales = sqliteTable(
  'sales',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    customerId: integer('customer_id').references(() => customers.id),
    createdAt: text('created_at').notNull(),
    status: text('status').notNull(),
  },
  (table) => ({
    customerIdx: index('sales_customer_idx').on(table.customerId),
    createdAtIdx: index('sales_created_at_idx').on(table.createdAt),
    statusIdx: index('sales_status_idx').on(table.status),
  })
);

// ✅ استخدام Pagination
const results = await db
  .select()
  .from(sales)
  .limit(limit)
  .offset((page - 1) * limit);

// ✅ Select محدد بدلاً من SELECT *
const users = await db
  .select({
    id: users.id,
    username: users.username,
    fullName: users.fullName,
  })
  .from(users);
```

### 2. Frontend Performance

```javascript
// ✅ Lazy Loading للمكونات
const Dashboard = defineAsyncComponent(() =>
  import('@/views/Dashboard.vue')
);

// ✅ Debounce للبحث
import { debounce } from 'lodash-es';

const searchQuery = ref('');

const debouncedSearch = debounce((query) => {
  productStore.fetchProducts({ search: query });
}, 300);

watch(searchQuery, (newValue) => {
  debouncedSearch(newValue);
});

// ✅ Computed للبيانات المشتقة
const totalAmount = computed(() => {
  return items.value.reduce((sum, item) =>
    sum + item.quantity * item.price, 0
  );
});

// ✅ Virtual Scrolling للقوائم الكبيرة
import { RecycleScroller } from 'vue-virtual-scroller';

<RecycleScroller
  :items="largeList"
  :item-size="50"
  key-field="id"
>
  <template #default="{ item }">
    <div>{{ item.name }}</div>
  </template>
</RecycleScroller>
```

### 3. Caching

```javascript
// Backend Caching
import cache from 'memory-cache';

async function getCurrencyRates() {
  const cacheKey = 'currency_rates';
  const cached = cache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const rates = await db.select().from(currencySettings);
  cache.put(cacheKey, rates, 3600000); // 1 hour

  return rates;
}

// Frontend Caching مع Pinia
export const useProductStore = defineStore('product', {
  state: () => ({
    products: [],
    lastFetch: null,
  }),

  actions: {
    async fetchProducts(force = false) {
      // Cache for 5 minutes
      const cacheTime = 5 * 60 * 1000;
      const now = Date.now();

      if (!force && this.lastFetch && now - this.lastFetch < cacheTime) {
        return this.products;
      }

      const response = await api.get('/products');
      this.products = response.data;
      this.lastFetch = now;

      return this.products;
    },
  },
});
```

---

## الاختبارات

### 1. Unit Tests

```javascript
import { test } from 'tap';
import { calculateSaleTotals } from './helpers.js';

test('calculateSaleTotals - basic calculation', async (t) => {
  const items = [
    { quantity: 2, unitPrice: 100 },
    { quantity: 1, unitPrice: 50 },
  ];

  const result = calculateSaleTotals(items, 10, 5);

  t.equal(result.subtotal, 250, 'subtotal should be 250');
  t.equal(result.discount, 10, 'discount should be 10');
  t.equal(result.total, 252, 'total should be 252');
});

test('calculateSaleTotals - validation', async (t) => {
  t.throws(() => calculateSaleTotals([], 0, 0), 'should throw error for empty items');

  t.throws(
    () => calculateSaleTotals([{ quantity: 1 }], 0, 0),
    'should throw error for invalid item'
  );
});
```

### 2. Integration Tests

```javascript
import { test } from 'tap';
import { build } from './app.js';

test('POST /api/sales - create sale', async (t) => {
  const app = await build();

  // Login first
  const loginResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: {
      username: 'admin',
      password: 'password123',
    },
  });

  const { token } = loginResponse.json().data;

  // Create sale
  const response = await app.inject({
    method: 'POST',
    url: '/api/sales',
    headers: {
      authorization: `Bearer ${token}`,
    },
    payload: {
      customerId: 1,
      currency: 'USD',
      items: [{ productId: 1, quantity: 2, unitPrice: 100 }],
      paymentType: 'cash',
      paidAmount: 200,
    },
  });

  t.equal(response.statusCode, 201);
  t.ok(response.json().data.id);
  t.equal(response.json().data.total, 200);

  await app.close();
});
```

### 3. E2E Tests مع Playwright

```javascript
import { test, expect } from '@playwright/test';

test('complete sales flow', async ({ page }) => {
  // Login
  await page.goto('http://localhost:5173/login');
  await page.fill('[name="username"]', 'admin');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Navigate to new sale
  await page.click('text=مبيعات جديدة');

  // Select product
  await page.click('[data-testid="product-select"]');
  await page.click('text=Product 1');

  // Set quantity
  await page.fill('[name="quantity"]', '2');

  // Submit
  await page.click('button:has-text("حفظ")');

  // Verify success
  await expect(page.locator('.v-snackbar')).toContainText('تم إضافة المبيعة بنجاح');
});
```

---

## التوثيق

### 1. JSDoc Comments

```javascript
/**
 * Create a new sale with items and payments
 *
 * @param {Object} saleData - Sale information
 * @param {number} saleData.customerId - Customer ID
 * @param {string} saleData.currency - Currency code (USD or IQD)
 * @param {Array<Object>} saleData.items - Array of sale items
 * @param {number} saleData.items[].productId - Product ID
 * @param {number} saleData.items[].quantity - Quantity
 * @param {number} saleData.items[].unitPrice - Unit price
 * @param {string} saleData.paymentType - Payment type (cash, installment, mixed)
 * @param {number} saleData.paidAmount - Amount paid
 * @param {number} userId - ID of user creating the sale
 *
 * @returns {Promise<Object>} Created sale object
 *
 * @throws {ValidationError} If sale data is invalid
 * @throws {NotFoundError} If product not found
 * @throws {DatabaseError} If database operation fails
 *
 * @example
 * const sale = await saleService.create({
 *   customerId: 1,
 *   currency: 'USD',
 *   items: [
 *     { productId: 1, quantity: 2, unitPrice: 100 }
 *   ],
 *   paymentType: 'cash',
 *   paidAmount: 200
 * }, userId);
 */
async create(saleData, userId) {
  // Implementation
}
```

### 2. README Files

كل module يجب أن يحتوي على README يشرح:

- الغرض من الـ module
- كيفية الاستخدام
- أمثلة عملية
- API Reference

### 3. Inline Comments

```javascript
// ✅ جيد - شرح منطق معقد
// Calculate interest for installment payments
// Interest is added to the total, not to each installment
if (saleData.paymentType === 'installment' && saleData.interestRate > 0) {
  interestAmount = (totals.total * saleData.interestRate) / 100;
  finalTotal = totals.total + interestAmount;
}

// ❌ سيء - شرح واضح من الكود نفسه
// Set x to 5
const x = 5;
```

---

## 🎓 خلاصة

### القواعد الذهبية:

1. **اكتب كود واضح** - يجب أن يكون الكود قابل للقراءة والفهم
2. **اتبع DRY** - Don't Repeat Yourself
3. **استخدم SOLID** - مبادئ البرمجة الكائنية
4. **اكتب اختبارات** - Code coverage > 80%
5. **وثّق كودك** - JSDoc + README + Comments
6. **عالج الأخطاء** - Never ignore errors
7. **فكّر في الأداء** - Optimize when needed
8. **راجع الكود** - Code review قبل الـ merge

---

تاريخ آخر تحديث: 11 نوفمبر 2025
