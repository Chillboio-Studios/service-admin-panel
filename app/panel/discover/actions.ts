"use server";

import { getScopedUser } from "@/lib/auth";
import {
  RBAC_PERMISSION_MODERATION_DISCOVER,
  RBAC_PERMISSION_MODERATION_AGENT,
} from "@/lib/auth/rbacInternal";
import { adminDiscoverRequests, changelog } from "@/lib/db/types";
import { ulid } from "ulid";

export interface DiscoverItem {
  _id: string;
  name: string;
  description: string;
  icon?: string;
  status: "pending" | "approved" | "rejected";
  requestCount: number;
  createdAt: string;
  lastReviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export async function fetchDiscoverQueue(
  status?: "pending" | "approved" | "rejected",
): Promise<DiscoverItem[]> {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_DISCOVER);

  try {
    const query = status ? { status } : {};
    const items = await adminDiscoverRequests()
      .find(query)
      .sort({ _id: -1 })
      .toArray();

    return items.map((item) => ({
      _id: item._id,
      name: (item as any).name || "Unknown",
      description: (item as any).description || "",
      icon: (item as any).icon,
      status: (item as any).status || "pending",
      requestCount: (item as any).requestCount || 0,
      createdAt: new Date((item as any)._id).toISOString(),
      lastReviewedAt: (item as any).lastReviewedAt,
      reviewedBy: (item as any).reviewedBy,
      rejectionReason: (item as any).rejectionReason,
    }));
  } catch (error) {
    console.error("Error fetching discover queue:", error);
    return [];
  }
}

export async function getDiscoverStats() {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_DISCOVER);

  try {
    const [pending, approved, rejected, total] = await Promise.all([
      adminDiscoverRequests().countDocuments({ status: "pending" }),
      adminDiscoverRequests().countDocuments({ status: "approved" }),
      adminDiscoverRequests().countDocuments({ status: "rejected" }),
      adminDiscoverRequests().countDocuments({}),
    ]);

    return {
      pending,
      approved,
      rejected,
      total,
      approvalRate: total > 0 ? ((approved / total) * 100).toFixed(1) : "0",
    };
  } catch (error) {
    console.error("Error getting discover stats:", error);
    return {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0,
      approvalRate: "0",
    };
  }
}

export async function searchDiscoverItems(query: string): Promise<DiscoverItem[]> {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_DISCOVER);

  try {
    const items = await adminDiscoverRequests()
      .find({
        $or: [
          { name: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
          { _id: { $regex: query, $options: "i" } },
        ],
      })
      .toArray();

    return items.map((item) => ({
      _id: item._id,
      name: (item as any).name || "Unknown",
      description: (item as any).description || "",
      icon: (item as any).icon,
      status: (item as any).status || "pending",
      requestCount: (item as any).requestCount || 0,
      createdAt: new Date((item as any)._id).toISOString(),
      lastReviewedAt: (item as any).lastReviewedAt,
      reviewedBy: (item as any).reviewedBy,
      rejectionReason: (item as any).rejectionReason,
    }));
  } catch (error) {
    console.error("Error searching discover items:", error);
    return [];
  }
}

export async function approveDiscoverItem(itemId: string) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_DISCOVER);

  try {
    await adminDiscoverRequests().updateOne(
      { _id: itemId },
      {
        $set: {
          status: "approved",
          lastReviewedAt: new Date(),
          reviewedBy: userEmail,
        },
      },
    );

    await changelog().insertOne({
      _id: ulid(),
      userEmail,
      object: { type: "DiscoverRequest", id: itemId },
      type: "discover/approve",
    } as any);

    return { success: true };
  } catch (error) {
    console.error("Error approving discover item:", error);
    throw error;
  }
}

export async function rejectDiscoverItem(itemId: string, reason: string) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_DISCOVER);

  try {
    await adminDiscoverRequests().updateOne(
      { _id: itemId },
      {
        $set: {
          status: "rejected",
          lastReviewedAt: new Date(),
          reviewedBy: userEmail,
          rejectionReason: reason,
        },
      },
    );

    await changelog().insertOne({
      _id: ulid(),
      userEmail,
      object: { type: "DiscoverRequest", id: itemId },
      type: "discover/reject",
      reason,
    } as any);

    return { success: true };
  } catch (error) {
    console.error("Error rejecting discover item:", error);
    throw error;
  }
}

export async function batchApproveDiscoverItems(itemIds: string[]) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_DISCOVER);

  try {
    await adminDiscoverRequests().updateMany(
      { _id: { $in: itemIds } },
      {
        $set: {
          status: "approved",
          lastReviewedAt: new Date(),
          reviewedBy: userEmail,
        },
      },
    );

    return { success: true, count: itemIds.length };
  } catch (error) {
    console.error("Error batch approving items:", error);
    throw error;
  }
}

export async function getDiscoverReviewHistory(itemId: string) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_DISCOVER);

  try {
    const history = await changelog()
      .find({
        "object.id": itemId,
        "object.type": "DiscoverRequest",
      })
      .sort({ _id: -1 })
      .toArray();

    return history.map((h) => ({
      timestamp: new Date(h._id).toISOString(),
      user: h.userEmail,
      action: h.type,
      details: (h as any).reason || (h as any).text,
    }));
  } catch (error) {
    console.error("Error fetching review history:", error);
    return [];
  }
}

export async function exportDiscoverQueueAsJSON() {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_DISCOVER);

  try {
    const items = await fetchDiscoverQueue();
    return JSON.stringify(items, null, 2);
  } catch (error) {
    console.error("Error exporting:", error);
    throw error;
  }
}
