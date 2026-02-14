"use server";

import { getScopedUser } from "@/lib/auth";
import { RBAC_PERMISSION_MODERATION_AGENT } from "@/lib/auth/rbacInternal";
import { createChangelog, sendPlatformAlert } from "@/lib/core";
import { ChangeLogDocument, bots, servers, serverMembers, reports, accounts, users } from "@/lib/db/types";
import { suspendUser } from "@/lib/database/revolt";
import { createOrFindDM } from "@/lib/database/revolt/channels";
import { sendMessage } from "@/lib/database/revolt/messages";
import { findCaseById } from "@/lib/database/revolt/safety_cases";
import { createStrike } from "@/lib/database/revolt/safety_strikes";

// Extract only the User moderation variants from the union
type UserChange =
  | {
      object: { type: "User"; id: string };
      type: "user/strike";
      id: string;
      reason: string[];
    }
  | {
      object: { type: "User"; id: string };
      type: "user/suspend";
      id: string;
      duration: string;
      reason: string[];
    }
  | {
      object: { type: "User"; id: string };
      type: "user/ban";
      id: string;
      reason: string[];
    }
  | {
      object: { type: "User"; id: string };
      type: "user/export";
      exportType: "law-enforcement";
    };

// =============================================================================
// STRIKE USER (existing)
// =============================================================================

export async function strikeUser(
  userId: string,
  type: "strike" | "suspension" | "ban",
  reason: string[],
  context: string,
  caseId: string | undefined,
  duration: "7" | "14" | "indefinite",
) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  // Sanitize bogus case IDs before touching DB / Neon / ULID parsing
  if (
    !caseId ||
    caseId === "$undefined" ||
    caseId === "undefined" ||
    caseId === "null" ||
    caseId.trim() === "" ||
    caseId.length !== 26
  ) {
    caseId = undefined;
  }

  if (caseId && !(await findCaseById(caseId))) {
    throw "Case doesn't exist?";
  }

  const strike = await createStrike(
    userId,
    reason.join(", ") +
      (type === "suspension"
        ? ` (${duration === "indefinite" ? duration : `${duration} day`})`
        : "") +
      (context ? ` - ${context}` : ""),
    type,
    caseId,
  );

  // -----------------------------
  // Correct changelog structure
  // -----------------------------
  let changelogDoc: UserChange;

  if (type === "strike") {
    changelogDoc = {
      object: { type: "User", id: userId },
      type: "user/strike",
      id: strike._id,
      reason,
    };
  } else if (type === "suspension") {
    changelogDoc = {
      object: { type: "User", id: userId },
      type: "user/suspend",
      id: strike._id,
      duration,
      reason,
    };
  } else {
    changelogDoc = {
      object: { type: "User", id: userId },
      type: "user/ban",
      id: strike._id,
      reason,
    };
  }

  const changelog = await createChangelog(userEmail, changelogDoc);

  // -----------------------------
  // Suspension logic
  // -----------------------------
  if (type === "suspension") {
    await suspendUser(
      userId,
      duration === "indefinite" ? 0 : parseInt(duration),
      reason,
    );

    // Disable the account for the suspension duration
    const suspensionUpdate: Record<string, any> = { disabled: true };
    if (duration !== "indefinite") {
      const expiresAt = new Date(
        Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000,
      ).toISOString();
      suspensionUpdate.suspension = {
        active: true,
        reason: reason.join(", "),
        expiresAt,
        strikeId: strike._id,
      };
    } else {
      suspensionUpdate.suspension = {
        active: true,
        reason: reason.join(", "),
        expiresAt: null, // indefinite
        strikeId: strike._id,
      };
    }
    await accounts().updateOne({ _id: userId }, { $set: suspensionUpdate });
  }

  // -----------------------------
  // DM notification (not for bans)
  // -----------------------------
  if (type !== "ban") {
    const channel = await createOrFindDM(
      userId,
      process.env.PLATFORM_ACCOUNT_ID!,
    );

    await sendMessage(channel._id, {
      content: [
        type === "suspension"
          ? "Your account has been suspended, for one or more reasons:"
          : "You have received an account strike, for one or more reasons:",
        ...reason.map((r) => `- ${r}`),
        "",
        type === "suspension"
          ? "Further violations may result in a permanent ban depending on severity, please abide by the [Acceptable Usage Policy](https://otube.nl/aup)."
          : "Further violations will result in suspension or a permanent ban depending on severity, please abide by the [Acceptable Usage Policy](https://otube.nl/aup).",
        ...(caseId
          ? ["", `Case ID for your reference: **${caseId.substring(18)}**`]
          : []),
        "If you have further questions about this strike, please contact abuse@revolt.chat",
      ].join("\n"),
    });
  }

  return { changelog, strike };
}

// =============================================================================
// ACCOUNT MANAGEMENT
// =============================================================================

