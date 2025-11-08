import db, { saveDatabase } from '../db.js';
import { users, activityLogs } from '../models/index.js';
import { eq, like, and } from 'drizzle-orm';
import { hashPassword } from '../utils/helpers.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

export class UserService {
  async list({ page = 1, limit = 10, search, roleId, isActive }) {
    const offset = (page - 1) * limit;
    let where;
    if (search) {
      where = like(users.username, `%${search}%`);
    }
    if (typeof roleId !== 'undefined') {
      where = where ? and(where, eq(users.roleId, roleId)) : eq(users.roleId, roleId);
    }
    if (typeof isActive !== 'undefined') {
      where = where ? and(where, eq(users.isActive, !!isActive)) : eq(users.isActive, !!isActive);
    }

    const data = await db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        phone: users.phone,
        isActive: users.isActive,
        roleId: users.roleId,
      })
      .from(users)
      .where(where)
      .limit(limit)
      .offset(offset);

    return { data, page, limit };
  }

  async getById(id) {
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        phone: users.phone,
        isActive: users.isActive,
        roleId: users.roleId,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) throw new NotFoundError('User');
    return user;
  }

  async create(data, actorId) {
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.username, data.username))
      .limit(1);
    if (existing) throw new ConflictError('Username already exists');

    const hashed = await hashPassword(data.password);
    const [user] = await db
      .insert(users)
      .values({
        username: data.username,
        password: hashed,
        fullName: data.fullName,
        phone: data.phone,
        roleId: data.roleId,
        isActive: true,
      })
      .returning();

    await db.insert(activityLogs).values({
      userId: actorId,
      action: 'create',
      resource: 'users',
      resourceId: user.id,
      details: `Created user ${user.username}`,
    });

    saveDatabase();

    return this.getById(user.id);
  }

  async update(id, data, actorId) {
    await this.getById(id);
    await db
      .update(users)
      .set({
        fullName: data.fullName,
        phone: data.phone,
        roleId: data.roleId,
        isActive: data.isActive,
      })
      .where(eq(users.id, id));

    await db.insert(activityLogs).values({
      userId: actorId,
      action: 'update',
      resource: 'users',
      resourceId: id,
      details: `Updated user ${id}`,
    });

    saveDatabase();

    return this.getById(id);
  }

  async resetPassword(id, newPassword, actorId) {
    await this.getById(id);
    const hashed = await hashPassword(newPassword);
    await db.update(users).set({ password: hashed }).where(eq(users.id, id));

    await db.insert(activityLogs).values({
      userId: actorId,
      action: 'reset_password',
      resource: 'users',
      resourceId: id,
      details: `Password reset for user ${id}`,
    });

    saveDatabase();
    return { success: true };
  }

  async remove(id, actorId) {
    await this.getById(id);
    await db.update(users).set({ isActive: false }).where(eq(users.id, id));
    await db.insert(activityLogs).values({
      userId: actorId,
      action: 'deactivate',
      resource: 'users',
      resourceId: id,
      details: `Deactivated user ${id}`,
    });

    saveDatabase();
    return { success: true };
  }

  async checkFirstUser() {
    const count = await db.select().from(users).limit(1);
    return count.length > 0;
  }
}
