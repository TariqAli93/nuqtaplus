import db, { saveDatabase } from '../db.js';
import { permissions, activityLogs } from '../models/index.js';
import { eq, like } from 'drizzle-orm';
import { ConflictError, NotFoundError } from '../utils/errors.js';

export class PermissionService {
  async list({ search }) {
    const where = search ? like(permissions.name, `%${search}%`) : undefined;
    const data = await db.select().from(permissions).where(where);
    return data;
  }

  async getById(id) {
    const [perm] = await db.select().from(permissions).where(eq(permissions.id, id)).limit(1);
    if (!perm) throw new NotFoundError('Permission');
    return perm;
  }

  async create(data, actorId) {
    const [existing] = await db
      .select()
      .from(permissions)
      .where(eq(permissions.name, data.name))
      .limit(1);
    if (existing) throw new ConflictError('Permission name already exists');
    const [perm] = await db
      .insert(permissions)
      .values({
        name: data.name,
        resource: data.resource,
        action: data.action,
        description: data.description,
      })
      .returning();
    await db.insert(activityLogs).values({
      userId: actorId,
      action: 'create',
      resource: 'permissions',
      resourceId: perm.id,
      details: `Created permission ${perm.name}`,
    });

    saveDatabase();
    return perm;
  }

  async update(id, data, actorId) {
    await this.getById(id);
    await db
      .update(permissions)
      .set({
        name: data.name,
        resource: data.resource,
        action: data.action,
        description: data.description,
      })
      .where(eq(permissions.id, id));
    await db.insert(activityLogs).values({
      userId: actorId,
      action: 'update',
      resource: 'permissions',
      resourceId: id,
      details: `Updated permission ${id}`,
    });

    saveDatabase();
    return this.getById(id);
  }

  async remove(id, actorId) {
    await this.getById(id);
    await db.delete(permissions).where(eq(permissions.id, id));
    await db.insert(activityLogs).values({
      userId: actorId,
      action: 'delete',
      resource: 'permissions',
      resourceId: id,
      details: `Deleted permission ${id}`,
    });

    saveDatabase();
    return { success: true };
  }
}
