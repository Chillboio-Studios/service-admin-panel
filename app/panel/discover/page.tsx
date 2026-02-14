"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Card,
  Flex,
  Grid,
  Heading,
  Text,
  Button,
  Dialog,
  TextField,
  Badge,
  Table,
  Skeleton,
  TextArea,
  ScrollArea,
} from "@radix-ui/themes";
import {
  fetchDiscoverQueue,
  getDiscoverStats,
  approveDiscoverItem,
  rejectDiscoverItem,
  searchDiscoverItems,
  exportDiscoverQueueAsJSON,
} from "./actions";
import { PageTitle } from "@/components/common/navigation/PageTitle";
import {
  MagnifyingGlassIcon,
  DownloadIcon,
  CheckCircledIcon,
  CrossCircledIcon,
} from "@radix-ui/react-icons";

export default function DiscoverQueue() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ["discover-queue", statusFilter, searchQuery],
    queryFn: () =>
      searchQuery
        ? searchDiscoverItems(searchQuery)
        : fetchDiscoverQueue(
            statusFilter === "all" ? undefined : (statusFilter as any),
          ),
  });

  const { data: stats } = useQuery({
    queryKey: ["discover-stats"],
    queryFn: () => getDiscoverStats(),
  });

  const approveMutation = useMutation({
    mutationFn: (itemId: string) => approveDiscoverItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discover-queue"] });
      queryClient.invalidateQueries({ queryKey: ["discover-stats"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (itemId: string) => rejectDiscoverItem(itemId, rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discover-queue"] });
      queryClient.invalidateQueries({ queryKey: ["discover-stats"] });
      setRejectDialogOpen(false);
      setSelectedItemId("");
      setRejectionReason("");
    },
  });

  const exportMutation = useMutation({
    mutationFn: () => exportDiscoverQueueAsJSON(),
    onSuccess: (data) => {
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `discover-queue-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
    },
  });

  return (
    <>
      <PageTitle
        metadata={{
          title: "Discover Queue Management",
          description: "Review and manage Discover applications",
        }}
      />

      {/* Statistics */}
      {stats && (
        <Grid columns={{ initial: "1", sm: "2", md: "4" }} gap="3" mb="6">
          <Card>
            <Flex direction="column" gap="2">
              <Text size="1" weight="medium" color="gray">
                Pending
              </Text>
              <Heading size="6">{stats.pending}</Heading>
            </Flex>
          </Card>
          <Card>
            <Flex direction="column" gap="2">
              <Text size="1" weight="medium" color="gray">
                Approved
              </Text>
              <Heading size="6">{stats.approved}</Heading>
            </Flex>
          </Card>
          <Card>
            <Flex direction="column" gap="2">
              <Text size="1" weight="medium" color="gray">
                Rejected
              </Text>
              <Heading size="6">{stats.rejected}</Heading>
            </Flex>
          </Card>
          <Card>
            <Flex direction="column" gap="2">
              <Text size="1" weight="medium" color="gray">
                Approval Rate
              </Text>
              <Heading size="6">{stats.approvalRate}%</Heading>
            </Flex>
          </Card>
        </Grid>
      )}

      {/* Controls */}
      <Flex gap="3" direction={{ initial: "column", sm: "row" }} mb="6">
        <TextField.Root
          placeholder="Search items..."
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

      {/* Filter */}
      <Flex gap="2" mb="6">
        <Button
          variant={statusFilter === "pending" ? "solid" : "surface"}
          onClick={() => setStatusFilter("pending")}
        >
          Pending
        </Button>
        <Button
          variant={statusFilter === "approved" ? "solid" : "surface"}
          onClick={() => setStatusFilter("approved")}
        >
          Approved
        </Button>
        <Button
          variant={statusFilter === "rejected" ? "solid" : "surface"}
          onClick={() => setStatusFilter("rejected")}
        >
          Rejected
        </Button>
        <Button
          variant={statusFilter === "all" ? "solid" : "surface"}
          onClick={() => setStatusFilter("all")}
        >
          All
        </Button>
      </Flex>

      {/* Items Table */}
      {itemsLoading ? (
        <Skeleton width="100%" height="400px" />
      ) : items && items.length > 0 ? (
        <ScrollArea>
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Reviews</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Created</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {items.map((item) => (
                <Table.Row key={item._id}>
                  <Table.Cell>
                    <Text weight="medium">{item.name}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="1" color="gray">
                      {item.description.substring(0, 30)}...
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      color={
                        item.status === "pending"
                          ? "yellow"
                          : item.status === "approved"
                            ? "green"
                            : "red"
                      }
                    >
                      {item.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>{item.requestCount}</Table.Cell>
                  <Table.Cell>
                    <Text size="1" color="gray">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    {item.status === "pending" && (
                      <Flex gap="1">
                        <Button
                          size="1"
                          color="green"
                          variant="soft"
                          onClick={() => approveMutation.mutate(item._id)}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircledIcon />
                        </Button>
                        <Button
                          size="1"
                          color="red"
                          variant="soft"
                          onClick={() => {
                            setSelectedItemId(item._id);
                            setRejectDialogOpen(true);
                          }}
                        >
                          <CrossCircledIcon />
                        </Button>
                      </Flex>
                    )}
                    {item.status !== "pending" && (
                      <Text size="1" color="gray">—</Text>
                    )}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </ScrollArea>
      ) : (
        <Card>
          <Text color="gray">No items in queue</Text>
        </Card>
      )}

      {/* Rejection Dialog */}
      <Dialog.Root open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <Dialog.Content>
          <Dialog.Title>Reject Discover Item</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Provide a reason for rejecting this item
          </Dialog.Description>

          <label>
            <Text as="div" size="2" mb="1" weight="medium">
              Rejection Reason
            </Text>
            <TextArea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this item is being rejected..."
            />
          </label>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              color="red"
              onClick={() => rejectMutation.mutate(selectedItemId)}
              disabled={!rejectionReason || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject"}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}
