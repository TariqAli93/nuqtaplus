import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

// Layouts
import MainLayout from '@/layouts/MainLayout.vue';
import AuthLayout from '@/layouts/AuthLayout.vue';

// Views
import Login from '@/views/auth/Login.vue';
import Dashboard from '@/views/Dashboard.vue';
import Customers from '@/views/customers/Customers.vue';
import CustomerForm from '@/views/customers/CustomerForm.vue';
import Products from '@/views/products/Products.vue';
import ProductForm from '@/views/products/ProductForm.vue';
import Categories from '@/views/categories/Categories.vue';
import Sales from '@/views/sales/Sales.vue';
import NewSale from '@/views/sales/NewSale.vue';
import SaleDetails from '@/views/sales/SaleDetails.vue';
import Reports from '@/views/Reports.vue';
import About from '@/views/About.vue';
import Users from '@/views/users/Users.vue';
import Roles from '@/views/roles/Roles.vue';
import Permissions from '@/views/permissions/Permissions.vue';
import Forbidden from '@/views/errors/Forbidden.vue'; // 👈 صفحة 403

const routes = [
  {
    path: '/auth',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        name: 'Login',
        component: Login,
        meta: { requiresGuest: true },
      },
    ],
  },
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'Dashboard', component: Dashboard, meta: { permission: 'read:dashboard' } },
      {
        path: 'customers',
        name: 'Customers',
        component: Customers,
        meta: { permission: 'read:customers' },
      },
      {
        path: 'customers/new',
        name: 'NewCustomer',
        component: CustomerForm,
        meta: { permission: ['create:customers', 'manage:customers'] },
      },
      {
        path: 'customers/:id/edit',
        name: 'EditCustomer',
        component: CustomerForm,
        meta: { permission: ['update:customers', 'manage:customers'] },
      },
      {
        path: 'products',
        name: 'Products',
        component: Products,
        meta: { permission: 'read:products' },
      },
      {
        path: 'products/new',
        name: 'NewProduct',
        component: ProductForm,
        meta: { permission: ['create:products', 'manage:products'] },
      },
      {
        path: 'products/:id/edit',
        name: 'EditProduct',
        component: ProductForm,
        meta: { permission: ['update:products', 'manage:products'] },
      },
      {
        path: 'categories',
        name: 'Categories',
        component: Categories,
        meta: { permission: 'read:categories' },
      },
      { path: 'sales', name: 'Sales', component: Sales, meta: { permission: 'read:sales' } },
      {
        path: 'sales/new',
        name: 'NewSale',
        component: NewSale,
        meta: { permission: ['create:sales', 'manage:sales'] },
      },
      {
        path: 'sales/:id',
        name: 'SaleDetails',
        component: SaleDetails,
        meta: { permission: 'read:sales' },
      },
      {
        path: 'reports',
        name: 'Reports',
        component: Reports,
        meta: { permission: 'read:reports' },
      },
      { path: 'users', name: 'Users', component: Users, meta: { permission: 'read:users' } },
      { path: 'roles', name: 'Roles', component: Roles, meta: { permission: 'read:roles' } },
      {
        path: 'permissions',
        name: 'Permissions',
        component: Permissions,
        meta: { permission: 'read:permissions' },
      },
      { path: 'about', name: 'About', component: About },
      { path: 'forbidden', name: 'Forbidden', component: Forbidden }, // 👈 صفحة 403
    ],
  },
];

const router = createRouter({
  history: import.meta.env.PROD ? createWebHashHistory() : createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // ✅ تحقق من تحميل المستخدم والصلاحيات بعد تسجيل الدخول
  if (authStore.isAuthenticated && !authStore.user?.permissions.length) {
    try {
      await authStore.fetchMe?.();
    } catch (e) {
      console.warn('⚠️ Failed to fetch user permissions:', e);
    }
  }

  // 1️⃣ تسجيل الدخول
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'Login' });
  }

  // 2️⃣ التحقق من الصلاحيات
  if (to.meta.permission) {
    const required = Array.isArray(to.meta.permission) ? to.meta.permission : [to.meta.permission];
    const hasPermission = authStore.hasPermission(required);

    if (!hasPermission) {
      return next({ name: 'Forbidden' });
    }
  }

  // 3️⃣ منع فتح صفحات guest للمستخدمين المسجلين
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return next({ name: 'Dashboard' });
  }

  next();
});

export default router;
