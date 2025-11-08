import db from './db.js';
import {
  roles,
  permissions,
  rolePermissions,
  categories,
  products,
  customers,
  settings,
} from './models/index.js';
import { sql } from 'drizzle-orm';

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

    // Helper: Insert if table empty
    const insertIfEmpty = async (table, data, label) => {
      const count = await countTable(table);
      if (count === 0) {
        await db.insert(table).values(data);
        console.log(`✓ ${label} inserted`);
      } else {
        console.log(`↩️ ${label} already exist`);
      }
    };

    // ========== ROLES ==========
    console.log('→ Creating roles...');
    await insertIfEmpty(
      roles,
      [
        { name: 'admin', description: 'Administrator with full access' },
        { name: 'manager', description: 'Manager with limited access' },
        { name: 'sales', description: 'Sales staff' },
      ],
      'Roles'
    );
    const permissionsList = {
      users: ['manage', 'create', 'read', 'update', 'delete'],
      permissions: ['manage', 'create', 'read', 'update', 'delete'],
      roles: ['manage', 'create', 'read', 'update', 'delete'],
      customers: ['manage', 'create', 'read', 'update', 'delete'],
      products: ['manage', 'create', 'read', 'update', 'delete'],
      sales: ['manage', 'create', 'read', 'update', 'delete'],
      categories: ['manage', 'create', 'read', 'update', 'delete'],
      reports: ['read'],
      dashboard: ['read'],
    };
    // ========== PERMISSIONS ==========
    console.log('\n→ Creating permissions...');
    await insertIfEmpty(
      permissions,
      Object.entries(permissionsList).flatMap(([resource, actions]) =>
        actions.map((action) => ({
          resource,
          action,
          name: `${action}:${resource}`,
          description: `${action.charAt(0).toUpperCase() + action.slice(1)} permission for ${resource}`,
        }))
      ),
      'Permissions'
    );

    // ========== ROLES ↔ PERMISSIONS ==========
    console.log('\n→ Assigning permissions to roles...');

    const allRoles = await db.select().from(roles).all();
    const allPerms = await db.select().from(permissions).all();
    const rolePermCount = await countTable(rolePermissions);

    if (rolePermCount === 0) {
      const adminRole = allRoles.find((r) => r.name === 'admin');
      const managerRole = allRoles.find((r) => r.name === 'manager');
      const salesRole = allRoles.find((r) => r.name === 'sales');

      const adminPerms = allPerms.map((p) => ({
        roleId: adminRole.id,
        permissionId: p.id,
      }));

      const managerPerms = allPerms
        .filter((p) => p.resource !== 'users' && p.action !== 'delete')
        .map((p) => ({
          roleId: managerRole.id,
          permissionId: p.id,
        }));

      const salesPerms = allPerms
        .filter(
          (p) => ['sales', 'products', 'customers'].includes(p.resource) && p.action !== 'delete'
        )
        .map((p) => ({
          roleId: salesRole.id,
          permissionId: p.id,
        }));

      await db.insert(rolePermissions).values([...adminPerms, ...managerPerms, ...salesPerms]);
      console.log('✓ Role-permission mapping completed');
    } else {
      console.log('↩️ Role-permissions already exist');
    }

    // categories, products, customers, and sales seeding can be added here

    // categories
    console.log('\n→ Seeding categories...');
    await insertIfEmpty(
      categories,
      [
        { name: 'Electronics', description: 'Electronic gadgets and devices' },
        { name: 'Clothing', description: 'Apparel and garments' },
        { name: 'Books', description: 'Printed and digital books' },
      ],
      'Categories'
    );

    // products
    console.log('\n→ Seeding products...');
    const allCategories = await db.select().from(categories).all();
    const electronicsCategory = allCategories.find((c) => c.name === 'Electronics');
    const clothingCategory = allCategories.find((c) => c.name === 'Clothing');
    const booksCategory = allCategories.find((c) => c.name === 'Books');

    //     name
    // sku
    // barcode
    // categoryId
    // description
    // costPrice
    // sellingPrice
    // stock
    // minStock

    await insertIfEmpty(
      products,
      [
        {
          name: 'Smartphone',
          sku: 'ELEC-001',
          barcode: '1234567890123',
          categoryId: electronicsCategory.id,
          description: 'Latest model smartphone with advanced features',
          costPrice: 300,
          sellingPrice: 500,
          stock: 50,
          minStock: 5,
        },
        {
          name: 'Jeans',
          sku: 'CLOTH-001',
          barcode: '2345678901234',
          categoryId: clothingCategory.id,
          description: 'Comfortable blue jeans',
          costPrice: 20,
          sellingPrice: 40,
          stock: 100,
          minStock: 10,
        },
        {
          name: 'Science Fiction Novel',
          sku: 'BOOK-001',
          barcode: '3456789012345',
          categoryId: booksCategory.id,
          description: 'A thrilling science fiction adventure',
          costPrice: 5,
          sellingPrice: 15,
          stock: 200,
          minStock: 20,
        },
      ],
      'Products'
    );

    // customers
    console.log('\n→ Seeding customers...');
    await insertIfEmpty(
      customers,
      [
        {
          name: 'John Doe',
          address: '123 Main St, Anytown, USA',
          city: 'Anytown',
          phone: '123-456-7890',
        },
        {
          name: 'Jane Smith',
          address: '456 Elm St, Othertown, USA',
          city: 'Othertown',
          phone: '987-654-3210',
        },
        {
          name: 'Alice Johnson',
          address: '789 Oak St, Sometown, USA',
          city: 'Sometown',
          phone: '555-555-5555',
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

    console.log('\n🌱 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
    console.error(error.stack);
  }
}

seed();
