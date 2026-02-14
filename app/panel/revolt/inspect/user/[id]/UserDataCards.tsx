"use client";

import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Link from "next/link";
import { decodeTime } from "ulid";

import {
  Badge,
  Flex,
  Skeleton,
  Table,
  Text,
} from "@radix-ui/themes";

import {
  fetchUserBots,
  fetchUserFriends,
  fetchUserModerationHistory,
  fetchUserReports,
  fetchUserServers,
} from "./actions";

dayjs.extend(relativeTime);

export function UserBotsCard({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["user-bots", userId],
    queryFn: () => fetchUserBots(userId),
  });

  if (isLoading) return <Skeleton height="48px" />;
  if (!data || data.length === 0)
    return <Text size="1" color="gray">No bots found.</Text>;

  return (
    <Table.Root size="1">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Bot ID</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Public</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {data.map((bot: any) => (
          <Table.Row key={bot._id}>
            <Table.Cell>
              <Text size="1" style={{ fontFamily: "monospace" }}>
                {bot._id}
              </Text>
            </Table.Cell>
            <Table.Cell>{bot.username}</Table.Cell>
            <Table.Cell>
              <Badge color={bot.public ? "green" : "gray"}>
                {bot.public ? "Public" : "Private"}
              </Badge>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}

export function UserFriendsCard({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["user-friends", userId],
    queryFn: () => fetchUserFriends(userId),
  });

  if (isLoading) return <Skeleton height="48px" />;
  if (!data || data.length === 0)
    return <Text size="1" color="gray">No friends found.</Text>;

  return (
    <Table.Root size="1">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>User</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>ID</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {data.map((friend: any) => (
          <Table.Row key={friend._id}>
            <Table.Cell>
              <Link href={`/panel/revolt/inspect/user/${friend._id}`}>
                {friend.username}
                {friend.discriminator ? `#${friend.discriminator}` : ""}
              </Link>
            </Table.Cell>
            <Table.Cell>
              <Text size="1" style={{ fontFamily: "monospace" }}>
                {friend._id}
              </Text>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}

export function UserServersCard({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["user-servers", userId],
    queryFn: () => fetchUserServers(userId),
  });

  if (isLoading) return <Skeleton height="48px" />;
  if (!data || data.length === 0)
    return <Text size="1" color="gray">No servers found.</Text>;

  return (
    <Table.Root size="1">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Server</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>ID</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Flags</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {data.map((server: any) => (
          <Table.Row key={server._id}>
            <Table.Cell>{server.name}</Table.Cell>
            <Table.Cell>
              <Text size="1" style={{ fontFamily: "monospace" }}>
                {server._id}
              </Text>
            </Table.Cell>
            <Table.Cell>
              <Flex gap="1" wrap="wrap">
                {server.flags ? (
                  <Badge color="blue">{server.flags}</Badge>
                ) : (
                  <Badge color="gray">0</Badge>
                )}
              </Flex>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}

export function UserReportsCard({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["user-reports", userId],
    queryFn: () => fetchUserReports(userId),
  });

  if (isLoading) return <Skeleton height="48px" />;
  if (!data || data.length === 0)
    return <Text size="1" color="gray">No reports found.</Text>;

  return (
    <Table.Root size="1">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Report</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Role</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Created</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {data.map((report: any) => (
          <Table.Row key={report._id}>
            <Table.Cell>
              <Text size="1" style={{ fontFamily: "monospace" }}>
                {report._id}
              </Text>
            </Table.Cell>
            <Table.Cell>
              <Badge
                color={
                  report.author_id === userId ? "blue" : "red"
                }
              >
                {report.author_id === userId ? "Author" : "Subject"}
              </Badge>
            </Table.Cell>
            <Table.Cell suppressHydrationWarning>
              {dayjs(decodeTime(report._id)).fromNow()}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}

export function ModerationHistoryCard({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["user-mod-history", userId],
    queryFn: () => fetchUserModerationHistory(userId),
  });

  if (isLoading) return <Skeleton height="48px" />;
  if (!data || data.length === 0)
    return <Text size="1" color="gray">No moderation history.</Text>;

  return (
    <Table.Root size="1">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Action</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>By</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Details</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {data.map((entry: any) => (
          <Table.Row key={entry._id}>
            <Table.Cell>
              <Badge>{entry.type || "action"}</Badge>
            </Table.Cell>
            <Table.Cell>
              <Text size="1">{entry.author || "System"}</Text>
            </Table.Cell>
            <Table.Cell>
              <Flex direction="column">
                {entry.reason && (
                  <Text size="1">
                    {Array.isArray(entry.reason)
                      ? entry.reason.join(", ")
                      : String(entry.reason)}
                  </Text>
                )}
                <Text size="1" color="gray" suppressHydrationWarning>
                  {entry._id && dayjs(decodeTime(entry._id)).fromNow()}
                </Text>
              </Flex>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}
