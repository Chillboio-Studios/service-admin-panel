"use client";

import type { RevoltUserInfo } from "@/lib/database/revolt";
import { useMutation } from "@tanstack/react-query";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useState } from "react";
import Markdown from "react-markdown";
import { decodeTime } from "ulid";

import {
  AlertDialog,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  DropdownMenu,
  Flex,
  Heading,
  Text,
  TextArea,
} from "@radix-ui/themes";

import { clearUserProfile, exportUserData, sendUserAlert } from "./actions";
import { UserStrikeActions } from "./userManagement";

dayjs.extend(relativeTime);

export function UserCard({
  user,
  showProfile,
  showActions,
}: {
  user: RevoltUserInfo;
  showProfile?: boolean;
  showActions?: "none" | "short" | "all";
}) {
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertContent, setAlertContent] = useState("");

  const clearMut = useMutation({
    mutationFn: async (field: "avatar" | "banner" | "display_name" | "bio" | "status" | "all") => {
      await clearUserProfile(user._id, field);
    },
    onSuccess: () => {
      window.location.reload();
    },
  });

  const exportMut = useMutation({
    mutationFn: async (type: "law-enforcement" | "gdpr") => {
      const data = await exportUserData(user._id, type);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${user._id}_${type}_export.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });

  const alertMut = useMutation({
    mutationFn: async () => {
      await sendUserAlert(user._id, alertContent);
      setAlertContent("");
      setAlertOpen(false);
    },
  });

  return (
    <Card>
      <Flex gap="3" direction="column">
        <Flex gap="3" align="center">
          <Avatar
            size="3"
            src={
              user.avatar
                ? `https://otube.nl/autumn/avatars/${user.avatar._id}`
                : `https://otube.nl/api/users/${user._id}/default_avatar`
            }
            fallback={user.username.substring(0, 1)}
          />

          <Box>
            <Text as="div" size="2" weight="bold">
              {user.username}#{user.discriminator}{" "}
              <Text weight="regular">{user.username}</Text>
            </Text>
            <Flex gap="2" wrap="wrap">
              {user.status?.text && (
                <Badge color="gray">{user.status.text}</Badge>
              )}
              <Badge
                suppressHydrationWarning
                title={new Date(decodeTime(user._id)).toISOString()}
              >
                Created {dayjs(decodeTime(user._id)).fromNow()}
              </Badge>
              {user.bot && <Badge color="gold">Bot</Badge>}
              {user.relations.friends > 0 && (
                <Badge>{user.relations.friends} friends</Badge>
              )}
            </Flex>
          </Box>
        </Flex>

        {(showActions === "short" || showActions === "all") && (
          <Flex gap="2" wrap="wrap">
            {showActions === "all" && (
              <UserStrikeActions id={user._id} flags={user.flags || 0} />
            )}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <Button variant="soft" disabled={clearMut.isPending}>
                  {clearMut.isPending ? "Clearing..." : "Clear Profile"}
                  <DropdownMenu.TriggerIcon />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item onClick={() => clearMut.mutate("avatar")}>
                  Avatar
                </DropdownMenu.Item>
                <DropdownMenu.Item onClick={() => clearMut.mutate("banner")}>
                  Profile Banner
                </DropdownMenu.Item>
                <DropdownMenu.Item onClick={() => clearMut.mutate("display_name")}>
                  Display Name
                </DropdownMenu.Item>
                <DropdownMenu.Item onClick={() => clearMut.mutate("bio")}>
                  Bio
                </DropdownMenu.Item>
                <DropdownMenu.Item onClick={() => clearMut.mutate("status")}>
                  Status
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item color="red" onClick={() => clearMut.mutate("all")}>
                  All
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <Button variant="soft" disabled={exportMut.isPending}>
                  {exportMut.isPending ? "Exporting..." : "Data Export"}
                  <DropdownMenu.TriggerIcon />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item onClick={() => exportMut.mutate("law-enforcement")}>
                  Law Enforcement
                </DropdownMenu.Item>
                <DropdownMenu.Item onClick={() => exportMut.mutate("gdpr")}>
                  GDPR Data Package
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>

            {/* Send Alert */}
            <AlertDialog.Root open={alertOpen} onOpenChange={setAlertOpen}>
              <AlertDialog.Trigger>
                <Button variant="outline" color="amber">
                  Send Alert
                </Button>
              </AlertDialog.Trigger>
              <AlertDialog.Content>
                <AlertDialog.Title>Send Platform Alert</AlertDialog.Title>
                <AlertDialog.Description size="2">
                  Send a direct moderation notice to this user via the platform
                  bot. They will receive this as a DM.
                </AlertDialog.Description>
                <Flex direction="column" gap="2" mt="3">
                  <TextArea
                    value={alertContent}
                    onChange={(e) => setAlertContent(e.currentTarget.value)}
                    placeholder="Type your alert message..."
                    rows={4}
                  />
                </Flex>
                <Flex gap="3" mt="4" justify="end">
                  <AlertDialog.Cancel>
                    <Button variant="soft" color="gray">Cancel</Button>
                  </AlertDialog.Cancel>
                  <Button
                    color="amber"
                    disabled={alertMut.isPending || !alertContent.trim()}
                    onClick={() => alertMut.mutate()}
                  >
                    {alertMut.isPending ? "Sending..." : "Send Alert"}
                  </Button>
                </Flex>
              </AlertDialog.Content>
            </AlertDialog.Root>
          </Flex>
        )}

        {showProfile && (
          <Flex direction="column" gap="2">
            <Heading size="2">Profile Bio</Heading>
            <Card>
              <Markdown>{user.profile?.content ?? "No profile bio."}</Markdown>
            </Card>
          </Flex>
        )}
      </Flex>
    </Card>
  );
}
