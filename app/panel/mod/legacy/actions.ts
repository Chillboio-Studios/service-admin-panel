"use server";

import { getScopedUser } from "@/lib/auth";
import {
  RBAC_PERMISSION_MODERATION_AGENT,
  RBAC_PERMISSION_MODERATION_DISCOVER,
} from "@/lib/auth/rbacInternal";
import { createChangelog } from "@/lib/core";
import { ChangeLogDocument } from "@/lib/db/types";
import { col } from "@/lib/db";

export interface ModeratorReport {
  _id: string;
  reported_user_id: string;
  reason: string;
  details: string;
  status: "open" | "in-review" | "closed" | "dismissed";
  created_at: Date;
  created_by: string;
}

export interface DiscoverRequest {
  _id: string; // ← RESTORED
  server_id?: string;
  server_name?: string;
  bot_id?: string;
  bot_name?: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  created_at: Date;
  created_by: string;
  reviewed_by?: string;
  reviewed_at?: Date;
  rejection_reason?: string;
}

export async function createReportAction(
  reportedUserId: string,
  reason: string,
  details: string,
) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  const report: ModeratorReport = {
    _id: crypto.randomUUID(),
    reported_user_id: reportedUserId,
    reason,
    details,
    status: "open",
    created_at: new Date(),
    created_by: userEmail,
  };

  await col<ModeratorReport>("moderation_reports").insertOne(report);

  await createChangelog(userEmail, {
    object: {
      type: "Report",
      id: report._id,
    },
    type: "report/create",
    reason,
  } as Omit<ChangeLogDocument, "_id" | "userEmail">);
}

export async function fetchReportsAction() {
  await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  return col<ModeratorReport>("moderation_reports")
    .find({})
    .sort({ created_at: -1 })
    .toArray();
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
