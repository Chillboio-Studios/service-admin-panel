"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import {
  Badge,
  Button,
  Card,
  Flex,
  Heading,
  Skeleton,
  Table,
  Text,
  TextField,
} from "@radix-ui/themes";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";

import { PageTitle } from "@/components/common/navigation/PageTitle";
import { fetchDiscoverRequestsAction, type DiscoverRequest } from "./actions";

export default function DiscoverPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("pending");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["discover"],
    queryFn: () => fetchDiscoverRequestsAction(),
  });

  const filteredRequests =
    requests?.filter((request: DiscoverRequest) => {
      if (statusFilter !== "all" && request.status !== statusFilter)
        return false;
      if (search) {
        return (
          request.server_name
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          request.reason.toLowerCase().includes(search.toLowerCase())
        );
      }
      return true;
    }) || [];

  const stats = {
    pending:
      requests?.filter((r: DiscoverRequest) => r.status === "pending").length ||
      0,
    approved:
      requests?.filter((r: DiscoverRequest) => r.status === "approved")
        .length || 0,
    rejected:
      requests?.filter((r: DiscoverRequest) => r.status === "rejected").length ||
      0,
  };

  return (
    <>
      <PageTitle
        metadata={{
          title: "Discover",
          description: "Manage Discover server applications",
        }}
      />

      <Flex direction="column" gap="4">
        <Flex gap="4" align="baseline" wrap="wrap">
          <Flex gap="1" direction="column">
            <Text size="1" weight="medium" color="gray">
              Pending Requests
            </Text>
            <Heading size="5">{stats.pending}</Heading>
          </Flex>
          <Flex gap="1" direction="column">
            <Text size="1" weight="medium" color="gray">
              Approved
            </Text>
            <Heading size="5">{stats.approved}</Heading>
          </Flex>
          <Flex gap="1" direction="column">
            <Text size="1" weight="medium" color="gray">
              Rejected
            </Text>
            <Heading size="5">{stats.rejected}</Heading>
          </Flex>
        </Flex>

        <Flex gap="3" direction="column">
          <TextField.Root
            placeholder="Search by server name or reason..."
            className="flex-grow"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.currentTarget.value)}
          >
            <TextField.Slot>
              <MagnifyingGlassIcon />
            </TextField.Slot>
          </TextField.Root>

          <Flex gap="2">
            {(["all", "pending", "approved", "rejected"] as const).map(
              (status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "solid" : "surface"}
                  size="2"
                  onClick={() => setStatusFilter(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ),
            )}
          </Flex>

          {isLoading ? (
            <Skeleton>
              <Card>
                <Text>Loading requests...</Text>
              </Card>
            </Skeleton>
          ) : filteredRequests.length > 0 ? (
            <Card>
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Server</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Reason</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {filteredRequests.map((request: DiscoverRequest) => (
                    <Table.Row key={request._id}>
                      <Table.RowHeaderCell>
                        <Text size="2" weight="medium">
                          {request.server_name}
                        </Text>
                      </Table.RowHeaderCell>
                      <Table.Cell>
                        <Text size="2" color="gray">
                          {request.reason}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge
                          color={
                            request.status === "pending"
                              ? "orange"
                              : request.status === "approved"
                                ? "green"
                                : "red"
                          }
                        >
                          {request.status}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2" color="gray">
                          {new Date(request.created_at).toLocaleDateString()}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Button size="1" variant="outline" disabled>
                          Review
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Card>
          ) : (
            <Card>
              <Flex direction="column" gap="3" align="center">
                <Heading size="4">No requests found</Heading>
                <Text color="gray">
                  {search
                    ? "Try adjusting your search criteria"
                    : `No ${statusFilter} requests at this time`}
                </Text>
              </Flex>
            </Card>
          )}
        </Flex>
      </Flex>
    </>
  );
}
