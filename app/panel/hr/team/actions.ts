"use server";

import { getScopedUser } from "@/lib/auth";
import {
  RBAC_PERMISSION_HR_MEMBER_APPROVE,
  RBAC_PERMISSION_HR_MEMBER_CREATE,
  RBAC_PERMISSION_HR_MEMBER_GRANT_POSITION,
  RBAC_PERMISSION_HR_MEMBER_GRANT_ROLE,
} from "@/lib/auth/rbacInternal";
import {
  createPerson,
  deletePersonRequest,
  fetchPeople,
  fetchPeoplePendingApproval,
  fetchPerson,
  updatePersonApproved,
} from "@/lib/database/hr/people";
import { createChangelog } from "@/lib/core";

export async function fetchPeopleAction() {
  return fetchPeople();
}

export async function fetchPendingAction() {
  return fetchPeoplePendingApproval();
}

export async function createPersonAction(
  name: string,
  email: string,
  reason: string,
) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_HR_MEMBER_CREATE);

  await createPerson(name, email, reason, userEmail);

  await createChangelog(userEmail, {
    object: {
      type: "Person" as const,
      id: email,
    },
    type: "person/create" as const,
    reason,
  });
}

export async function approvePerson(personId: string) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_HR_MEMBER_APPROVE);

  const person = await fetchPerson({ _id: personId });
  if (!person) throw new Error("Person not found");
  if (person.status !== "Pending")
    throw new Error("Only pending members can be approved");

  await updatePersonApproved(personId);

  await createChangelog(userEmail, {
    object: {
      type: "Person" as const,
      id: person._id,
    },
    type: "person/approve" as const,
  });
}

export async function rejectPersonRequest(personId: string) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_HR_MEMBER_APPROVE);

  const person = await fetchPerson({ _id: personId });
  if (!person) throw new Error("Person not found");

  await deletePersonRequest(personId);

  await createChangelog(userEmail, {
    object: {
      type: "Person" as const,
      id: person._id,
    },
    type: "person/reject" as const,
  });
}

export async function grantPosition(
  personId: string,
  positionId: string,
) {
  const userEmail = await getScopedUser(
    RBAC_PERMISSION_HR_MEMBER_GRANT_POSITION(positionId),
  );

  // This would require additional database functions
  // Implementation depends on position data structure

  await createChangelog(userEmail, {
    object: {
      type: "Person" as const,
      id: personId,
    },
    type: "person/position" as const,
    positionId,
  });
}

export async function grantRole(personId: string, roleId: string) {
  const userEmail = await getScopedUser(
    RBAC_PERMISSION_HR_MEMBER_GRANT_ROLE(roleId),
  );

  // This would require additional database functions

  await createChangelog(userEmail, {
    object: {
      type: "Person" as const,
      id: personId,
    },
    type: "person/role" as const,
    roleId,
  });
}
