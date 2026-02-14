"use server";

import { getScopedUser } from "@/lib/auth";
import { RBAC_PERMISSION_MODERATION_DISCOVER } from "@/lib/auth/rbacInternal";
import { createChangelog } from "@/lib/core";
import { ChangeLogDocument } from "@/lib/db/types";
import { col } from "@/lib/db";

export interface DiscoverRequest {
  _id: string; // ← MUST be string
  server_id: string;
  server_name: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  created_at: Date;
  created_by: string;
  reviewed_by?: string;
  reviewed_at?: Date;
  rejection_reason?: string;
}

export async function fetchDiscoverRequestsAction() {
  await getScopedUser(RBAC_PERMISSION_MODERATION_DISCOVER);

  return col<DiscoverRequest>("discover_requests")
    .find({})
    .sort({ created_at: -1 })
    .toArray();
}

export async function approveDiscoverRequest(requestId: string) {
  const userEmail = await getScopedUser(
    RBAC_PERMISSION_MODERATION_DISCOVER,
  );

  await col<DiscoverRequest>("discover_requests").updateOne(
    { _id: requestId }, // ← FIXED
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
      type: "DiscoverRequest",
      id: requestId,
    },
    type: "discover/approve",
  } as Omit<ChangeLogDocument, "_id" | "userEmail">);
}

export async function rejectDiscoverRequest(
  requestId: string,
  reason: string,
) {
  const userEmail = await getScopedUser(
    RBAC_PERMISSION_MODERATION_DISCOVER,
  );

  await col<DiscoverRequest>("discover_requests").updateOne(
    { _id: requestId }, // ← FIXED
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
      type: "DiscoverRequest",
      id: requestId,
    },
    type: "discover/reject",
    reason,
  } as Omit<ChangeLogDocument, "_id" | "userEmail">);
}
