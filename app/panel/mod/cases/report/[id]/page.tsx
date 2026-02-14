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
  Separator,
  Callout,
  Code,
} from "@radix-ui/themes";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  fetchReportDetails,
  resolveReport,
  rejectReport,
  assignReportToCase,
  createCaseFromReport,
  fetchAllCases,
} from "../../../actions";
import { PageTitle } from "@/components/common/navigation/PageTitle";
import {
  ArrowLeftIcon,
  CheckCircledIcon,
  CrossCircledIcon,
  ExclamationTriangleIcon,
  InfoCircledIcon,
  ChatBubbleIcon,
  PersonIcon,
  GlobeIcon,
} from "@radix-ui/react-icons";

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const reportId = params.id as string;

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [assignCaseOpen, setAssignCaseOpen] = useState(false);
  const [createCaseOpen, setCreateCaseOpen] = useState(false);
  const [caseTitle, setCaseTitle] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["report-detail", reportId],
    queryFn: () => fetchReportDetails(reportId),
  });

  const { data: availableCases } = useQuery({
    queryKey: ["all-cases-for-assign"],
    queryFn: () => fetchAllCases("Open"),
    enabled: assignCaseOpen,
  });

  const resolveMutation = useMutation({
    mutationFn: () => resolveReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-detail", reportId] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectReport(reportId, rejectReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-detail", reportId] });
      setRejectOpen(false);
      setRejectReason("");
    },
  });

  const assignMutation = useMutation({
    mutationFn: () => assignReportToCase(reportId, selectedCaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-detail", reportId] });
      setAssignCaseOpen(false);
      setSelectedCaseId("");
    },
  });

  const createCaseMutation = useMutation({
    mutationFn: () => createCaseFromReport(reportId, caseTitle),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["report-detail", reportId] });
      setCreateCaseOpen(false);
      setCaseTitle("");
      router.push(`/panel/mod/cases/${result.caseId}`);
    },
  });

  if (isLoading) {
    return (
      <>
        <PageTitle metadata={{ title: "Report Details" }} />
        <Skeleton width="100%" height="600px" />
      </>
    );
  }

  if (!data) {
    return (
      <>
        <PageTitle metadata={{ title: "Report Not Found" }} />
        <Card>
          <Flex align="center" justify="center" gap="2" py="9">
            <CrossCircledIcon />
            <Text color="gray">Report not found</Text>
          </Flex>
        </Card>
        <Button variant="soft" mt="3" onClick={() => router.back()}>
          <ArrowLeftIcon /> Go Back
        </Button>
      </>
    );
  }

  const report = data.report as any;
  const reportSnapshots = data.snapshots as any[];
  const relatedCase = data.case as any;
  const history = data.history as any[];

  const statusColor =
    report.status === "Created"
      ? "yellow"
      : report.status === "Resolved"
        ? "green"
        : "red";

  return (
    <>
      <Flex align="center" gap="3" mb="4">
        <Button variant="ghost" size="1" onClick={() => router.back()}>
          <ArrowLeftIcon /> Back
        </Button>
      </Flex>

      <Flex justify="between" align="start" mb="4">
        <Flex direction="column" gap="1">
          <Heading size="7">Report Details</Heading>
          <Flex gap="2" align="center">
            <Code size="1" color="gray">
              {report._id}
            </Code>
            <Badge color={statusColor} size="2">
              {report.status}
            </Badge>
            {report._temp_escalated && (
              <Badge color="orange" size="2">
                Escalated
              </Badge>
            )}
          </Flex>
        </Flex>
        {report.status === "Created" && (
          <Flex gap="2">
            <Button
              color="green"
              variant="soft"
              onClick={() => resolveMutation.mutate()}
              disabled={resolveMutation.isPending}
            >
              <CheckCircledIcon /> Resolve
            </Button>
            <Button
              color="red"
              variant="soft"
              onClick={() => setRejectOpen(true)}
            >
              <CrossCircledIcon /> Reject
            </Button>
          </Flex>
        )}
      </Flex>

      <Grid columns={{ initial: "1", md: "3" }} gap="4">
        {/* Main Content */}
        <Flex direction="column" gap="4" style={{ gridColumn: "span 2" }}>
          {/* Report Info */}
          <Card>
            <Flex direction="column" gap="3">
              <Heading size="4">Report Information</Heading>
              <Separator size="4" />

              <Grid columns="2" gap="3">
                <Flex direction="column" gap="1">
                  <Text size="1" color="gray" weight="medium">
                    Reporter
                  </Text>
                  <Link
                    href={`/panel/revolt/inspect/user/${report.author_id}`}
                  >
                    <Text size="2" color="blue">
                      {report.author_id}
                    </Text>
                  </Link>
                </Flex>
                <Flex direction="column" gap="1">
                  <Text size="1" color="gray" weight="medium">
                    Status
                  </Text>
                  <Badge color={statusColor}>{report.status}</Badge>
                </Flex>
                <Flex direction="column" gap="1">
                  <Text size="1" color="gray" weight="medium">
                    Content Type
                  </Text>
                  <Badge variant="outline">
                    {report.content?._type || "Unknown"}
                  </Badge>
                </Flex>
                {report.closed_at && (
                  <Flex direction="column" gap="1">
                    <Text size="1" color="gray" weight="medium">
                      Closed At
                    </Text>
                    <Text size="2">
                      {new Date(report.closed_at).toLocaleString()}
                    </Text>
                  </Flex>
                )}
              </Grid>

              {report.rejection_reason && (
                <Callout.Root color="red" size="1" mt="2">
                  <Callout.Icon>
                    <ExclamationTriangleIcon />
                  </Callout.Icon>
                  <Callout.Text>
                    <Text weight="medium">Rejection Reason: </Text>
                    {report.rejection_reason}
                  </Callout.Text>
                </Callout.Root>
              )}
            </Flex>
          </Card>

          {/* Additional Context */}
          <Card>
            <Flex direction="column" gap="3">
              <Heading size="4">Additional Context</Heading>
              <Separator size="4" />
              {report.additional_context ? (
                <Text size="2" style={{ whiteSpace: "pre-wrap" }}>
                  {report.additional_context}
                </Text>
              ) : (
                <Text size="2" color="gray">
                  No additional context provided
                </Text>
              )}
            </Flex>
          </Card>

          {/* Reported Content */}
          <Card>
            <Flex direction="column" gap="3">
              <Heading size="4">Reported Content</Heading>
              <Separator size="4" />
              <ReportedContentDisplay content={report.content} />
            </Flex>
          </Card>

          {/* Snapshots */}
          {reportSnapshots.length > 0 && (
            <Card>
              <Flex direction="column" gap="3">
                <Heading size="4">
                  Snapshots ({reportSnapshots.length})
                </Heading>
                <Separator size="4" />
                <Flex direction="column" gap="3">
                  {reportSnapshots.map((snapshot: any) => (
                    <SnapshotDisplay key={snapshot._id} snapshot={snapshot} />
                  ))}
                </Flex>
              </Flex>
            </Card>
          )}
        </Flex>

        {/* Sidebar */}
        <Flex direction="column" gap="4">
          {/* Case Association */}
          <Card>
            <Flex direction="column" gap="3">
              <Heading size="4">Case</Heading>
              <Separator size="4" />
              {relatedCase ? (
                <Flex direction="column" gap="2">
                  <Text size="2" weight="medium">
                    {relatedCase.title}
                  </Text>
                  <Flex gap="2" align="center">
                    <Badge
                      color={
                        relatedCase.status === "Open" ? "blue" : "gray"
                      }
                      size="1"
                    >
                      {relatedCase.status}
                    </Badge>
                    <Code size="1">
                      {relatedCase._id.substring(0, 12)}...
                    </Code>
                  </Flex>
                  <Button asChild variant="soft" size="1" mt="1">
                    <Link href={`/panel/mod/cases/${relatedCase._id}`}>
                      View Case
                    </Link>
                  </Button>
                </Flex>
              ) : (
                <Flex direction="column" gap="2">
                  <Text size="2" color="gray">
                    Not assigned to a case
                  </Text>
                  <Flex gap="2">
                    <Button
                      variant="soft"
                      size="1"
                      onClick={() => setAssignCaseOpen(true)}
                    >
                      Assign to Case
                    </Button>
                    <Button
                      variant="soft"
                      size="1"
                      onClick={() => setCreateCaseOpen(true)}
                    >
                      Create Case
                    </Button>
                  </Flex>
                </Flex>
              )}
            </Flex>
          </Card>

          {/* Activity Log */}
          <Card>
            <Flex direction="column" gap="3">
              <Heading size="4">Activity Log</Heading>
              <Separator size="4" />
              {history.length > 0 ? (
                <ScrollArea style={{ maxHeight: "400px" }}>
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
                            <Text size="1" style={{ whiteSpace: "pre-wrap" }}>
                              {entry.text}
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

      {/* Reject Dialog */}
      <Dialog.Root open={rejectOpen} onOpenChange={setRejectOpen}>
        <Dialog.Content>
          <Dialog.Title>Reject Report</Dialog.Title>
          <Dialog.Description size="2" mb="3">
            Provide a reason for rejecting this report.
          </Dialog.Description>
          <TextArea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Rejection reason..."
            rows={4}
          />
          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              color="red"
              onClick={() => rejectMutation.mutate()}
              disabled={!rejectReason || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject Report"}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* Assign to Case Dialog */}
      <Dialog.Root open={assignCaseOpen} onOpenChange={setAssignCaseOpen}>
        <Dialog.Content>
          <Dialog.Title>Assign to Case</Dialog.Title>
          <Dialog.Description size="2" mb="3">
            Select an open case to assign this report to.
          </Dialog.Description>
          {availableCases && availableCases.length > 0 ? (
            <ScrollArea style={{ maxHeight: "300px" }}>
              <Flex direction="column" gap="2">
                {availableCases.map((c) => (
                  <Card
                    key={c._id}
                    variant={selectedCaseId === c._id ? "classic" : "surface"}
                    style={{
                      cursor: "pointer",
                      border:
                        selectedCaseId === c._id
                          ? "2px solid var(--accent-9)"
                          : undefined,
                    }}
                    onClick={() => setSelectedCaseId(c._id)}
                  >
                    <Flex justify="between" align="center">
                      <Flex direction="column" gap="1">
                        <Text size="2" weight="medium">
                          {c.title}
                        </Text>
                        <Flex gap="1">
                          <Code size="1">{c._id.substring(0, 10)}...</Code>
                          <Text size="1" color="gray">
                            {c.reportCount} reports
                          </Text>
                        </Flex>
                      </Flex>
                      <Badge color="blue" size="1">
                        {c.status}
                      </Badge>
                    </Flex>
                  </Card>
                ))}
              </Flex>
            </ScrollArea>
          ) : (
            <Text size="2" color="gray">
              No open cases available
            </Text>
          )}
          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              onClick={() => assignMutation.mutate()}
              disabled={!selectedCaseId || assignMutation.isPending}
            >
              {assignMutation.isPending ? "Assigning..." : "Assign"}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* Create Case Dialog */}
      <Dialog.Root open={createCaseOpen} onOpenChange={setCreateCaseOpen}>
        <Dialog.Content>
          <Dialog.Title>Create Case from Report</Dialog.Title>
          <Dialog.Description size="2" mb="3">
            Create a new case and assign this report to it.
          </Dialog.Description>
          <TextField.Root
            value={caseTitle}
            onChange={(e) => setCaseTitle(e.target.value)}
            placeholder="Case title..."
          />
          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              onClick={() => createCaseMutation.mutate()}
              disabled={!caseTitle || createCaseMutation.isPending}
            >
              {createCaseMutation.isPending ? "Creating..." : "Create Case"}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}

function ReportedContentDisplay({ content }: { content: any }) {
  if (!content) {
    return (
      <Text size="2" color="gray">
        No content data available
      </Text>
    );
  }

  const type = content._type;

  if (type === "Message") {
    return (
      <Flex direction="column" gap="2">
        <Flex gap="2" align="center">
          <ChatBubbleIcon />
          <Text size="2" weight="medium">
            Message
          </Text>
        </Flex>
        <Grid columns="2" gap="2">
          {content._id && (
            <Flex direction="column" gap="1">
              <Text size="1" color="gray">
                Message ID
              </Text>
              <Code size="1">{content._id}</Code>
            </Flex>
          )}
          {content.channel && (
            <Flex direction="column" gap="1">
              <Text size="1" color="gray">
                Channel
              </Text>
              <Code size="1">{content.channel}</Code>
            </Flex>
          )}
          {content.author && (
            <Flex direction="column" gap="1">
              <Text size="1" color="gray">
                Author
              </Text>
              <Link href={`/panel/revolt/inspect/user/${content.author}`}>
                <Text size="1" color="blue">
                  {content.author}
                </Text>
              </Link>
            </Flex>
          )}
        </Grid>
        {content.content && (
          <Card variant="surface" mt="2">
            <Text size="2" style={{ whiteSpace: "pre-wrap" }}>
              {content.content}
            </Text>
          </Card>
        )}
      </Flex>
    );
  }

  if (type === "Server") {
    return (
      <Flex direction="column" gap="2">
        <Flex gap="2" align="center">
          <GlobeIcon />
          <Text size="2" weight="medium">
            Server
          </Text>
        </Flex>
        <Grid columns="2" gap="2">
          {content._id && (
            <Flex direction="column" gap="1">
              <Text size="1" color="gray">
                Server ID
              </Text>
              <Link href={`/panel/revolt/inspect/server/${content._id}`}>
                <Text size="1" color="blue">
                  {content._id}
                </Text>
              </Link>
            </Flex>
          )}
          {content.name && (
            <Flex direction="column" gap="1">
              <Text size="1" color="gray">
                Name
              </Text>
              <Text size="2">{content.name}</Text>
            </Flex>
          )}
          {content.owner && (
            <Flex direction="column" gap="1">
              <Text size="1" color="gray">
                Owner
              </Text>
              <Link href={`/panel/revolt/inspect/user/${content.owner}`}>
                <Text size="1" color="blue">
                  {content.owner}
                </Text>
              </Link>
            </Flex>
          )}
        </Grid>
        {content.description && (
          <Card variant="surface" mt="2">
            <Text size="2" style={{ whiteSpace: "pre-wrap" }}>
              {content.description}
            </Text>
          </Card>
        )}
      </Flex>
    );
  }

  if (type === "User") {
    return (
      <Flex direction="column" gap="2">
        <Flex gap="2" align="center">
          <PersonIcon />
          <Text size="2" weight="medium">
            User
          </Text>
        </Flex>
        <Grid columns="2" gap="2">
          {content._id && (
            <Flex direction="column" gap="1">
              <Text size="1" color="gray">
                User ID
              </Text>
              <Link href={`/panel/revolt/inspect/user/${content._id}`}>
                <Text size="1" color="blue">
                  {content._id}
                </Text>
              </Link>
            </Flex>
          )}
          {content.username && (
            <Flex direction="column" gap="1">
              <Text size="1" color="gray">
                Username
              </Text>
              <Text size="2">{content.username}</Text>
            </Flex>
          )}
        </Grid>
        {content.profile?.content && (
          <Card variant="surface" mt="2">
            <Text size="1" color="gray" mb="1">
              Profile Content
            </Text>
            <Text size="2" style={{ whiteSpace: "pre-wrap" }}>
              {content.profile.content}
            </Text>
          </Card>
        )}
      </Flex>
    );
  }

  // Fallback: render raw JSON
  return (
    <Card variant="surface">
      <Code size="1">
        <pre style={{ whiteSpace: "pre-wrap", maxWidth: "100%" }}>
          {JSON.stringify(content, null, 2)}
        </pre>
      </Code>
    </Card>
  );
}

function SnapshotDisplay({ snapshot }: { snapshot: any }) {
  const content = snapshot.content;
  const type = content?._type;

  return (
    <Card variant="surface">
      <Flex direction="column" gap="2">
        <Flex justify="between" align="center">
          <Flex gap="2" align="center">
            <Badge variant="outline" size="1">
              {type || "Unknown"} Snapshot
            </Badge>
            <Code size="1" color="gray">
              {snapshot._id.substring(0, 12)}...
            </Code>
          </Flex>
        </Flex>

        {type === "Message" && (
          <Flex direction="column" gap="2">
            {/* Prior context */}
            {content._prior_context &&
              content._prior_context.length > 0 && (
                <Flex direction="column" gap="1">
                  <Text size="1" color="gray" weight="medium">
                    Prior Context ({content._prior_context.length} messages)
                  </Text>
                  {content._prior_context.map(
                    (msg: any, idx: number) => (
                      <Card key={idx} variant="surface" size="1">
                        <Flex gap="2" align="start">
                          <Text size="1" color="gray" style={{ minWidth: "80px" }}>
                            {msg.author?.substring(0, 8)}...
                          </Text>
                          <Text size="1">
                            {msg.content || "[no text content]"}
                          </Text>
                        </Flex>
                      </Card>
                    ),
                  )}
                </Flex>
              )}

            {/* Reported message */}
            <Card
              variant="classic"
              size="1"
              style={{
                borderLeft: "3px solid var(--red-9)",
              }}
            >
              <Flex gap="2" align="start">
                <Text size="1" weight="medium" style={{ minWidth: "80px" }}>
                  {content.author?.substring(0, 8)}...
                </Text>
                <Text size="1" weight="medium">
                  {content.content || "[no text content]"}
                </Text>
              </Flex>
            </Card>

            {/* Leading context */}
            {content._leading_context &&
              content._leading_context.length > 0 && (
                <Flex direction="column" gap="1">
                  <Text size="1" color="gray" weight="medium">
                    Following Context (
                    {content._leading_context.length} messages)
                  </Text>
                  {content._leading_context.map(
                    (msg: any, idx: number) => (
                      <Card key={idx} variant="surface" size="1">
                        <Flex gap="2" align="start">
                          <Text size="1" color="gray" style={{ minWidth: "80px" }}>
                            {msg.author?.substring(0, 8)}...
                          </Text>
                          <Text size="1">
                            {msg.content || "[no text content]"}
                          </Text>
                        </Flex>
                      </Card>
                    ),
                  )}
                </Flex>
              )}
          </Flex>
        )}

        {type === "Server" && (
          <Grid columns="2" gap="2">
            {content.name && (
              <Flex direction="column" gap="1">
                <Text size="1" color="gray">Name</Text>
                <Text size="2">{content.name}</Text>
              </Flex>
            )}
            {content._id && (
              <Flex direction="column" gap="1">
                <Text size="1" color="gray">ID</Text>
                <Code size="1">{content._id}</Code>
              </Flex>
            )}
          </Grid>
        )}

        {type === "User" && (
          <Grid columns="2" gap="2">
            {content.username && (
              <Flex direction="column" gap="1">
                <Text size="1" color="gray">Username</Text>
                <Text size="2">{content.username}</Text>
              </Flex>
            )}
            {content._id && (
              <Flex direction="column" gap="1">
                <Text size="1" color="gray">ID</Text>
                <Code size="1">{content._id}</Code>
              </Flex>
            )}
          </Grid>
        )}
      </Flex>
    </Card>
  );
}
