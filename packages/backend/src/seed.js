import db, { saveDatabase } from './db.js';
import { roles, permissions, rolePermissions, customers, settings } from './models/index.js';
import { sql, eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Helper: Count rows of a table
    const countTable = async (table) => {
      const result = await db
        .select({ count: sql`count(*)` })
        .from(table)
        .get();
      return Number(result?.count || 0);
    };

    // Helper: Insert if table empty (preserve existing data)
    const insertIfEmpty = async (table, data, label) => {
      const count = await countTable(table);
      if (count === 0) {
        await db.insert(table).values(data);
        console.log(`✓ ${label} inserted`);
      } else {
        console.log(`↩️ ${label} already exist`);
      }
    };

    // Helper: Ensure role exists and return role row
    const ensureRole = async (name, description) => {
      const [existing] = await db.select().from(roles).where(eq(roles.name, name)).limit(1);
      if (existing) return existing;
      const [newRole] = await db.insert(roles).values({ name, description }).returning();
      console.log(`✓ Role '${name}' created`);
      return newRole;
    };

    // ========== ROLES ==========
    console.log('→ Creating roles...');
    await insertIfEmpty(
      roles,
      [
        { name: 'admin', description: 'Administrator with full access' },
        { name: 'cashier', description: 'Cashier role with limited access' },
      ],
      'Roles'
    );
    // جميع الصلاحيات المتاحة في النظام - الأدمن يحصل على كل شيء
    const permissionsList = {
      users: ['view', 'create', 'read', 'update', 'delete'],
      permissions: ['view', 'create', 'read', 'update', 'delete'],
      roles: ['view', 'create', 'read', 'update', 'delete'],
      customers: ['view', 'create', 'read', 'update', 'delete'],
      products: ['view', 'create', 'read', 'update', 'delete'],
      sales: ['view', 'create', 'read', 'update', 'delete'],
      categories: ['view', 'create', 'read', 'update', 'delete'],
      reports: ['view', 'read'],
      dashboard: ['view', 'read'],
      settings: ['view', 'read', 'update', 'create', 'delete'],
    };

    // صلاحيات الكاشير - محددة بدقة وفقاً للمتطلبات
    const cashierPermissions = {
      // الإعدادات: القراءة والعرض فقط (بدون تعديل أو حذف)
      settings: ['view', 'read'],

      // الأصناف: جميع الصلاحيات الكاملة (ملاحظة: حذف مقتصر على الأدمن فقط، سيتم سحب delete لاحقاً)
      categories: ['view', 'create', 'read', 'update', 'delete'],

      // المنتجات: العرض والقراءة والتعديل (بدون إنشاء أو حذف)
      products: ['view', 'read', 'update'],

      // المبيعات: جميع الصلاحيات ما عدا الحذف
      sales: ['view', 'create', 'read', 'update'],

      // العملاء: جميع الصلاحيات ما عدا الحذف
      customers: ['view', 'create', 'read', 'update'],

      // لوحة التحكم: الوصول الكامل مع صلاحية القراءة فقط
      dashboard: ['view', 'read'],

      // التقارير: العرض والقراءة فقط
      reports: ['view', 'read'],
    };

    // ========== PERMISSIONS ==========
    console.log('\n→ Creating permissions...');
    // Build full permission objects and insert missing ones
    const allPermissionObjs = Object.entries(permissionsList).flatMap(([resource, actions]) =>
      actions.map((action) => ({
        resource,
        action,
        name: `${action}:${resource}`,
        description: `${action.charAt(0).toUpperCase() + action.slice(1)} permission for ${resource}`,
      }))
    );

    // Existing permission names
    const existingPermissions = await db.select({ name: permissions.name }).from(permissions).all();
    const existingNames = new Set(existingPermissions.map((p) => p.name));

    const toInsert = allPermissionObjs.filter((p) => !existingNames.has(p.name));
    if (toInsert.length) {
      await db.insert(permissions).values(toInsert);
      console.log(`✓ Inserted ${toInsert.length} new permissions`);
    } else {
      console.log('↩️ No new permissions to insert');
    }

    // ========== ROLES ↔ PERMISSIONS ==========
    console.log('\n→ Assigning permissions to roles...');

    // Ensure roles exist
    const adminRole = await ensureRole('admin', 'Administrator with full access');
    const cashierRole = await ensureRole('cashier', 'Cashier role with limited access');

    // Refresh all permissions
    const allPerms = await db.select().from(permissions).all();

    // Helper to get permission ids by name
    const permIdsByName = (names) =>
      allPerms.filter((p) => names.includes(p.name)).map((p) => p.id);

    // Build admin permission names (all permissions)
    const adminPermissionNames = allPerms.map((p) => p.name);

    // For cashier: gather names from cashierPermissions mapping
    // but ensure delete is reserved for admin only
    const cashierPermissionNames = Object.entries(cashierPermissions).flatMap(
      ([resource, actions]) =>
        actions
          .filter((action) => action !== 'delete') // Admin-only deletion enforcement
          .map((action) => `${action}:${resource}`)
    );

    // Remove duplicates and ensure names are present in allPerms
    const distinctCashierPerms = Array.from(new Set(cashierPermissionNames)).filter((name) =>
      allPerms.some((p) => p.name === name)
    );

    // Delete existing mappings and re-insert for safety (idempotency)
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, adminRole.id));
    const adminValues = permIdsByName(adminPermissionNames).map((permissionId) => ({
      roleId: adminRole.id,
      permissionId,
    }));
    if (adminValues.length) await db.insert(rolePermissions).values(adminValues);

    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, cashierRole.id));
    const cashierValues = permIdsByName(distinctCashierPerms).map((permissionId) => ({
      roleId: cashierRole.id,
      permissionId,
    }));
    if (cashierValues.length) await db.insert(rolePermissions).values(cashierValues);

    console.log(
      '✓ Role-permission mapping completed (admin: all, cashier: limited without delete)'
    );

    // ========== DEFAULT CUSTOMER ==========
    console.log('\n→ Creating default customer...');
    await insertIfEmpty(
      customers,
      [
        {
          name: 'عميل افتراضي',
        },
      ],
      'Customers'
    );

    // ========== CURRENCY SETTINGS ==========
    console.log('\n→ Creating currency settings...');
    const settingsCount = await countTable(settings);
    if (settingsCount === 0) {
      await db.insert(settings).values([
        {
          key: 'currency.default',
          value: 'IQD',
          description: 'العملة الافتراضية للنظام',
        },
        {
          key: 'currency.usd_rate',
          value: '1500',
          description: 'سعر صرف الدولار الأمريكي مقابل الدينار العراقي',
        },
        {
          key: 'currency.iqd_rate',
          value: '1',
          description: 'سعر صرف الدينار العراقي (العملة المرجعية)',
        },
      ]);
      console.log('✓ Currency settings inserted');
    } else {
      console.log('↩️ Settings already exist');
    }

    // Save DB to disk
    saveDatabase();

    console.log('\n🌱 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
    console.error(error.stack);
  }
}

seed();
