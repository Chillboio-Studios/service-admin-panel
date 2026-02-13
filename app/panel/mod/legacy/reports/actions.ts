"use server";

import { getScopedUser } from "@/lib/auth";
import { RBAC_PERMISSION_MODERATION_AGENT } from "@/lib/auth/rbacInternal";
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

export async function fetchReportsAction() {
  await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  return col<ModeratorReport>("moderation_reports")
    .find({})
    .sort({ created_at: -1 })
    .toArray();
}
