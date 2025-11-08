import db, { saveDatabase } from '../db.js';
import { users, roles, activityLogs, rolePermissions, permissions } from '../models/index.js';
import { hashPassword, comparePassword } from '../utils/helpers.js';
import { AuthenticationError, NotFoundError, ConflictError } from '../utils/errors.js';
import { eq } from 'drizzle-orm';
import config from '../config.js';

export class AuthService {
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

  async login(credentials, fastify) {
    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, credentials.username))
      .limit(1);

    if (!user) {
      throw new AuthenticationError('Invalid username or password');
    }

    if (!user.isActive) {
      throw new AuthenticationError('Account is inactive');
    }

    // Verify password
    const isValidPassword = await comparePassword(credentials.password, user.password);

    if (!isValidPassword) {
      throw new AuthenticationError('Invalid username or password');
    }

    // Get user role and join permissions
    const [role] = await db.select().from(roles).where(eq(roles.id, user.roleId)).limit(1);

    const rolePerms = await db
      .select({
        permissionName: permissions.name,
      })
      .from(rolePermissions)
      .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, role.id));

    user.permissions = rolePerms.map((rp) => rp.permissionName);

    // Generate token
    const token = fastify.jwt.sign({
      id: user.id,
      username: user.username,
      roleId: user.roleId,
    });

    console.log('Generated JWT token:', token);

    // Remove password from response
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;

    // Update last login and log activity
    await db
      .update(users)
      .set({ lastLoginAt: new Date().toISOString() })
      .where(eq(users.id, user.id));

    await db.insert(activityLogs).values({
      userId: user.id,
      action: 'login',
      resource: 'auth',
      details: 'User logged in',
    });

    saveDatabase();

    return {
      user: {
        ...userWithoutPassword,
        role: role?.name,
      },
      token,
    };
  }

  async getProfile(userId) {
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        phone: users.phone,
        isActive: users.isActive,
        createdAt: users.createdAt,
        role: roles.name,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }

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