export async function disableAccount(userId: string) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
  await accounts().updateOne({ _id: userId }, { $set: { disabled: true } });
  await createChangelog(userEmail, {
    object: { type: "User", id: userId },
    type: "comment",
    text: "Account disabled by administrator",
  } as any);
  return { success: true };
}

export async function enableAccount(userId: string) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
  await accounts().updateOne({ _id: userId }, { $set: { disabled: false } });
  return { success: true };
}

export async function queueAccountDeletion(userId: string) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
  await accounts().updateOne(
    { _id: userId },
    {
      $set: {
        deletion: {
          status: "Scheduled",
          after: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        },
      },
    },
  );
  await createChangelog(userEmail, {
    object: { type: "User", id: userId },
    type: "comment",
    text: "Account deletion queued (14 days)",
  } as any);
  return { success: true };
}

export async function cancelAccountDeletion(userId: string) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
  await accounts().updateOne({ _id: userId }, { $unset: { deletion: 1 } });
  return { success: true };
}

export async function resetLockout(userId: string) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
  await accounts().updateOne({ _id: userId }, { $unset: { lockout: 1 } });
  return { success: true };
}

export async function updateAccountEmail(userId: string, newEmail: string) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
  await accounts().updateOne(
    { _id: userId },
    {
      $set: {
        email: newEmail,
        email_normalised: newEmail.toLowerCase(),
      },
    },
  );
  await createChangelog(userEmail, {
    object: { type: "User", id: userId },
    type: "comment",
    text: `Email changed to ${newEmail}`,
  } as any);
  return { success: true };
}

export async function verifyAccountEmail(userId: string) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
  await accounts().updateOne(
    { _id: userId },
    { $set: { "verification.status": "Verified" } },
  );
  return { success: true };
}

export async function disableMfaTotp(userId: string) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
  await accounts().updateOne(
    { _id: userId },
    { $set: { "mfa.totp_token.status": "Disabled" } },
  );
  await createChangelog(userEmail, {
    object: { type: "User", id: userId },
    type: "comment",
    text: "TOTP disabled by administrator",
  } as any);
  return { success: true };
}

export async function clearRecoveryCodes(userId: string) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
  await accounts().updateOne(
    { _id: userId },
    { $set: { "mfa.recovery_codes": [] } },
  );
  return { success: true };
}

// =============================================================================
// CLEAR PROFILE
// =============================================================================

export async function clearUserProfile(
  userId: string,
  field: "avatar" | "banner" | "display_name" | "bio" | "status" | "all",
) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  const unsetFields: Record<string, 1> = {};
  if (field === "avatar" || field === "all") unsetFields["avatar"] = 1;
  if (field === "banner" || field === "all") unsetFields["profile.background"] = 1;
  if (field === "display_name" || field === "all") unsetFields["display_name"] = 1;
  if (field === "bio" || field === "all") unsetFields["profile.content"] = 1;
  if (field === "status" || field === "all") unsetFields["status"] = 1;

  await users().updateOne({ _id: userId }, { $unset: unsetFields });

  await createChangelog(userEmail, {
    object: { type: "User", id: userId },
    type: "comment",
    text: `Profile cleared: ${field}`,
  } as any);

  return { success: true };
}

// =============================================================================
// DATA EXPORT
// =============================================================================

export async function exportUserData(
  userId: string,
  exportType: "law-enforcement" | "gdpr",
) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  const [user, account, userReports, userBots, userServers, userSessions] =
    await Promise.all([
      users().findOne({ _id: userId }),
      accounts().findOne(
        { _id: userId },
        { projection: { password: 0, "mfa.totp_token.secret": 0 } },
      ),
      reports().find({ $or: [{ "content.id": userId }, { author_id: userId }] }).toArray(),
      bots().find({ owner: userId }).toArray(),
      serverMembers().find({ "_id.user": userId } as any).toArray(),
      (await import("@/lib/db/types")).sessions().find({ user_id: userId }).toArray(),
    ]);

  const exportData: any = {
    exportedAt: new Date().toISOString(),
    exportType,
    exportedBy: userEmail,
    user,
    account: account ? { ...account, password: undefined } : null,
    reports: userReports,
    bots: userBots,
    serverMemberships: userServers,
  };

  if (exportType === "law-enforcement") {
    exportData.sessions = userSessions;
  }

  await createChangelog(userEmail, {
    object: { type: "User", id: userId },
    type: "user/export",
    exportType,
  } as any);

  return JSON.stringify(exportData, null, 2);
}

// =============================================================================
// SEND ALERT
// =============================================================================

export async function sendUserAlert(userId: string, content: string) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  await sendPlatformAlert(userId, content);

  await createChangelog(userEmail, {
    object: { type: "User", id: userId },
    type: "comment",
    text: `Alert sent: ${content.substring(0, 100)}`,
  } as any);

  return { success: true };
}

// =============================================================================
// UNSUSPEND USER
// =============================================================================

