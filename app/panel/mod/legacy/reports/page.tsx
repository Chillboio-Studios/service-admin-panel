"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import {
  Badge,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  Skeleton,
  Table,
  Text,
  TextField,
} from "@radix-ui/themes";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";

import { PageTitle } from "@/components/common/navigation/PageTitle";
import { fetchReportsAction, type ModeratorReport } from "../actions";

export default function ReportsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "open" | "in-review" | "closed" | "dismissed"
  >("all");

  const { data: reports, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: () => fetchReportsAction(),
  });

  const filteredReports =
    reports?.filter((report: ModeratorReport) => {
      if (statusFilter !== "all" && report.status !== statusFilter)
        return false;
      if (search) {
        return (
          report.reported_user_id.toLowerCase().includes(search.toLowerCase()) ||
          report.reason.toLowerCase().includes(search.toLowerCase())
        );
      }
      return true;
    }) || [];

  const stats = {
    open: reports?.filter((r: ModeratorReport) => r.status === "open").length || 0,
    inReview:
      reports?.filter((r: ModeratorReport) => r.status === "in-review").length || 0,
    closed: reports?.filter((r: ModeratorReport) => r.status === "closed").length || 0,
    dismissed:
      reports?.filter((r: ModeratorReport) => r.status === "dismissed").length || 0,
  };

  return (
    <>
      <PageTitle
        metadata={{
          title: "Reports & Cases",
          description: "Manage moderation reports and cases",
        }}
      />

      <Grid columns={{ initial: "2", md: "4" }} gap="2" width="auto">
        <Card>
          <Flex direction="column" gap="1">
            <Text size="1" weight="medium" color="gray">
              Open
            </Text>
            <Heading size="5">{stats.open}</Heading>
          </Flex>
        </Card>
        <Card>
          <Flex direction="column" gap="1">
            <Text size="1" weight="medium" color="gray">
              In Review
            </Text>
            <Heading size="5">{stats.inReview}</Heading>
          </Flex>
        </Card>
        <Card>
          <Flex direction="column" gap="1">
            <Text size="1" weight="medium" color="gray">
              Closed
            </Text>
            <Heading size="5">{stats.closed}</Heading>
          </Flex>
        </Card>
        <Card>
          <Flex direction="column" gap="1">
            <Text size="1" weight="medium" color="gray">
              Dismissed
            </Text>
            <Heading size="5">{stats.dismissed}</Heading>
          </Flex>
        </Card>
      </Grid>

      <Flex direction="column" gap="4">
        <Flex gap="3" direction={{ initial: "column", sm: "row" }}>
          <TextField.Root
            placeholder="Search by user ID or reason..."
            className="flex-grow"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.currentTarget.value)}
          >
            <TextField.Slot>
              <MagnifyingGlassIcon />
            </TextField.Slot>
          </TextField.Root>
          <Button asChild>
            <Link href="/panel/mod/legacy/create-report">New Report</Link>
          </Button>
        </Flex>

        <Flex gap="2">
          {(
            ["all", "open", "in-review", "closed", "dismissed"] as const
          ).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "solid" : "surface"}
              size="2"
              onClick={() => setStatusFilter(status)}
            >
              {status === "in-review" ? "In Review" : status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </Flex>

        {isLoading ? (
          <Skeleton>
            <Card>
              <Text>Loading reports...</Text>
            </Card>
          </Skeleton>
        ) : filteredReports.length > 0 ? (
          <Card>
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>User ID</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Reason</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Created</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {filteredReports.map((report: ModeratorReport) => (
                  <Table.Row key={report._id}>
                    <Table.RowHeaderCell>
                      <Text size="2" weight="medium">
                        {report.reported_user_id.substring(0, 8)}...
                      </Text>
                    </Table.RowHeaderCell>
                    <Table.Cell>
                      <Text size="2">{report.reason}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge
                        color={
                          report.status === "open"
                            ? "blue"
                            : report.status === "in-review"
                              ? "orange"
                              : report.status === "closed"
                                ? "green"
                                : "gray"
                        }
                      >
                        {report.status === "in-review"
                          ? "In Review"
                          : report.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2" color="gray">
                        {new Date(report.created_at).toLocaleDateString()}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Button size="1" variant="outline" asChild>
                        <Link href={`/panel/revolt/inspect?search=${report.reported_user_id}`}>
                          View User
                        </Link>
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
              <Heading size="4">No reports found</Heading>
              <Text color="gray">
                {search
                  ? "Try adjusting your search criteria"
                  : "No reports match the current filters"}
              </Text>
              <Button asChild>
                <Link href="/panel/mod/legacy/create-report">Create Report</Link>
              </Button>
            </Flex>
          </Card>
        )}
      </Flex>
    </>
  );
}
