"use server";

import { getScopedUser } from "@/lib/auth";
import { RBAC_PERMISSION_MODERATION_AGENT } from "@/lib/auth/rbacInternal";
import { createChangelog } from "@/lib/core";
import { servers, serverMembers, channels, reports } from "@/lib/db/types";

export async function fetchServer(serverId: string) {
  await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
  const server = await servers().findOne({ _id: serverId });
  if (!server) return null;

  const memberCount = await serverMembers().countDocuments({
    _id: { $regex: `_${serverId}$` },
  } as any);

  const channelCount = await channels().countDocuments({
    server: serverId,
  } as any);

  return {
    ...server,
    memberCount,
    channelCount,
  };
}

export async function fetchServerChannels(serverId: string) {
  await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
  return channels()
    .find({ server: serverId } as any)
    .project({ _id: 1, name: 1, channel_type: 1 })
    .toArray();
}

export async function fetchServerMembers(serverId: string, limit = 50) {
  await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
  return serverMembers()
    .find({ _id: { $regex: `_${serverId}$` } } as any)
    .limit(limit)
    .toArray();
}

export async function fetchServerReports(serverId: string) {
  await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
  return reports()
    .find({ "content.id": serverId })
    .sort({ _id: -1 })
    .limit(50)
    .toArray();
}

export async function setServerFlags(serverId: string, flags: number) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
  await servers().updateOne({ _id: serverId }, { $set: { flags } });

  await createChangelog(userEmail, {
    object: { type: "User", id: serverId },
    type: "user/strike",
    id: serverId,
    reason: [`Server flags updated to value: ${flags}`],
  } as any);

  return { success: true, flags };
}

export async function deleteServer(serverId: string) {
  const userEmail = await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  // Mark server as deleted with a flag
  await servers().updateOne(
    { _id: serverId },
    { $set: { flags: 4, deleted: true } as any },
  );

  await createChangelog(userEmail, {
    object: { type: "User", id: serverId },
    type: "user/strike",
    id: serverId,
    reason: ["Server deleted by administrator"],
  } as any);

  return { success: true };
}
