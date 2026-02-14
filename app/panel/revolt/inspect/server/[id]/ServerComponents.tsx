"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import {
  Badge,
  Button,
  Checkbox,
  Flex,
  Skeleton,
  Table,
  Text,
} from "@radix-ui/themes";

import {
  fetchServerChannels,
  fetchServerMembers,
  fetchServerReports,
  setServerFlags,
} from "./actions";

const SERVER_FLAGS: Record<string, number> = {
  Verified: 1,
  Official: 2,
  Partnered: 4,
  Community: 8,
  Discoverable: 16,
  Safe: 32,
  NSFW: 64,
  "Automod Enabled": 128,
};

export function ServerFlagManager({
  serverId,
  initialFlags,
}: {
  serverId: string;
  initialFlags: number;
}) {
  const [flags, setFlags] = useState(initialFlags);

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await setServerFlags(serverId, flags);
      return result;
    },
  });

  const toggleFlag = (value: number) => {
    setFlags((current) =>
      current & value ? current & ~value : current | value,
    );
  };

  const hasChanges = flags !== initialFlags;

  return (
    <Flex direction="column" gap="2">
      {Object.entries(SERVER_FLAGS).map(([name, value]) => (
        <Text as="label" size="2" key={name}>
          <Flex gap="2" align="center">
            <Checkbox
              checked={!!(flags & value)}
              onCheckedChange={() => toggleFlag(value)}
            />
            {name}
            <Badge color="gray" size="1">
              {value}
            </Badge>
          </Flex>
        </Text>
      ))}

      <Flex gap="2" align="center" mt="2">
        <Button
          disabled={!hasChanges || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? "Saving..." : "Save Flags"}
        </Button>
        <Text size="1" color="gray">
          Current value: {flags}
        </Text>
        {mutation.isSuccess && <Badge color="green">Saved!</Badge>}
        {mutation.isError && <Badge color="red">Error saving flags</Badge>}
      </Flex>
    </Flex>
  );
}

export function ServerChannelsCard({ serverId }: { serverId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["server-channels", serverId],
    queryFn: () => fetchServerChannels(serverId),
  });

  if (isLoading) return <Skeleton height="48px" />;
  if (!data || data.length === 0)
    return <Text size="1" color="gray">No channels found.</Text>;

  return (
    <Table.Root size="1">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>ID</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {data.map((channel: any) => (
          <Table.Row key={channel._id}>
            <Table.Cell>{channel.name || "Unnamed"}</Table.Cell>
            <Table.Cell>
              <Badge color="blue">{channel.channel_type || "Text"}</Badge>
            </Table.Cell>
            <Table.Cell>
              <Text size="1" style={{ fontFamily: "monospace" }}>
                {channel._id}
              </Text>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}

export function ServerMembersCard({ serverId }: { serverId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["server-members", serverId],
    queryFn: () => fetchServerMembers(serverId),
  });

  if (isLoading) return <Skeleton height="48px" />;
  if (!data || data.length === 0)
    return <Text size="1" color="gray">No members found.</Text>;

  return (
    <Table.Root size="1">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Member ID</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Nickname</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {data.map((member: any) => (
          <Table.Row key={member._id}>
            <Table.Cell>
              <Text size="1" style={{ fontFamily: "monospace" }}>
                {typeof member._id === "string"
                  ? member._id.split("_")[0]
                  : member._id?.user || "unknown"}
              </Text>
            </Table.Cell>
            <Table.Cell>{(member as any).nickname || "-"}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}

export function ServerReportsCard({ serverId }: { serverId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["server-reports", serverId],
    queryFn: () => fetchServerReports(serverId),
  });

  if (isLoading) return <Skeleton height="48px" />;
  if (!data || data.length === 0)
    return <Text size="1" color="gray">No reports found.</Text>;

  return (
    <Table.Root size="1">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Report ID</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
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
              <Badge color={(report as any).status === "Closed" ? "gray" : "amber"}>
                {(report as any).status || "Open"}
              </Badge>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}
