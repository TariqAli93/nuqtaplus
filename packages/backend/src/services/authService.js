import db, { saveDatabase } from '../db.js';
import { users, roles, activityLogs, rolePermissions, permissions } from '../models/index.js';
import { hashPassword, comparePassword } from '../utils/helpers.js';
import { AuthenticationError, NotFoundError, ConflictError } from '../utils/errors.js';
import { eq } from 'drizzle-orm';

export class AuthService {
  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @param {Object} fastify - Fastify instance for JWT signing
   * @returns {Promise<Object>} Created user and JWT token
   */
  async register(userData, fastify) {
    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, userData.username))
      .limit(1);

    if (existingUser) {
      throw new ConflictError('Username already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword,
      })
      .returning();

    // Generate token
    const token = fastify.jwt.sign({
      id: newUser.id,
      username: newUser.username,
      roleId: newUser.roleId,
    });

    // Remove password from response
    const userWithoutPassword = { ...newUser };
    delete userWithoutPassword.password;

    saveDatabase();

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * User login with credentials validation
   * @param {Object} credentials - Login credentials
   * @param {Object} fastify - Fastify instance for JWT signing
   * @returns {Promise<Object>} User data and JWT token
   */
  async login(credentials, fastify) {
    // Find user by username
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, credentials.username))
      .limit(1);

    if (!user) {
      throw new AuthenticationError('Invalid username or password');
    }

    // Check if user account is active
    if (!user.isActive) {
      throw new AuthenticationError('Account is inactive');
    }

    // Verify password
    const isValidPassword = await comparePassword(credentials.password, user.password);

    if (!isValidPassword) {
      throw new AuthenticationError('Invalid username or password');
    }

    // Get user role
    const [role] = await db.select().from(roles).where(eq(roles.id, user.roleId)).limit(1);

    if (!role) {
      throw new NotFoundError('User role not found');
    }

    // Get role permissions
    const rolePerms = await db
      .select({
        permissionName: permissions.name,
      })
      .from(rolePermissions)
      .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, role.id));

    // Attach permissions to user object
    user.permissions = rolePerms.map((rp) => rp.permissionName);
    user.role = role;

    // Generate JWT token
    const token = fastify.jwt.sign({
      id: user.id,
      username: user.username,
      roleId: user.roleId,
    });

    // Log last login activity
    await db.insert(activityLogs).values({
      userId: user.id,
      action: 'login',
      resource: 'auth',
      resourceId: null,
      description: 'User logged in successfully',
      createdAt: new Date().toISOString(),
    });

    // Save database changes
    saveDatabase();

    // Remove sensitive data from response
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;

    return {
      user: {
        ...userWithoutPassword,
        role: {
          id: role.id,
          name: role.name,
        },
      },
      token,
    };
  }

  /**
   * Get user profile by ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} User profile data
   */
  async getProfile(userId) {
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        phone: users.phone,
        isActive: users.isActive,
        createdAt: users.createdAt,
        roleId: users.roleId,
        roleName: roles.name,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundError('User');
    }

    // Get user permissions
    const rolePerms = await db
      .select({
        permissionName: permissions.name,
      })
      .from(rolePermissions)
      .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, user.roleId));

    user.permissions = rolePerms.map((rp) => rp.permissionName);

    // Structure role object
    user.role = {
      id: user.roleId,
      name: user.roleName,
    };

    // Remove temporary fields
    delete user.roleName;

    return user;
  }

  /**
   * Change user password
   * @param {number} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async changePassword(userId, currentPassword, newPassword) {
    // Get user
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      throw new NotFoundError('User');
    }

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.password);

    if (!isValidPassword) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));

    saveDatabase();
  }

  /**
   * Create first user (admin) during initial setup
   * @param {Object} userData - User data
   * @param {Object} fastify - Fastify instance
   * @returns {Promise<Object>} Created user and token
   */
  async createFirstUser(userData, fastify) {
    // Check if any users exist
    const existingUserCount = await db.select().from(users).limit(1);
    if (existingUserCount.length > 0) {
      throw new ConflictError('Users already exist');
    }

    await import('../seed.js');

    // Get admin role
    const [adminRole] = await db.select().from(roles).where(eq(roles.name, 'admin')).limit(1);
    if (!adminRole) {
      throw new Error('Admin role not found. Seed data might be missing.');
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create admin user
    const [newUser] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword,
        roleId: adminRole.id,
        isActive: true,
      })
      .returning();

    // Generate token
    const token = fastify.jwt.sign({
      id: newUser.id,
      username: newUser.username,
      roleId: newUser.roleId,
    });

    // Remove password from response
    const userWithoutPassword = { ...newUser };
    delete userWithoutPassword.password;

    saveDatabase();

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async getInitialSetupInfo() {
    // check if any users exist or any user isActive true
    const existingUserCount = await db
      .select()
      .from(users)
      .where(eq(users.isActive, true))
      .limit(1);
    return {
      isFirstRun: existingUserCount.length === 0,
    };
  }
}
