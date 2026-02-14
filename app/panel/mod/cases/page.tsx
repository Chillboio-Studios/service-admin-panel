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
  Select,
  Tabs,
  ScrollArea,
} from "@radix-ui/themes";
import Link from "next/link";
import {
  fetchAllCases,
  fetchAllReports,
  createCaseFromReport,
  getCaseStatistics,
  getReportsCaseStats,
  exportCasesAsJSON,
  exportReportsAsJSON,
} from "../actions";
import { PageTitle } from "@/components/common/navigation/PageTitle";
import {
  DownloadIcon,
  MagnifyingGlassIcon,
  CrossCircledIcon,
} from "@radix-ui/react-icons";

export default function CaseManagement() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"cases" | "reports">("cases");
  const [caseFilter, setCaseFilter] = useState<"all" | "open" | "closed">("all");
  const [reportFilter, setReportFilter] = useState<
    "all" | "created" | "resolved" | "rejected"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [createCaseOpen, setCreateCaseOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string>("");
  const [caseTitle, setCaseTitle] = useState("");

  const { data: cases, isLoading: casesLoading } = useQuery({
    queryKey: ["cases", caseFilter],
    queryFn: () =>
      fetchAllCases(
        caseFilter === "all" ? undefined : (caseFilter === "open" ? "Open" : "Closed"),
      ),
  });

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ["reports", reportFilter],
    queryFn: () =>
      fetchAllReports(
        reportFilter === "all"
          ? undefined
          : (reportFilter === "created" ? "Created" : reportFilter === "resolved" ? "Resolved" : "Rejected"),
      ),
  });

  const { data: caseStats } = useQuery({
    queryKey: ["case-stats"],
    queryFn: () => getCaseStatistics(),
  });

  const { data: reportStats } = useQuery({
    queryKey: ["report-stats"],
    queryFn: () => getReportsCaseStats(),
  });

  const createCaseMutation = useMutation({
    mutationFn: () =>
      createCaseFromReport(selectedReport, caseTitle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      setCreateCaseOpen(false);
      setCaseTitle("");
      setSelectedReport("");
    },
  });

  const exportCasesMutation = useMutation({
    mutationFn: () => exportCasesAsJSON(),
    onSuccess: (data) => {
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cases-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
    },
  });

  const exportReportsMutation = useMutation({
    mutationFn: () => exportReportsAsJSON(),
    onSuccess: (data) => {
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reports-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
    },
  });

  const filteredCases =
    cases?.filter(
      (c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c._id.includes(searchQuery),
    ) || [];

  const filteredReports =
    reports?.filter(
      (r) =>
        r._id.includes(searchQuery) ||
        r.author_id.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  return (
    <>
      <PageTitle
        metadata={{
          title: "Case Management",
          description: "Manage moderation cases and reports",
        }}
      />

      <Tabs.Root value={activeTab} onValueChange={setActiveTab as any}>
        <Tabs.List>
          <Tabs.Trigger value="cases">Cases</Tabs.Trigger>
          <Tabs.Trigger value="reports">Reports</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="cases">
          <Flex direction="column" gap="4" style={{ marginTop: "1rem" }}>
            {/* Stats */}
            {caseStats && (
              <Grid columns={{ initial: "1", sm: "2", md: "4" }} gap="3">
                <Card>
                  <Flex direction="column" gap="2">
                    <Text size="1" color="gray" weight="medium">
                      Total Cases
                    </Text>
                    <Heading size="6">{caseStats.totalCases}</Heading>
                  </Flex>
                </Card>
                <Card>
                  <Flex direction="column" gap="2">
                    <Text size="1" color="gray" weight="medium">
                      Open Cases
                    </Text>
                    <Heading size="6">{caseStats.openCases}</Heading>
                  </Flex>
                </Card>
                <Card>
                  <Flex direction="column" gap="2">
                    <Text size="1" color="gray" weight="medium">
                      Closed Cases
                    </Text>
                    <Heading size="6">{caseStats.closedCases}</Heading>
                  </Flex>
                </Card>
                <Card>
                  <Flex direction="column" gap="2">
                    <Text size="1" color="gray" weight="medium">
                      Avg. Reports/Case
                    </Text>
                    <Heading size="6">
                      {caseStats.avgReportsPerCase.toFixed(2)}
                    </Heading>
                  </Flex>
                </Card>
              </Grid>
            )}

            {/* Controls */}
            <Flex gap="3" direction={{ initial: "column", sm: "row" }}>
              <TextField.Root
                placeholder="Search cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-grow"
              >
                <TextField.Slot>
                  <MagnifyingGlassIcon />
                </TextField.Slot>
              </TextField.Root>
              <Button
                onClick={() => exportCasesMutation.mutate()}
                variant="soft"
                disabled={exportCasesMutation.isPending}
              >
                <DownloadIcon /> Export
              </Button>
              <Button
                onClick={() => setCreateCaseOpen(true)}
              >
                New Case
              </Button>
            </Flex>

            {/* Filter */}
            <Flex gap="2">
              <Button
                variant={caseFilter === "all" ? "solid" : "surface"}
                size="2"
                onClick={() => setCaseFilter("all")}
              >
                All
              </Button>
              <Button
                variant={caseFilter === "open" ? "solid" : "surface"}
                size="2"
                onClick={() => setCaseFilter("open")}
              >
                Open
              </Button>
              <Button
                variant={caseFilter === "closed" ? "solid" : "surface"}
                size="2"
                onClick={() => setCaseFilter("closed")}
              >
                Closed
              </Button>
            </Flex>

            {/* Cases Table */}
            {casesLoading ? (
              <Skeleton width="100%" height="400px" />
            ) : filteredCases.length > 0 ? (
              <ScrollArea>
                <Table.Root>
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell>Title</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Author</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Reports</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Categories</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {filteredCases.map((caseItem) => (
                      <Table.Row key={caseItem._id}>
                        <Table.Cell>{caseItem.title}</Table.Cell>
                        <Table.Cell>
                          <Badge
                            color={
                              caseItem.status === "Open" ? "blue" : "gray"
                            }
                          >
                            {caseItem.status}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>{caseItem.author}</Table.Cell>
                        <Table.Cell>{caseItem.reportCount}</Table.Cell>
                        <Table.Cell>
                          <Flex gap="1" wrap="wrap">
                            {caseItem.category.slice(0, 2).map((cat) => (
                              <Badge key={cat} size="1">
                                {cat}
                              </Badge>
                            ))}
                            {caseItem.category.length > 2 && (
                              <Badge size="1" color="gray">
                                +{caseItem.category.length - 2}
                              </Badge>
                            )}
                          </Flex>
                        </Table.Cell>
                        <Table.Cell>
                          <Button
                            asChild
                            size="1"
                            variant="soft"
                          >
                            <Link href={`/panel/mod/cases/${caseItem._id}`}>
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
                <Flex align="center" justify="center" gap="2" py="9">
                  <CrossCircledIcon />
                  <Text color="gray">No cases found</Text>
                </Flex>
              </Card>
            )}
          </Flex>
        </Tabs.Content>

        <Tabs.Content value="reports">
          <Flex direction="column" gap="4" style={{ marginTop: "1rem" }}>
            {/* Stats */}
            {reportStats && (
              <Grid columns={{ initial: "1", sm: "3" }} gap="3">
                <Card>
                  <Flex direction="column" gap="2">
                    <Text size="1" color="gray" weight="medium">
                      Total Reports
                    </Text>
                    <Heading size="6">{reportStats.total}</Heading>
                  </Flex>
                </Card>
                <Card>
                  <Flex direction="column" gap="2">
                    <Text size="1" color="gray" weight="medium">
                      Uncased Reports
                    </Text>
                    <Heading size="6">{reportStats.uncased}</Heading>
                  </Flex>
                </Card>
                <Card>
                  <Flex direction="column" gap="2">
                    <Text size="1" color="gray" weight="medium">
                      In Cases
                    </Text>
                    <Heading size="6">{reportStats.cased}</Heading>
                  </Flex>
                </Card>
              </Grid>
            )}

            {/* Controls */}
            <Flex gap="3" direction={{ initial: "column", sm: "row" }}>
              <TextField.Root
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-grow"
              >
                <TextField.Slot>
                  <MagnifyingGlassIcon />
                </TextField.Slot>
              </TextField.Root>
              <Button
                onClick={() => exportReportsMutation.mutate()}
                variant="soft"
                disabled={exportReportsMutation.isPending}
              >
                <DownloadIcon /> Export
              </Button>
            </Flex>

            {/* Filter */}
            <Flex gap="2">
              <Button
                variant={reportFilter === "all" ? "solid" : "surface"}
                size="2"
                onClick={() => setReportFilter("all")}
              >
                All
              </Button>
              <Button
                variant={reportFilter === "created" ? "solid" : "surface"}
                size="2"
                onClick={() => setReportFilter("created")}
              >
                Created
              </Button>
              <Button
                variant={reportFilter === "resolved" ? "solid" : "surface"}
                size="2"
                onClick={() => setReportFilter("resolved")}
              >
                Resolved
              </Button>
            </Flex>

            {/* Reports Table */}
            {reportsLoading ? (
              <Skeleton width="100%" height="400px" />
            ) : filteredReports.length > 0 ? (
              <ScrollArea>
                <Table.Root>
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell>Report ID</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Author</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Case ID</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Context</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {filteredReports.map((report) => (
                      <Table.Row key={report._id}>
                        <Table.Cell>
                          <Text size="1" weight="medium">
                            {report._id.substring(0, 12)}...
                          </Text>
                        </Table.Cell>
                        <Table.Cell>{report.author_id}</Table.Cell>
                        <Table.Cell>
                          <Badge
                            color={
                              report.status === "Created"
                                ? "yellow"
                                : report.status === "Resolved"
                                  ? "green"
                                  : "red"
                            }
                          >
                            {report.status}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          {report.case_id ? (
                            <Badge size="1">{report.case_id.substring(0, 8)}</Badge>
                          ) : (
                            <Text size="1" color="gray">
                              —
                            </Text>
                          )}
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="1" color="gray">
                            {report.additional_context.substring(0, 40)}...
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Button
                            asChild
                            size="1"
                            variant="soft"
                          >
                            <Link href={`/panel/mod/cases/report/${report._id}`}>
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
                <Flex align="center" justify="center" gap="2" py="9">
                  <CrossCircledIcon />
                  <Text color="gray">No reports found</Text>
                </Flex>
              </Card>
            )}
          </Flex>
        </Tabs.Content>
      </Tabs.Root>

      {/* Create Case Dialog */}
      <Dialog.Root open={createCaseOpen} onOpenChange={setCreateCaseOpen}>
        <Dialog.Content>
          <Dialog.Title>Create Case from Report</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Create a new moderation case from an open report
          </Dialog.Description>

          <Flex direction="column" gap="3">
            <label>
              <Text as="div" size="2" mb="1" weight="medium">
                Select Report
              </Text>
              <Select.Root value={selectedReport} onValueChange={setSelectedReport}>
                <Select.Trigger placeholder="Choose a report..." />
                <Select.Content>
                  {reports?.filter((r) => !r.case_id).map((report) => (
                    <Select.Item key={report._id} value={report._id}>
                      {report._id.substring(0, 20)}... -{" "}
                      {report.additional_context.substring(0, 30)}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </label>

            <label>
              <Text as="div" size="2" mb="1" weight="medium">
                Case Title
              </Text>
              <TextField.Root
                value={caseTitle}
                onChange={(e) => setCaseTitle(e.target.value)}
                placeholder="Brief case title"
              />
            </label>
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              onClick={() => createCaseMutation.mutate()}
              disabled={!selectedReport || !caseTitle || createCaseMutation.isPending}
            >
              {createCaseMutation.isPending ? "Creating..." : "Create Case"}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}
