"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Card,
  Flex,
  Grid,
  Heading,
  Text,
  TextField,
  Button,
  Badge,
  Table,
  Skeleton,
  ScrollArea,
  Select,
  Tabs,
} from "@radix-ui/themes";
import Link from "next/link";
import {
  searchUsers,
  listUsersWithMetrics,
  getUserDistribution,
  getUserTrendsLastDays,
  exportUsersAsJSON,
  exportUsersAsCSV,
} from "./actions";
import { PageTitle } from "@/components/common/navigation/PageTitle";
import {
  MagnifyingGlassIcon,
  DownloadIcon,
} from "@radix-ui/react-icons";

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBot, setFilterBot] = useState<"all" | "humans" | "bots">("all");
  const [filterVerified, setFilterVerified] = useState<"all" | "verified" | "unverified">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "disabled" | "spam">("all");
  const [exportFormat, setExportFormat] = useState<"json" | "csv">("json");

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["search-users", searchQuery],
    queryFn: () => (searchQuery ? searchUsers(searchQuery) : []),
    enabled: searchQuery.length > 0,
  });

  const { data: listedUsers, isLoading: listLoading } = useQuery({
    queryKey: ["list-users", filterBot, filterVerified, filterStatus],
    queryFn: () =>
      listUsersWithMetrics({
        bot: filterBot === "bots" ? true : filterBot === "humans" ? false : undefined,
        verified: filterVerified === "verified" ? true : filterVerified === "unverified" ? false : undefined,
        status: filterStatus === "all" ? undefined : (filterStatus as any),
      }),
  });

  const { data: distribution } = useQuery({
    queryKey: ["user-distribution"],
    queryFn: () => getUserDistribution(),
  });

  const { data: trends } = useQuery({
    queryKey: ["user-trends"],
    queryFn: () => getUserTrendsLastDays(30),
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      if (exportFormat === "json") {
        return exportUsersAsJSON({
          bot: filterBot === "bots" ? true : filterBot === "humans" ? false : undefined,
          verified: filterVerified === "verified" ? true : filterVerified === "unverified" ? false : undefined,
          status: filterStatus === "all" ? undefined : (filterStatus as any),
        });
      } else {
        return exportUsersAsCSV({
          bot: filterBot === "bots" ? true : filterBot === "humans" ? false : undefined,
          verified: filterVerified === "verified" ? true : filterVerified === "unverified" ? false : undefined,
          status: filterStatus === "all" ? undefined : (filterStatus as any),
        });
      }
    },
    onSuccess: (data) => {
      const mimeType = exportFormat === "json" ? "application/json" : "text/csv";
      const ext = exportFormat;
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-${new Date().toISOString().split("T")[0]}.${ext}`;
      a.click();
    },
  });

  const displayUsers = searchQuery ? searchResults : listedUsers;
  const isLoading = searchQuery ? searchLoading : listLoading;

  return (
    <>
      <PageTitle
        metadata={{
          title: "User Management",
          description: "Manage and monitor platform users",
        }}
      />

      {/* Statistics */}
      {distribution && (
        <Grid columns={{ initial: "1", sm: "2", md: "4" }} gap="3" mb="6">
          <Card>
            <Flex direction="column" gap="2">
              <Text size="1" weight="medium" color="gray">
                Total Users
              </Text>
              <Heading size="6">{distribution.total}</Heading>
            </Flex>
          </Card>
          <Card>
            <Flex direction="column" gap="2">
              <Text size="1" weight="medium" color="gray">
                Humans
              </Text>
              <Heading size="6">{distribution.humans}</Heading>
            </Flex>
          </Card>
          <Card>
            <Flex direction="column" gap="2">
              <Text size="1" weight="medium" color="gray">
                Bots
              </Text>
              <Heading size="6">{distribution.bots}</Heading>
            </Flex>
          </Card>
          <Card>
            <Flex direction="column" gap="2">
              <Text size="1" weight="medium" color="gray">
                Disabled/Spam
              </Text>
              <Heading size="6">{distribution.disabled + distribution.spam}</Heading>
            </Flex>
          </Card>
        </Grid>
      )}

      {/* Search & Filters */}
      <Flex gap="3" direction={{ initial: "column", sm: "row" }} mb="6">
        <TextField.Root
          placeholder="Search users by ID or username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-grow"
        >
          <TextField.Slot>
            <MagnifyingGlassIcon />
          </TextField.Slot>
        </TextField.Root>
        <Button
          onClick={() => exportMutation.mutate()}
          variant="soft"
          disabled={exportMutation.isPending}
        >
          <DownloadIcon /> Export
        </Button>
      </Flex>

      {/* Filters */}
      <Flex gap="2" mb="6" wrap="wrap">
        <Select.Root value={filterBot} onValueChange={(v) => setFilterBot(v as any)}>
          <Select.Trigger placeholder="User Type" />
          <Select.Content>
            <Select.Item value="all">All Users</Select.Item>
            <Select.Item value="humans">Humans</Select.Item>
            <Select.Item value="bots">Bots</Select.Item>
          </Select.Content>
        </Select.Root>

        <Select.Root value={filterVerified} onValueChange={(v) => setFilterVerified(v as any)}>
          <Select.Trigger placeholder="Verification" />
          <Select.Content>
            <Select.Item value="all">All</Select.Item>
            <Select.Item value="verified">Verified</Select.Item>
            <Select.Item value="unverified">Unverified</Select.Item>
          </Select.Content>
        </Select.Root>

        <Select.Root value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
          <Select.Trigger placeholder="Account Status" />
          <Select.Content>
            <Select.Item value="all">All Statuses</Select.Item>
            <Select.Item value="active">Active</Select.Item>
            <Select.Item value="disabled">Disabled</Select.Item>
            <Select.Item value="spam">Spam Flagged</Select.Item>
          </Select.Content>
        </Select.Root>
      </Flex>

      {/* Users Table */}
      {isLoading ? (
        <Skeleton width="100%" height="400px" />
      ) : displayUsers && displayUsers.length > 0 ? (
        <ScrollArea>
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>User ID</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Username</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Verified</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Reports</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {displayUsers.map((user) => (
                <Table.Row key={user._id}>
                  <Table.Cell>
                    <Text size="1" weight="medium">
                      {user._id.substring(0, 12)}...
                    </Text>
                  </Table.Cell>
                  <Table.Cell>{user.username}</Table.Cell>
                  <Table.Cell>
                    <Badge color={user.bot ? "blue" : "green"}>
                      {user.bot ? "Bot" : "Human"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={user.verified ? "green" : "gray"}>
                      {user.verified ? "✓" : "✗"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      color={
                        (user as any).accountStatus === "active"
                          ? "green"
                          : (user as any).accountStatus === "disabled"
                            ? "red"
                            : "orange"
                      }
                    >
                      {(user as any).accountStatus || "unknown"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {(user as any).reportsCount || 0}
                  </Table.Cell>
                  <Table.Cell>
                    <Button asChild size="1" variant="soft">
                      <Link href={`/panel/revolt/inspect/user/${user._id}`}>
                        View
                      </Link>
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </ScrollArea>
      ) : (
        <Card>
          <Text color="gray">No users found</Text>
        </Card>
      )}
    </>
  );
}
