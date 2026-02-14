"use server";

import { getScopedUser } from "@/lib/auth";
import { RBAC_PERMISSION_MODERATION_AGENT } from "@/lib/auth/rbacInternal";
import { users, accounts, reports } from "@/lib/db/types";

export interface UserProfile {
  _id: string;
  username: string;
  avatar?: string;
  bot: boolean;
  verified: boolean;
  badges: number;
  relations?: {
    friends: number;
  };
}

export interface UserWithMetrics extends UserProfile {
  reportsCount: number;
  strikeCount: number;
  lastActivityTime?: string;
  accountStatus: "active" | "disabled" | "spam";
}

export async function searchUsers(
  query: string,
  limit: number = 50,
): Promise<UserProfile[]> {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  try {
    const results = await users()
      .find({
        $or: [
          { _id: { $regex: query, $options: "i" } },
          { username: { $regex: query, $options: "i" } },
        ],
      } as any)
      .limit(limit)
      .toArray();

    return results.map((u: any) => ({
      _id: u._id,
      username: u.username,
      avatar: u.avatar?._id,
      bot: !!u.bot,
      verified: !!u.verified,
      badges: u.badges ?? 0,
      relations: u.relations,
    }));
  } catch (error) {
    console.error("Error searching users:", error);
    return [];
  }
}

export async function getUserProfile(userId: string): Promise<UserWithMetrics | null> {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  try {
    const user = await users().findOne({ _id: userId });
    if (!user) return null;

    const [reportsCount, accountInfo] = await Promise.all([
      reports().countDocuments({
        $or: [{ "content.id": userId }, { author_id: userId }],
      }),
      accounts().findOne({ _id: userId }),
    ]);

    return {
      _id: user._id,
      username: user.username,
      avatar: (user as any).avatar?._id,
      bot: !!(user as any).bot,
      verified: !!(user as any).verified,
      badges: (user as any).badges ?? 0,
      relations: (user as any).relations,
      reportsCount,
      strikeCount: 0,
      accountStatus: accountInfo?.disabled
        ? "disabled"
        : (accountInfo as any)?.spam
          ? "spam"
          : "active",
    } as UserWithMetrics;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export async function getUserStatisticsBatch(userIds: string[]) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  try {
    const results = await Promise.all(
      userIds.map(async (id) => {
        const reportsCount = await reports().countDocuments({
          $or: [{ "content.id": id }, { author_id: id }],
        });
        const accountInfo = await accounts().findOne({ _id: id });
        return {
          userId: id,
          reportsCount,
          status: accountInfo?.disabled
            ? "disabled"
            : accountInfo?.spam
              ? "spam"
              : "active",
        };
      }),
    );
    return results;
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    return [];
  }
}

export async function listUsersWithMetrics(
  filters?: {
    bot?: boolean;
    verified?: boolean;
    status?: "active" | "disabled" | "spam";
  },
  limit: number = 50,
): Promise<UserWithMetrics[]> {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  try {
    const query: any = {};
    if (filters?.bot !== undefined) query.bot = filters.bot;
    if (filters?.verified !== undefined) query.verified = filters.verified;

    const allUsers = await users().find(query).limit(limit).toArray();
    const results: UserWithMetrics[] = [];

    for (const user of allUsers) {
      const [reportsCount, accountInfo] = await Promise.all([
        reports().countDocuments({
          $or: [{ "content.id": user._id }, { author_id: user._id }],
        }),
        accounts().findOne({ _id: user._id }),
      ]);

      const status: "active" | "disabled" | "spam" = accountInfo?.disabled
        ? "disabled"
        : accountInfo?.spam
          ? "spam"
          : "active";

      if (filters?.status && status !== filters.status) continue;

      results.push({
        _id: user._id,
        username: user.username,
        avatar: (user as any).avatar?._id,
        bot: !!(user as any).bot,
        verified: !!(user as any).verified,
        badges: (user as any).badges ?? 0,
        relations: (user as any).relations,
        reportsCount,
        strikeCount: 0,
        accountStatus: status,
      } as UserWithMetrics);
    }

    return results;
  } catch (error) {
    console.error("Error listing users:", error);
    return [];
  }
}

export async function exportUsersAsJSON(filters?: {
  bot?: boolean;
  verified?: boolean;
  status?: "active" | "disabled" | "spam";
}): Promise<string> {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  try {
    const users_data = await listUsersWithMetrics(filters, 10000);
    return JSON.stringify(users_data, null, 2);
  } catch (error) {
    console.error("Error exporting users:", error);
    throw error;
  }
}

export async function exportUsersAsCSV(filters?: {
  bot?: boolean;
  verified?: boolean;
  status?: "active" | "disabled" | "spam";
}): Promise<string> {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  try {
    const users_data = await listUsersWithMetrics(filters, 10000);

    const headers = [
      "User ID",
      "Username",
      "Bot",
      "Verified",
      "Reports",
      "Status",
    ];
    const rows = users_data.map((u) => [
      u._id,
      u.username,
      u.bot ? "Yes" : "No",
      u.verified ? "Yes" : "No",
      u.reportsCount,
      u.accountStatus,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    return csv;
  } catch (error) {
    console.error("Error exporting users:", error);
    throw error;
  }
}

export async function getUserDistribution() {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  try {
    const [
      totalUsers,
      botUsers,
      verifiedUsers,
      disabledAccounts,
      spamAccounts,
    ] = await Promise.all([
      users().countDocuments({}),
      users().countDocuments({ bot: true } as any),
      users().countDocuments({ verified: true } as any),
      accounts().countDocuments({ disabled: true } as any),
      accounts().countDocuments({ spam: true } as any),
    ]);

    return {
      total: totalUsers,
      bots: botUsers,
      verified: verifiedUsers,
      humans: totalUsers - botUsers,
      disabled: disabledAccounts,
      spam: spamAccounts,
      active: totalUsers - disabledAccounts - spamAccounts,
    };
  } catch (error) {
    console.error("Error getting user distribution:", error);
    return {
      total: 0,
      bots: 0,
      verified: 0,
      humans: 0,
      disabled: 0,
      spam: 0,
      active: 0,
    };
  }
}

export async function getUserTrendsLastDays(days: number = 30) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const usersTrend = await users()
      .find({ created_at: { $gte: startDate.toISOString() } })
      .toArray();

    const byDay = new Map<string, number>();
    usersTrend.forEach((user) => {
      const date = new Date((user as any).created_at || new Date());
      const dateStr = date.toISOString().split("T")[0];
      byDay.set(dateStr, (byDay.get(dateStr) || 0) + 1);
    });

    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  } catch (error) {
    console.error("Error getting user trends:", error);
    return [];
  }
}
