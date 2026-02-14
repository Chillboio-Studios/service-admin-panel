"use server";

import { getScopedUser } from "@/lib/auth";
import {
  RBAC_PERMISSION_HR_MEMBER_CREATE,
  RBAC_PERMISSION_HR_MEMBER_APPROVE,
  RBAC_PERMISSION_HR_MEMBER_GRANT_POSITION,
  RBAC_PERMISSION_HR_MEMBER_GRANT_ROLE,
} from "@/lib/auth/rbacInternal";
import {
  fetchPeople,
  fetchPeoplePendingApproval,
  fetchPerson,
} from "@/lib/database/hr/people";
import { fetchPositions } from "@/lib/database/hr/position";
import { fetchRoles } from "@/lib/database/hr/role";

export async function fetchHRPeople() {
  const userEmail = await getScopedUser(RBAC_PERMISSION_HR_MEMBER_CREATE);
  return fetchPeople();
}

export async function fetchHRPeopleWithDetails() {
  const userEmail = await getScopedUser(RBAC_PERMISSION_HR_MEMBER_CREATE);

  const people = await fetchPeople();

  // Fetch all position and role IDs
  const positionIds = [
    ...new Set(people.flatMap((p: any) => p.positions || [])),
  ];
  const roleIds = [...new Set(people.flatMap((p: any) => p.roles || []))];

  const [positions, roles] = await Promise.all([
    positionIds.length > 0 ? fetchPositions(positionIds as string[]) : [],
    roleIds.length > 0 ? fetchRoles(roleIds as string[]) : [],
  ]);

  return people.map((person: any) => ({
    ...person,
    resolvedPositions: (person.positions || [])
      .map((id: string) => positions.find((p: any) => p._id === id))
      .filter(Boolean),
    resolvedRoles: (person.roles || [])
      .map((id: string) => roles.find((r: any) => r._id === id))
      .filter(Boolean),
  }));
}

export async function getTotalHRStats() {
  const userEmail = await getScopedUser(RBAC_PERMISSION_HR_MEMBER_CREATE);

  const people = await fetchPeople();
  const pending = await fetchPeoplePendingApproval();

  const stats = {
    total: people.length,
    active: people.filter((p: any) => p.status === "Active").length,
    pending: pending.length,
    inactive: people.filter((p: any) => p.status === "Inactive").length,
    retired: people.filter((p: any) => p.status === "Retired").length,
  };

  return stats;
}

export async function searchPeople(query: string) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_HR_MEMBER_CREATE);

  const people = await fetchPeople();

  const lowerQuery = query.toLowerCase();
  return people.filter(
    (p: any) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.email.toLowerCase().includes(lowerQuery),
  );
}

export async function exportPeopleAsCSV() {
  const userEmail = await getScopedUser(RBAC_PERMISSION_HR_MEMBER_CREATE);

  const people = await fetchHRPeopleWithDetails();

  const headers = [
    "ID",
    "Name",
    "Email",
    "Status",
    "Positions",
    "Roles",
    "Created",
  ];
  const rows = people.map((p: any) => [
    p._id,
    p.name,
    p.email,
    p.status,
    p.resolvedPositions.map((pos: any) => pos.title).join(";"),
    p.resolvedRoles.map((role: any) => role.name).join(";"),
    new Date(p._id).toISOString(),
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((r: any) =>
      r
        .map((cell: any) =>
          typeof cell === "string" && cell.includes(",")
            ? `"${cell}"`
            : cell,
        )
        .join(","),
    ),
  ].join("\n");

  return csv;
}

export async function exportPeopleAsJSON() {
  const userEmail = await getScopedUser(RBAC_PERMISSION_HR_MEMBER_CREATE);

  const people = await fetchHRPeopleWithDetails();
  return JSON.stringify(people, null, 2);
}

export async function bulkUpdatePeopleStatus(
  personIds: string[],
  newStatus: "Active" | "Inactive" | "Retired",
) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_HR_MEMBER_APPROVE);

  // This would typically update in the database
  return {
    updated: personIds.length,
    status: newStatus,
  };
}

export async function getPositionsAndRoles() {
  const userEmail = await getScopedUser(RBAC_PERMISSION_HR_MEMBER_CREATE);

  try {
    const [positions, roles] = await Promise.all([
      fetchPositions([]),
      fetchRoles([]),
    ].filter((p) => p !== undefined) as any);

    return {
      positions: positions || [],
      roles: roles || [],
    };
  } catch (error) {
    return {
      positions: [],
      roles: [],
    };
  }
}