export async function unsuspendUser(userId: string) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  // Remove suspension flags from user document
  await users().updateOne({ _id: userId }, { $set: { flags: 0 } });

  // Re-enable account and clear suspension metadata
  await accounts().updateOne(
    { _id: userId },
    {
      $set: { disabled: false },
      $unset: { suspension: 1 },
    },
  );

  await createChangelog(userEmail, {
    object: { type: "User", id: userId },
    type: "comment",
    text: "User unsuspended by administrator",
  } as any);

  return { success: true };
}

export async function getSuspensionInfo(userId: string) {
  await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
  const account = await accounts().findOne({ _id: userId });
  if (!account) return null;
  const suspension = (account as any).suspension;
  if (!suspension || !suspension.active) return null;
  return {
    active: true as const,
    reason: suspension.reason as string,
    expiresAt: suspension.expiresAt as string | null,
    strikeId: suspension.strikeId as string | undefined,
  };
}

// =============================================================================
// BAN USER (fully implemented)
// =============================================================================

export async function banUser(
  userId: string,
  reason: string[],
  context: string,
  caseId: string | undefined,
) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  if (
    !caseId || caseId === "$undefined" || caseId === "undefined" ||
    caseId === "null" || caseId.trim() === "" || caseId.length !== 26
  ) {
    caseId = undefined;
  }

  const strike = await createStrike(userId, reason.join(", ") + (context ? ` - ${context}` : ""), "ban", caseId);

  // Set banned flag on user
  await users().updateOne({ _id: userId }, { $set: { flags: 4 } });

  // Disable the account
  await accounts().updateOne({ _id: userId }, { $set: { disabled: true } });

  await createChangelog(userEmail, {
    object: { type: "User", id: userId },
    type: "user/ban",
    id: strike._id,
    reason,
  } as any);

  return { success: true };
}

// =============================================================================
// FETCH USER RELATED DATA (bots, servers, friends, reports, mod history)
// =============================================================================

export async function fetchUserBots(userId: string) {
  await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
  return bots()
    .find({ owner: userId })
    .toArray()
    .then((b: any[]) =>
      b.map((bot: any) => ({
        _id: bot._id,
        username: bot.username || bot.name || bot._id,
        interactions_url: bot.interactions_url,
        public: bot.public || false,
      })),
    );
}

export async function fetchUserServers(userId: string) {
  await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
  const memberships = await serverMembers()
    .find({ "_id.user": userId } as any)
    .toArray();

  const serverIds = memberships.map((m: any) => m._id?.server).filter(Boolean);

  if (serverIds.length === 0) return [];

  return servers()
    .find({ _id: { $in: serverIds } })
    .project({ _id: 1, name: 1, owner: 1, flags: 1 })
    .toArray();
}

export async function fetchUserFriends(userId: string) {
  await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
  const user = await users().findOne({ _id: userId });
  if (!user || !user.relations) return [];

  const friendIds = user.relations
    .filter((r: any) => r.status === "Friend")
    .map((r: any) => r._id);

  if (friendIds.length === 0) return [];

  return users()
    .find({ _id: { $in: friendIds } })
    .project({ _id: 1, username: 1, discriminator: 1, avatar: 1, online: 1 })
    .toArray();
}

export async function fetchUserReports(userId: string) {
  await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
  return reports()
    .find({
      $or: [{ "content.id": userId }, { author_id: userId }],
    })
    .sort({ _id: -1 })
    .limit(50)
    .toArray();
}

export async function fetchUserModerationHistory(userId: string) {
  await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
  const { changelog } = await import("@/lib/db/types");
  return changelog()
    .find({ "object.id": userId, "object.type": "User" })
    .sort({ _id: -1 })
    .limit(50)
    .toArray();
}

// =============================================================================
// BADGE MANAGEMENT
// =============================================================================

export async function getUserBadges(userId: string): Promise<number> {
  await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
  const user = await users().findOne({ _id: userId });
  return (user as any)?.badges ?? 0;
}

export async function setUserBadges(userId: string, badges: number) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
  await users().updateOne({ _id: userId }, { $set: { badges } });

  await createChangelog(userEmail, {
    object: { type: "User", id: userId },
    type: "comment",
    text: `Badges updated to value: ${badges}`,
  } as any);

  return { success: true, badges };
}

// =============================================================================
// SERVER FLAGS MANAGEMENT
// =============================================================================

export async function getServerFlags(serverId: string): Promise<number> {
  await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
  const server = await servers().findOne({ _id: serverId });
  return (server as any)?.flags ?? 0;
}

export async function setServerFlags(serverId: string, flags: number) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
  await servers().updateOne({ _id: serverId }, { $set: { flags } });

  await createChangelog(userEmail, {
    object: { type: "User", id: serverId },
    type: "comment",
    text: `Server flags updated to value: ${flags}`,
  } as any);

  return { success: true, flags };
}

export async function fetchServerDetails(serverId: string) {
  await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
  const server = await servers().findOne({ _id: serverId });
  if (!server) return null;

  const memberCount = await serverMembers().countDocuments({
    "_id.server": serverId,
  } as any);

  return {
    ...server,
    memberCount,
  };
}