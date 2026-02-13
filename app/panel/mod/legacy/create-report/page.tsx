"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  Button,
  Card,
  Flex,
  Heading,
  Text,
  TextArea,
  TextField,
} from "@radix-ui/themes";

import { PageTitle } from "@/components/common/navigation/PageTitle";
import { createReportAction } from "../actions";

export default function CreateReportPage() {
  const router = useRouter();
  const [reportedUserId, setReportedUserId] = useState("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      await createReportAction(reportedUserId, reason, details);
    },
    onSuccess: () => {
      router.push("/panel/mod/legacy/reports");
    },
  });

  return (
    <>
      <PageTitle
        metadata={{
          title: "Create Report",
          description: "File a new moderation report",
        }}
      />

      <Card className="max-w-2xl">
        <Flex direction="column" gap="4">
          <Flex direction="column">
            <Heading size="5">Create Moderation Report</Heading>
            <Text color="gray" size="2">
              File a new report for content violation or user misconduct
            </Text>
          </Flex>

          <Flex direction="column" gap="3">
            <Flex direction="column" gap="2">
              <Text weight="medium" size="2">
                Reported User ID *
              </Text>
              <TextField.Root
                placeholder="User ID or email"
                value={reportedUserId}
                onChange={(e) => setReportedUserId(e.currentTarget.value)}
              />
              <Text size="1" color="gray">
                The ID or email of the user being reported
              </Text>
            </Flex>

            <Flex direction="column" gap="2">
              <Text weight="medium" size="2">
                Reason for Report *
              </Text>
              <TextField.Root
                placeholder="E.g., Harassment, Spam, Hate Speech"
                value={reason}
                onChange={(e) => setReason(e.currentTarget.value)}
              />
            </Flex>

            <Flex direction="column" gap="2">
              <Text weight="medium" size="2">
                Details *
              </Text>
              <TextArea
                placeholder="Provide detailed information about the violation, including timestamps and links to relevant content if applicable"
                value={details}
                onChange={(e) => setDetails(e.currentTarget.value)}
                rows={8}
              />
            </Flex>

            <Flex gap="3" justify="end" pt="2">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={() => mutation.mutate()}
                disabled={
                  !reportedUserId || !reason || !details || mutation.isPending
                }
              >
                {mutation.isPending ? "Creating..." : "Create Report"}
              </Button>
            </Flex>

            {mutation.error && (
              <Text color="red" size="2">
                Error: {String(mutation.error)}
              </Text>
            )}
          </Flex>
        </Flex>
      </Card>
    </>
  );
}

export default function CreateReportPage() {
  const router = useRouter();
  const [reportedUserId, setReportedUserId] = useState("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      await createReportAction(reportedUserId, reason, details);
    },
    onSuccess: () => {
      router.push("/panel/mod/legacy/reports");
    },
  });

  return (
    <>
      <PageTitle
        metadata={{
          title: "Create Report",
          description: "File a new moderation report",
        }}
      />

      <Card className="max-w-2xl">
        <Flex direction="column" gap="4">
          <Flex direction="column">
            <Heading size="5">Create Moderation Report</Heading>
            <Text color="gray" size="2">
              File a new report for content violation or user misconduct
            </Text>
          </Flex>

          <Flex direction="column" gap="3">
            <Flex direction="column" gap="2">
              <Text weight="medium" size="2">
                Reported User ID *
              </Text>
              <TextField.Root
                placeholder="User ID or email"
                value={reportedUserId}
                onChange={(e) => setReportedUserId(e.currentTarget.value)}
              />
              <Text size="1" color="gray">
                The ID or email of the user being reported
              </Text>
            </Flex>

            <Flex direction="column" gap="2">
              <Text weight="medium" size="2">
                Reason for Report *
              </Text>
              <TextField.Root
                placeholder="E.g., Harassment, Spam, Hate Speech"
                value={reason}
                onChange={(e) => setReason(e.currentTarget.value)}
              />
            </Flex>

            <Flex direction="column" gap="2">
              <Text weight="medium" size="2">
                Details *
              </Text>
              <TextArea
                placeholder="Provide detailed information about the violation, including timestamps and links to relevant content if applicable"
                value={details}
                onChange={(e) => setDetails(e.currentTarget.value)}
                rows={8}
              />
            </Flex>

            <Flex gap="3" justify="end" pt="2">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={() => mutation.mutate()}
                disabled={
                  !reportedUserId || !reason || !details || mutation.isPending
                }
              >
                {mutation.isPending ? "Creating..." : "Create Report"}
              </Button>
            </Flex>

            {mutation.error && (
              <Text color="red" size="2">
                Error: {String(mutation.error)}
              </Text>
            )}
          </Flex>
        </Flex>
      </Card>
    </>
  );
}
