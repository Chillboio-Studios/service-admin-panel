"use server";

import { getScopedUser } from "@/lib/auth";
import { RBAC_PERMISSION_MODERATION_DISCOVER } from "@/lib/auth/rbacInternal";
import { createChangelog } from "@/lib/core";
import { ChangeLogDocument } from "@/lib/db/types";
import { col } from "@/lib/db";

export interface DiscoverRequest {
  _id: string;
  server_id: string;
  server_name: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  created_at: Date;
  created_by: string;
}

export async function fetchDiscoverRequestsAction() {
  await getScopedUser(RBAC_PERMISSION_MODERATION_DISCOVER);

  return col("discover_requests")
    .find({})
    .sort({ created_at: -1 })
    .toArray();
}

export async function approveDiscoverRequest(requestId: string) {
  const userEmail = await getScopedUser(
    RBAC_PERMISSION_MODERATION_DISCOVER,
  );

  await col("discover_requests").updateOne(
    { _id: requestId },
    {
      $set: {
        status: "approved",
        reviewed_by: userEmail,
        reviewed_at: new Date(),
      },
    },
  );

  await createChangelog(userEmail, {
    object: {
      type: "DiscoverRequest" as const,
      id: requestId,
    },
    type: "discover/approve" as const,
  } as Omit<ChangeLogDocument, "_id" | "userEmail">);
}

export async function rejectDiscoverRequest(
  requestId: string,
  reason: string,
) {
  const userEmail = await getScopedUser(
    RBAC_PERMISSION_MODERATION_DISCOVER,
  );

  await col("discover_requests").updateOne(
    { _id: requestId },
    {
      $set: {
        status: "rejected",
        rejection_reason: reason,
        reviewed_by: userEmail,
        reviewed_at: new Date(),
      },
    },
  );

  await createChangelog(userEmail, {
    object: {
      type: "DiscoverRequest" as const,
      id: requestId,
    },
    type: "discover/reject" as const,
    reason,
  } as Omit<ChangeLogDocument, "_id" | "userEmail">);
}
