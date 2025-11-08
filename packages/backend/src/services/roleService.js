import db, { saveDatabase } from '../db.js';
import { roles, permissions, rolePermissions, activityLogs } from '../models/index.js';
import { eq, inArray } from 'drizzle-orm';
import { NotFoundError, ConflictError } from '../utils/errors.js';

export class RoleService {
  async list() {
    const data = await db.select().from(roles);
    return data;
  }

  async create(data, actorId) {
    const [existing] = await db.select().from(roles).where(eq(roles.name, data.name)).limit(1);
    if (existing) throw new ConflictError('Role name already exists');
    const [role] = await db
      .insert(roles)
      .values({ name: data.name, description: data.description })
      .returning();
    await db.insert(activityLogs).values({
      userId: actorId,
      action: 'create',
      resource: 'roles',
      resourceId: role.id,
      details: `Created role ${role.name}`,
    });

    saveDatabase();
    return role;
  }

  async update(id, data, actorId) {
    await this.getById(id);
    await db
      .update(roles)
      .set({ name: data.name, description: data.description })
      .where(eq(roles.id, id));
    await db.insert(activityLogs).values({
      userId: actorId,
      action: 'update',
      resource: 'roles',
      resourceId: id,
      details: `Updated role ${id}`,
    });

    saveDatabase();
    return this.getById(id);
  }

  async getById(id) {
    const [role] = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
    if (!role) throw new NotFoundError('Role');
    return role;
  }

  async remove(id, actorId) {
    await this.getById(id);
    // Safe delete not implemented; in production prefer soft delete
    await db.delete(roles).where(eq(roles.id, id));
    await db.insert(activityLogs).values({
      userId: actorId,
      action: 'delete',
      resource: 'roles',
      resourceId: id,
      details: `Deleted role ${id}`,
    });

    saveDatabase();
    return { success: true };
  }

  async assignPermissions(roleId, permissionIds, actorId) {
    await this.getById(roleId);
    const perms = await db.select().from(permissions).where(inArray(permissions.id, permissionIds));
    const values = perms.map((p) => ({ roleId, permissionId: p.id }));
    // Clear existing then insert new mapping
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
    if (values.length) {
      await db.insert(rolePermissions).values(values);
    }
    await db.insert(activityLogs).values({
      userId: actorId,
      action: 'assign_permissions',
      resource: 'roles',
      resourceId: roleId,
      details: `Assigned ${values.length} permissions`,
    });

    saveDatabase();
    return { success: true };
  }

  async getRolePermissions(roleId) {
    await this.getById(roleId);
    const perms = await db
      .select({
        id: permissions.id,
        name: permissions.name,
        resource: permissions.resource,
        action: permissions.action,
      })
      .from(permissions)
      .innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
      .where(eq(rolePermissions.roleId, roleId));
    return perms;
  }
}
