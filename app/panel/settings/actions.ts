"use server";

import { getScopedUser } from "@/lib/auth";
import { RBAC_PERMISSION_MODERATION_AGENT } from "@/lib/auth/rbacInternal";
import { changelog } from "@/lib/db/types";

export interface AuditLogEntry {
  id: string;
  user: string;
  action: string;
  object: {
    type: string;
    id: string;
  };
  timestamp: string;
  details?: string;
}

export interface SystemSettings {
  maxCaseAge: number;
  reportAutoClose: boolean;
  reportAutoCloseAge: number;
  strikeDecayMonths: number;
  suspensionAppealDays: number;
  notificationEmail: string;
  logRetentionMonths: number;
}

const defaultSettings: SystemSettings = {
  maxCaseAge: 90,
  reportAutoClose: true,
  reportAutoCloseAge: 30,
  strikeDecayMonths: 12,
  suspensionAppealDays: 30,
  notificationEmail: process.env.ADMIN_EMAIL || "admin@example.com",
  logRetentionMonths: 6,
};

export async function getAuditLog(
  limit: number = 100,
  offset: number = 0,
): Promise<AuditLogEntry[]> {
  const userEmail = await getScopedUser(
    RBAC_PERMISSION_MODERATION_AGENT,
  ).catch(() => null);

  if (!userEmail) {
    throw new Error("Unauthorized");
  }

  try {
    const logs = await changelog()
      .find({})
      .sort({ _id: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    return logs.map((log) => ({
      id: log._id,
      user: log.userEmail,
      action: log.type || "unknown",
      object: log.object || { type: "Unknown", id: "" },
      timestamp: new Date(log._id).toISOString(),
      details: (log as any).text || (log as any).reason || undefined,
    }));
  } catch (error) {
    console.error("Error fetching audit log:", error);
    return [];
  }
}

export async function getAuditLogCount(): Promise<number> {
  const userEmail = await getScopedUser(
    RBAC_PERMISSION_MODERATION_AGENT,
  ).catch(() => null);

  if (!userEmail) {
    throw new Error("Unauthorized");
  }

  try {
    return await changelog().countDocuments({});
  } catch (error) {
    console.error("Error counting audit logs:", error);
    return 0;
  }
}

export async function searchAuditLog(
  query: string,
  limit: number = 50,
): Promise<AuditLogEntry[]> {
  const userEmail = await getScopedUser(
    RBAC_PERMISSION_MODERATION_AGENT,
  ).catch(() => null);

  if (!userEmail) {
    throw new Error("Unauthorized");
  }

  try {
    const logs = await changelog()
      .find({
        $or: [
          { userEmail: { $regex: query, $options: "i" } },
          { type: { $regex: query, $options: "i" } },
          { "object.type": { $regex: query, $options: "i" } },
          { text: { $regex: query, $options: "i" } },
        ],
      })
      .sort({ _id: -1 })
      .limit(limit)
      .toArray();

    return logs.map((log) => ({
      id: log._id,
      user: log.userEmail,
      action: log.type || "unknown",
      object: log.object || { type: "Unknown", id: "" },
      timestamp: new Date(log._id).toISOString(),
      details: (log as any).text || undefined,
    }));
  } catch (error) {
    console.error("Error searching audit log:", error);
    return [];
  }
}

export async function getSystemSettings(): Promise<SystemSettings> {
  const userEmail = await getScopedUser(
    RBAC_PERMISSION_MODERATION_AGENT,
  ).catch(() => null);

  if (!userEmail) {
    throw new Error("Unauthorized");
  }

  return {
    ...defaultSettings,
    notificationEmail: process.env.ADMIN_EMAIL || defaultSettings.notificationEmail,
  };
}

export async function updateSystemSettings(
  settings: Partial<SystemSettings>,
): Promise<SystemSettings> {
  const userEmail = await getScopedUser(
    RBAC_PERMISSION_MODERATION_AGENT,
  ).catch(() => null);

  if (!userEmail) {
    throw new Error("Unauthorized");
  }

  await changelog().insertOne({
    _id: `audit_${Date.now()}`,
    userEmail,
    object: { type: "SystemSettings", id: "global" },
    type: "comment",
    text: `Updated system settings: ${JSON.stringify(settings)}`,
  } as any);

  return { ...defaultSettings, ...settings };
}

export async function getAuditLogByUser(
  userEmail: string,
  limit: number = 50,
): Promise<AuditLogEntry[]> {
  const currentUser = await getScopedUser(
    RBAC_PERMISSION_MODERATION_AGENT,
  ).catch(() => null);

  if (!currentUser) {
    throw new Error("Unauthorized");
  }

  try {
    const logs = await changelog()
      .find({ userEmail })
      .sort({ _id: -1 })
      .limit(limit)
      .toArray();

    return logs.map((log) => ({
      id: log._id,
      user: log.userEmail,
      action: log.type || "unknown",
      object: log.object || { type: "Unknown", id: "" },
      timestamp: new Date(log._id).toISOString(),
      details: (log as any).text || undefined,
    }));
  } catch (error) {
    console.error("Error fetching user audit log:", error);
    return [];
  }
}

export async function getAuditLogByObject(
  objectType: string,
  objectId: string,
  limit: number = 50,
): Promise<AuditLogEntry[]> {
  const userEmail = await getScopedUser(
    RBAC_PERMISSION_MODERATION_AGENT,
  ).catch(() => null);

  if (!userEmail) {
    throw new Error("Unauthorized");
  }

  try {
    const logs = await changelog()
      .find({
        "object.type": objectType,
        "object.id": objectId,
      })
      .sort({ _id: -1 })
      .limit(limit)
      .toArray();

    return logs.map((log) => ({
      id: log._id,
      user: log.userEmail,
      action: log.type || "unknown",
      object: log.object || { type: "Unknown", id: "" },
      timestamp: new Date(log._id).toISOString(),
      details: (log as any).text || undefined,
    }));
  } catch (error) {
    console.error("Error fetching object audit log:", error);
    return [];
  }
}

export async function exportAuditLog(
  format: "json" | "csv" = "json",
  limit: number = 1000,
): Promise<string> {
  const userEmail = await getScopedUser(
    RBAC_PERMISSION_MODERATION_AGENT,
  ).catch(() => null);

  if (!userEmail) {
    throw new Error("Unauthorized");
  }

  try {
    const logs = await getAuditLog(limit);

    if (format === "json") {
      return JSON.stringify(logs, null, 2);
    } else {
      const headers = ["ID", "User", "Action", "Object Type", "Object ID", "Timestamp"];
      const rows = logs.map((log) => [
        log.id,
        log.user,
        log.action,
        log.object.type,
        log.object.id,
        log.timestamp,
      ]);

      const csv = [
        headers.join(","),
        ...rows.map((r) =>
          r
            .map((cell) =>
              typeof cell === "string" && cell.includes(",")
                ? `"${cell}"`
                : cell,
            )
            .join(","),
        ),
      ].join("\n");

      return csv;
    }
  } catch (error) {
    console.error("Error exporting audit log:", error);
    throw error;
  }
}
