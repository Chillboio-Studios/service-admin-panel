"use server";

import { getScopedUser } from "@/lib/auth";
import {
  RBAC_PERMISSION_MODERATION_AGENT,
  RBAC_PERMISSION_MODERATION_DISCOVER,
  RBAC_PERMISSION_HR_MEMBER_CREATE,
} from "@/lib/auth/rbacInternal";
import {
  cases,
  reports,
  changelog,
  users,
  accounts,
} from "@/lib/db/types";

export interface AnalyticsStats {
  openCases: number;
  closedCases: number;
  pendingReports: number;
  resolvedReports: number;
  totalUsers: number;
  disabledAccounts: number;
  spamAccounts: number;
}

export interface TimeSeriesData {
  date: string;
  value: number;
}

export interface ModerationStats {
  strikes: number;
  suspensions: number;
  bans: number;
  reports: TimeSeriesData[];
  cases: TimeSeriesData[];
}

export interface HRStats {
  totalMembers: number;
  activeMembers: number;
  pendingApprovals: number;
  inactiveMembers: number;
  retiredMembers: number;
}

export async function getGeneralAnalytics(): Promise<AnalyticsStats> {
  const modPermission = await getScopedUser(
    RBAC_PERMISSION_MODERATION_AGENT,
  ).catch(() => null);

  if (!modPermission) {
    throw new Error("Unauthorized");
  }

  try {
    const [
      openCasesCount,
      closedCasesCount,
      pendingReportsCount,
      resolvedReportsCount,
      totalUsersCount,
      disabledAccountsCount,
      spamAccountsCount,
    ] = await Promise.all([
      cases().countDocuments({ status: "Open" }),
      cases().countDocuments({ status: "Closed" }),
      reports().countDocuments({ status: "Created" }),
      reports().countDocuments({ status: "Resolved" }),
      users().countDocuments({}),
      accounts()
        .countDocuments({ disabled: true }),
      accounts()
        .countDocuments({ spam: true }),
    ]);

    return {
      openCases: openCasesCount,
      closedCases: closedCasesCount,
      pendingReports: pendingReportsCount,
      resolvedReports: resolvedReportsCount,
      totalUsers: totalUsersCount,
      disabledAccounts: disabledAccountsCount,
      spamAccounts: spamAccountsCount,
    };
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return {
      openCases: 0,
      closedCases: 0,
      pendingReports: 0,
      resolvedReports: 0,
      totalUsers: 0,
      disabledAccounts: 0,
      spamAccounts: 0,
    };
  }
}

export async function getModerationAnalytics(): Promise<ModerationStats> {
  const modPermission = await getScopedUser(
    RBAC_PERMISSION_MODERATION_AGENT,
  ).catch(() => null);

  if (!modPermission) {
    throw new Error("Unauthorized");
  }

  try {
    const allReports = await reports().find({}).toArray();
    const allCases = await cases().find({}).toArray();

    const reportsGrouped = new Map<string, number>();
    const casesGrouped = new Map<string, number>();

    allReports.forEach((report: any) => {
      const date = new Date(report._id).toISOString().split("T")[0];
      reportsGrouped.set(date, (reportsGrouped.get(date) || 0) + 1);
    });

    allCases.forEach((caseDoc: any) => {
      const date = new Date(caseDoc._id).toISOString().split("T")[0];
      casesGrouped.set(date, (casesGrouped.get(date) || 0) + 1);
    });

    const reportsArray = Array.from(reportsGrouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([date, value]) => ({ date, value }));

    const casesArray = Array.from(casesGrouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([date, value]) => ({ date, value }));

    return {
      strikes: allReports.filter((r: any) => r.status === "Resolved").length,
      suspensions: allReports.filter(
        (r: any) => r.status === "Resolved" && r.author_id,
      ).length,
      bans: allCases.filter((c: any) => c.status === "Closed").length,
      reports: reportsArray,
      cases: casesArray,
    };
  } catch (error) {
    console.error("Error fetching moderation analytics:", error);
    return {
      strikes: 0,
      suspensions: 0,
      bans: 0,
      reports: [],
      cases: [],
    };
  }
}

export async function getHRAnalytics(): Promise<HRStats> {
  const hrPermission = await getScopedUser(
    RBAC_PERMISSION_HR_MEMBER_CREATE,
  ).catch(() => null);

  if (!hrPermission) {
    throw new Error("Unauthorized");
  }

  try {
    const [
      totalCount,
      activeCount,
      pendingCount,
      inactiveCount,
      retiredCount,
    ] = await Promise.all([
      Promise.resolve(0),
      Promise.resolve(0),
      Promise.resolve(0),
      Promise.resolve(0),
      Promise.resolve(0),
    ]);

    return {
      totalMembers: totalCount,
      activeMembers: activeCount,
      pendingApprovals: pendingCount,
      inactiveMembers: inactiveCount,
      retiredMembers: retiredCount,
    };
  } catch (error) {
    console.error("Error fetching HR analytics:", error);
    return {
      totalMembers: 0,
      activeMembers: 0,
      pendingApprovals: 0,
      inactiveMembers: 0,
      retiredMembers: 0,
    };
  }
}

export async function getRecentActivity() {
  const userEmail = await getScopedUser(
    RBAC_PERMISSION_MODERATION_AGENT,
  ).catch(
    () =>
      getScopedUser(RBAC_PERMISSION_HR_MEMBER_CREATE).catch(() => null),
  );

  if (!userEmail) {
    throw new Error("Unauthorized");
  }

  try {
    const recentChanges = await changelog()
      .find({})
      .sort({ _id: -1 })
      .limit(10)
      .toArray();

    return recentChanges.map((change: any) => ({
      id: change._id,
      user: change.userEmail,
      action: change.type || "unknown",
      object: change.object || { type: "Unknown", id: "" },
      timestamp: new Date(change._id).toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return [];
  }
}

export async function getTopReportReasons() {
  const modPermission = await getScopedUser(
    RBAC_PERMISSION_MODERATION_AGENT,
  ).catch(() => null);

  if (!modPermission) {
    throw new Error("Unauthorized");
  }

  try {
    const allReports = await reports().find({}).toArray();
    const reasons = new Map<string, number>();

    allReports.forEach((report: any) => {
      if (report.content && typeof report.content === "object") {
        const reason = (report.content as any).report_reason || "Unknown";
        reasons.set(reason, (reasons.get(reason) || 0) + 1);
      }
    });

    return Array.from(reasons.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([reason, count]) => ({ reason, count }));
  } catch (error) {
    console.error("Error fetching report reasons:", error);
    return [];
  }
}

export async function getUserStatistics() {
  const modPermission = await getScopedUser(
    RBAC_PERMISSION_MODERATION_AGENT,
  ).catch(() => null);

  if (!modPermission) {
    throw new Error("Unauthorized");
  }

  try {
    const totalUsers = await users().countDocuments({});
    const botUsers = await users().countDocuments({
      bot: true,
    } as any);
    const verified = await users().countDocuments({
      verified: true,
    } as any);

    return {
      total: totalUsers,
      bots: botUsers,
      verified,
      human: totalUsers - botUsers,
    };
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    return { total: 0, bots: 0, verified: 0, human: 0 };
  }
}
