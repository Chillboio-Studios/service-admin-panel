"use server";

import { getScopedUser } from "@/lib/auth";
import { RBAC_PERMISSION_HR_MEMBER_CREATE } from "@/lib/auth/rbacInternal";
import { createCollectionFn } from "@/lib/database";
import { Hr } from "@/lib/database/hr";
import { ulid } from "ulid";

const positionsCol = createCollectionFn<Hr["Position"]>(
  "revolt_hr",
  "positions",
);
const rolesCol = createCollectionFn<Hr["Role"]>("revolt_hr", "roles");

export async function createPosition(
  title: string,
  roleIds: string[],
  color?: string,
) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_HR_MEMBER_CREATE);

  const position: Hr["Position"] = {
    _id: ulid(),
    title,
    roles: roleIds,
    color: color as any,
  };

  await positionsCol().insertOne(position);
  return position;
}

export async function updatePosition(
  positionId: string,
  updates: Partial<Hr["Position"]>,
) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_HR_MEMBER_CREATE);

  await positionsCol().updateOne(
    { _id: positionId },
    { $set: updates },
  );

  return { success: true };
}

export async function deletePosition(positionId: string) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_HR_MEMBER_CREATE);

  await positionsCol().deleteOne({ _id: positionId });

  return { success: true };
}

export async function getAllPositions() {
  const userEmail = await getScopedUser(RBAC_PERMISSION_HR_MEMBER_CREATE);

  try {
    return await positionsCol().find({}).toArray();
  } catch (error) {
    console.error("Error fetching positions:", error);
    return [];
  }
}

export async function createRole(
  name: string,
  permissions: string[],
  color?: string,
) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_HR_MEMBER_CREATE);

  const role: Hr["Role"] = {
    _id: ulid(),
    name,
    permissions,
    color: color as any,
  };

  await rolesCol().insertOne(role);
  return role;
}

export async function updateRole(
  roleId: string,
  updates: Partial<Hr["Role"]>,
) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_HR_MEMBER_CREATE);

  await rolesCol().updateOne(
    { _id: roleId },
    { $set: updates },
  );

  return { success: true };
}

export async function deleteRole(roleId: string) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_HR_MEMBER_CREATE);

  await rolesCol().deleteOne({ _id: roleId });

  return { success: true };
}

export async function getAllRoles() {
  const userEmail = await getScopedUser(RBAC_PERMISSION_HR_MEMBER_CREATE);

  try {
    return await rolesCol().find({}).toArray();
  } catch (error) {
    console.error("Error fetching roles:", error);
    return [];
  }
}

export async function getPositionWithRoles(positionId: string) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_HR_MEMBER_CREATE);

  try {
    const position = await positionsCol().findOne({ _id: positionId });
    if (!position) return null;

    const roles = position.roles
      ? await rolesCol()
          .find({ _id: { $in: position.roles } })
          .toArray()
      : [];

    return { ...position, roleDetails: roles };
  } catch (error) {
    console.error("Error fetching position with roles:", error);
    return null;
  }
}

export async function getRolePermissions(roleId: string) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_HR_MEMBER_CREATE);

  try {
    const role = await rolesCol().findOne({ _id: roleId });
    return role?.permissions || [];
  } catch (error) {
    console.error("Error fetching role permissions:", error);
    return [];
  }
}

export async function exportPositionsAndRolesAsJSON() {
  const userEmail = await getScopedUser(RBAC_PERMISSION_HR_MEMBER_CREATE);

  try {
    const [positions, roles] = await Promise.all([
      positionsCol().find({}).toArray(),
      rolesCol().find({}).toArray(),
    ]);

    return JSON.stringify({ positions, roles }, null, 2);
  } catch (error) {
    console.error("Error exporting:", error);
    throw error;
  }
}

export async function getOrganizationStructure() {
  const userEmail = await getScopedUser(RBAC_PERMISSION_HR_MEMBER_CREATE);

  try {
    const positions = await positionsCol().find({}).toArray();
    const roles = await rolesCol().find({}).toArray();

    return {
      positions: positions.map((p: any) => ({
        ...p,
        roleDetails: roles.filter((r: any) => p.roles.includes(r._id)),
      })),
      roles,
    };
  } catch (error) {
    console.error("Error fetching organization structure:", error);
    return { positions: [], roles: [] };
  }
}
