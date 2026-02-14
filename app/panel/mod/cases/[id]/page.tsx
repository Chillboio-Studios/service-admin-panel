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
  ScrollArea,
  Separator,
  Callout,
  Code,
} from "@radix-ui/themes";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  fetchCaseDetails,
  updateCaseStatus,
  updateCaseCategory,
  addCaseNote,
  mergeReportsIntoCase,
  searchReports,
  updateCaseTitle,
} from "../../actions";
import { PageTitle } from "@/components/common/navigation/PageTitle";
import {
  ArrowLeftIcon,
  CheckCircledIcon,
  CrossCircledIcon,
  Pencil1Icon,
  PlusIcon,
  InfoCircledIcon,
} from "@radix-ui/react-icons";

const PROBLEM_CATEGORIES = [
  "Invalid",
  "False",
  "Report Spam",
  "Not Enough Evidence",
  "Clarification Needed",
  "Bridged Content",
  "Acknowledge",
  "Duplicate",
  "Ignore",
];

const CONTENT_CATEGORIES = [
  "Extremism",
  "Misinformation",
  "Hate Conduct",
  "Self Harm",
  "Illegal Behaviour",
  "Off Platform",
  "Illegal Content",
  "Harassment",
  "Raiding",
  "Rights Infringement",
  "Gore",
  "Malware",
  "Impersonation",
  "Underage",
  "Underage Sexual Content",
  "Underage Sexual Conduct",
  "Underage Unsafe Conduct",
  "Explicit Content",
  "Unsolicited Advertising",
  "Fraud",
  "Account Trade",
  "Artificial Growth",
  "Evasion",
  "Hacking",
  "Unauthorised Access",
  "Abuse",
  "Spam",
  "User Bot",
  "Misleading Team",
];

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const caseId = params.id as string;

  const [editNotesOpen, setEditNotesOpen] = useState(false);
  const [editTitleOpen, setEditTitleOpen] = useState(false);
  const [editCategoryOpen, setEditCategoryOpen] = useState(false);
  const [mergeReportsOpen, setMergeReportsOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [titleText, setTitleText] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [reportSearchQuery, setReportSearchQuery] = useState("");
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["case-detail", caseId],
    queryFn: () => fetchCaseDetails(caseId),
  });

  const { data: searchedReports, isLoading: searchingReports } = useQuery({
    queryKey: ["report-search", reportSearchQuery],
    queryFn: () => searchReports(reportSearchQuery),
    enabled: reportSearchQuery.length > 2,
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus: "Open" | "Closed") =>
      updateCaseStatus(caseId, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-detail", caseId] });
    },
  });

  const categoryMutation = useMutation({
    mutationFn: (categories: string[]) =>
      updateCaseCategory(caseId, categories),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-detail", caseId] });
      setEditCategoryOpen(false);
    },
  });

  const noteMutation = useMutation({
    mutationFn: (note: string) => addCaseNote(caseId, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-detail", caseId] });
      setEditNotesOpen(false);
      setNoteText("");
    },
  });

  const titleMutation = useMutation({
    mutationFn: (title: string) => updateCaseTitle(caseId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-detail", caseId] });
      setEditTitleOpen(false);
    },
  });

  const mergeMutation = useMutation({
    mutationFn: (reportIds: string[]) =>
      mergeReportsIntoCase(caseId, reportIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-detail", caseId] });
      setMergeReportsOpen(false);
      setSelectedReportIds([]);
      setReportSearchQuery("");
    },
  });

  if (isLoading) {
    return (
      <>
        <PageTitle metadata={{ title: "Case Details" }} />
        <Skeleton width="100%" height="600px" />
      </>
    );
  }

  if (!data) {
    return (
      <>
        <PageTitle metadata={{ title: "Case Not Found" }} />
        <Card>
          <Flex align="center" justify="center" gap="2" py="9">
            <CrossCircledIcon />
            <Text color="gray">Case not found</Text>
          </Flex>
        </Card>
        <Button variant="soft" mt="3" onClick={() => router.back()}>
          <ArrowLeftIcon /> Go Back
        </Button>
      </>
    );
  }

  const caseDoc = data.case as any;
  const relatedReports = data.reports as any[];
  const history = data.history as any[];

  return (
    <>
      <Flex align="center" gap="3" mb="4">
        <Button variant="ghost" size="1" onClick={() => router.push("/panel/mod/cases")}>
          <ArrowLeftIcon /> Back to Cases
        </Button>
      </Flex>

      <Flex justify="between" align="start" mb="4">
        <Flex direction="column" gap="1">
          <Flex align="center" gap="2">
            <Heading size="7">{caseDoc.title}</Heading>
            <Button
              variant="ghost"
              size="1"
              onClick={() => {
                setTitleText(caseDoc.title);
                setEditTitleOpen(true);
              }}
            >
              <Pencil1Icon />
            </Button>
          </Flex>
          <Flex gap="2" align="center">
            <Code size="1" color="gray">
              {caseDoc._id}
            </Code>
            <Badge
              color={caseDoc.status === "Open" ? "blue" : "gray"}
              size="2"
            >
              {caseDoc.status}
            </Badge>
          </Flex>
        </Flex>
        <Flex gap="2">
          {caseDoc.status === "Open" ? (
            <Button
              color="red"
              variant="soft"
              onClick={() => statusMutation.mutate("Closed")}
              disabled={statusMutation.isPending}
            >
              <CrossCircledIcon /> Close Case
            </Button>
          ) : (
            <Button
              color="green"
              variant="soft"
              onClick={() => statusMutation.mutate("Open")}
              disabled={statusMutation.isPending}
            >
              <CheckCircledIcon /> Reopen Case
            </Button>
          )}
        </Flex>
      </Flex>

      <Grid columns={{ initial: "1", md: "3" }} gap="4">
        {/* Main Content - 2 columns */}
        <Flex direction="column" gap="4" style={{ gridColumn: "span 2" }}>
          {/* Case Info */}
          <Card>
            <Flex direction="column" gap="3">
              <Heading size="4">Case Information</Heading>
              <Separator size="4" />

              <Grid columns="2" gap="3">
                <Flex direction="column" gap="1">
                  <Text size="1" color="gray" weight="medium">
                    Author
                  </Text>
                  <Text size="2">{caseDoc.author}</Text>
                </Flex>
                <Flex direction="column" gap="1">
                  <Text size="1" color="gray" weight="medium">
                    Status
                  </Text>
                  <Badge
                    color={caseDoc.status === "Open" ? "blue" : "gray"}
                  >
                    {caseDoc.status}
                  </Badge>
                </Flex>
                {caseDoc.closed_at && (
                  <Flex direction="column" gap="1">
                    <Text size="1" color="gray" weight="medium">
                      Closed At
                    </Text>
                    <Text size="2">
                      {new Date(caseDoc.closed_at).toLocaleString()}
                    </Text>
                  </Flex>
                )}
                <Flex direction="column" gap="1">
                  <Text size="1" color="gray" weight="medium">
                    Reports
                  </Text>
                  <Text size="2">{relatedReports.length}</Text>
                </Flex>
              </Grid>
            </Flex>
          </Card>

          {/* Categories */}
          <Card>
            <Flex direction="column" gap="3">
              <Flex justify="between" align="center">
                <Heading size="4">Categories</Heading>
                <Button
                  variant="soft"
                  size="1"
                  onClick={() => {
                    setSelectedCategories(caseDoc.category || []);
                    setEditCategoryOpen(true);
                  }}
                >
                  <Pencil1Icon /> Edit
                </Button>
              </Flex>
              <Separator size="4" />
              {caseDoc.category && caseDoc.category.length > 0 ? (
                <Flex gap="2" wrap="wrap">
                  {caseDoc.category.map((cat: string) => (
                    <Badge key={cat} size="2">
                      {cat}
                    </Badge>
                  ))}
                </Flex>
              ) : (
                <Text size="2" color="gray">
                  No categories assigned
                </Text>
              )}
            </Flex>
          </Card>

          {/* Notes */}
          <Card>
            <Flex direction="column" gap="3">
              <Flex justify="between" align="center">
                <Heading size="4">Notes</Heading>
                <Button
                  variant="soft"
                  size="1"
                  onClick={() => {
                    setNoteText(caseDoc.notes || "");
                    setEditNotesOpen(true);
                  }}
                >
                  <Pencil1Icon /> Edit
                </Button>
              </Flex>
              <Separator size="4" />
              {caseDoc.notes ? (
                <Text
                  size="2"
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {caseDoc.notes}
                </Text>
              ) : (
                <Text size="2" color="gray">
                  No notes added
                </Text>
              )}
            </Flex>
          </Card>

          {/* Related Reports */}
          <Card>
            <Flex direction="column" gap="3">
              <Flex justify="between" align="center">
                <Heading size="4">
                  Related Reports ({relatedReports.length})
                </Heading>
                <Button
                  variant="soft"
                  size="1"
                  onClick={() => setMergeReportsOpen(true)}
                >
                  <PlusIcon /> Add Reports
                </Button>
              </Flex>
              <Separator size="4" />
              {relatedReports.length > 0 ? (
                <ScrollArea style={{ maxHeight: "400px" }}>
                  <Table.Root>
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeaderCell>
                          Report ID
                        </Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Author</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {relatedReports.map((report: any) => (
                        <Table.Row key={report._id}>
                          <Table.Cell>
                            <Code size="1">
                              {report._id.substring(0, 12)}...
                            </Code>
                          </Table.Cell>
                          <Table.Cell>
                            <Link
                              href={`/panel/revolt/inspect/user/${report.author_id}`}
                            >
                              <Text size="1" color="blue">
                                {report.author_id.substring(0, 10)}...
                              </Text>
                            </Link>
                          </Table.Cell>
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
                            <Badge variant="outline" size="1">
                              {report.content?._type || "Unknown"}
                            </Badge>
                          </Table.Cell>
                          <Table.Cell>
                            <Button asChild size="1" variant="soft">
                              <Link
                                href={`/panel/mod/cases/report/${report._id}`}
                              >
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
                <Flex align="center" justify="center" py="6">
                  <Text color="gray" size="2">
                    No reports linked to this case
                  </Text>
                </Flex>
              )}
            </Flex>
          </Card>
        </Flex>

        {/* Sidebar - History */}
        <Flex direction="column" gap="4">
          <Card>
            <Flex direction="column" gap="3">
              <Heading size="4">Activity Log</Heading>
              <Separator size="4" />
              {history.length > 0 ? (
                <ScrollArea style={{ maxHeight: "600px" }}>
                  <Flex direction="column" gap="3">
                    {history.map((entry: any) => (
                      <Card key={entry._id} variant="surface" size="1">
                        <Flex direction="column" gap="1">
                          <Flex justify="between" align="center">
                            <Badge size="1" variant="outline">
                              {entry.type}
                            </Badge>
                            <Text size="1" color="gray">
                              {entry.userEmail?.split("@")[0] || "System"}
                            </Text>
                          </Flex>
                          {entry.text && (
                            <Text
                              size="1"
                              style={{ whiteSpace: "pre-wrap" }}
                            >
                              {entry.text}
                            </Text>
                          )}
                          {entry.status && (
                            <Text size="1">
                              Status changed to{" "}
                              <Badge size="1">{entry.status}</Badge>
                            </Text>
                          )}
                          {entry.category && (
                            <Text size="1">
                              Category set to{" "}
                              <Badge size="1">{entry.category}</Badge>
                            </Text>
                          )}
                          {entry.title && (
                            <Text size="1">
                              Title changed to &quot;{entry.title}&quot;
                            </Text>
                          )}
                          {entry.reportId && (
                            <Text size="1">
                              Reports added: {entry.reportId}
                            </Text>
                          )}
                        </Flex>
                      </Card>
                    ))}
                  </Flex>
                </ScrollArea>
              ) : (
                <Text size="2" color="gray">
                  No activity yet
                </Text>
              )}
            </Flex>
          </Card>
        </Flex>
      </Grid>

      {/* Edit Title Dialog */}
      <Dialog.Root open={editTitleOpen} onOpenChange={setEditTitleOpen}>
        <Dialog.Content>
          <Dialog.Title>Edit Case Title</Dialog.Title>
          <Flex direction="column" gap="3" mt="3">
            <TextField.Root
              value={titleText}
              onChange={(e) => setTitleText(e.target.value)}
              placeholder="Case title"
            />
          </Flex>
          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              onClick={() => titleMutation.mutate(titleText)}
              disabled={!titleText || titleMutation.isPending}
            >
              {titleMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* Edit Notes Dialog */}
      <Dialog.Root open={editNotesOpen} onOpenChange={setEditNotesOpen}>
        <Dialog.Content>
          <Dialog.Title>Edit Case Notes</Dialog.Title>
          <Flex direction="column" gap="3" mt="3">
            <TextArea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Case notes..."
              rows={6}
            />
          </Flex>
          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              onClick={() => noteMutation.mutate(noteText)}
              disabled={noteMutation.isPending}
            >
              {noteMutation.isPending ? "Saving..." : "Save Notes"}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* Edit Categories Dialog */}
      <Dialog.Root open={editCategoryOpen} onOpenChange={setEditCategoryOpen}>
        <Dialog.Content style={{ maxWidth: "600px" }}>
          <Dialog.Title>Edit Categories</Dialog.Title>
          <Dialog.Description size="2" mb="3">
            Select applicable categories for this case.
          </Dialog.Description>

          <Flex direction="column" gap="4">
            <Flex direction="column" gap="2">
              <Text size="2" weight="medium">
                Problem Type
              </Text>
              <Flex gap="2" wrap="wrap">
                {PROBLEM_CATEGORIES.map((cat) => (
                  <Button
                    key={cat}
                    size="1"
                    variant={
                      selectedCategories.includes(cat) ? "solid" : "outline"
                    }
                    onClick={() =>
                      setSelectedCategories((prev) =>
                        prev.includes(cat)
                          ? prev.filter((c) => c !== cat)
                          : [...prev, cat],
                      )
                    }
                  >
                    {cat}
                  </Button>
                ))}
              </Flex>
            </Flex>

            <Separator size="4" />

            <Flex direction="column" gap="2">
              <Text size="2" weight="medium">
                Content Category
              </Text>
              <Flex gap="2" wrap="wrap">
                {CONTENT_CATEGORIES.map((cat) => (
                  <Button
                    key={cat}
                    size="1"
                    variant={
                      selectedCategories.includes(cat) ? "solid" : "outline"
                    }
                    onClick={() =>
                      setSelectedCategories((prev) =>
                        prev.includes(cat)
                          ? prev.filter((c) => c !== cat)
                          : [...prev, cat],
                      )
                    }
                  >
                    {cat}
                  </Button>
                ))}
              </Flex>
            </Flex>
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              onClick={() => categoryMutation.mutate(selectedCategories)}
              disabled={categoryMutation.isPending}
            >
              {categoryMutation.isPending ? "Saving..." : "Save Categories"}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* Merge Reports Dialog */}
      <Dialog.Root open={mergeReportsOpen} onOpenChange={setMergeReportsOpen}>
        <Dialog.Content style={{ maxWidth: "600px" }}>
          <Dialog.Title>Add Reports to Case</Dialog.Title>
          <Dialog.Description size="2" mb="3">
            Search for reports to add to this case.
          </Dialog.Description>

          <Flex direction="column" gap="3">
            <TextField.Root
              placeholder="Search by report ID, author, or context..."
              value={reportSearchQuery}
              onChange={(e) => setReportSearchQuery(e.target.value)}
            />

            {searchingReports && <Skeleton width="100%" height="100px" />}

            {searchedReports && searchedReports.length > 0 && (
              <ScrollArea style={{ maxHeight: "300px" }}>
                <Table.Root size="1">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell />
                      <Table.ColumnHeaderCell>ID</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Author</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {searchedReports
                      .filter(
                        (r) =>
                          !r.case_id ||
                          r.case_id === caseId,
                      )
                      .map((report) => (
                        <Table.Row key={report._id}>
                          <Table.Cell>
                            <input
                              type="checkbox"
                              checked={selectedReportIds.includes(report._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedReportIds((prev) => [
                                    ...prev,
                                    report._id,
                                  ]);
                                } else {
                                  setSelectedReportIds((prev) =>
                                    prev.filter((id) => id !== report._id),
                                  );
                                }
                              }}
                              disabled={report.case_id === caseId}
                            />
                          </Table.Cell>
                          <Table.Cell>
                            <Code size="1">
                              {report._id.substring(0, 12)}...
                            </Code>
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
                              size="1"
                            >
                              {report.status}
                            </Badge>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                  </Table.Body>
                </Table.Root>
              </ScrollArea>
            )}

            {searchedReports && searchedReports.length === 0 && (
              <Text size="2" color="gray" align="center">
                No reports found
              </Text>
            )}

            {selectedReportIds.length > 0 && (
              <Callout.Root size="1">
                <Callout.Icon>
                  <InfoCircledIcon />
                </Callout.Icon>
                <Callout.Text>
                  {selectedReportIds.length} report(s) selected
                </Callout.Text>
              </Callout.Root>
            )}
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              onClick={() => mergeMutation.mutate(selectedReportIds)}
              disabled={
                selectedReportIds.length === 0 || mergeMutation.isPending
              }
            >
              {mergeMutation.isPending
                ? "Adding..."
                : `Add ${selectedReportIds.length} Report(s)`}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}
