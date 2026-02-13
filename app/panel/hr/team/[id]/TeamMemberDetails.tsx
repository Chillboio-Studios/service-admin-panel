"use client";

import { approvePerson, rejectPersonRequest } from "../actions";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import {
  AlertDialog,
  Button,
  Flex,
  Text,
  TextField,
} from "@radix-ui/themes";

export function TeamMemberDetails({
  personId,
  approvalRequest,
}: {
  personId: string;
  approvalRequest?: {
    reason: string;
    requestee: string;
  };
}) {
  const [rejectReason, setRejectReason] = useState("");

  const approveMutation = useMutation({
    mutationFn: () => approvePerson(personId),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectPersonRequest(personId),
  });

  return (
    <Flex direction="column" gap="2">
      <Button
        size="2"
        color="green"
        disabled={approveMutation.isPending}
        onClick={() => approveMutation.mutate()}
      >
        {approveMutation.isPending ? "Approving..." : "Approve"}
      </Button>

      <AlertDialog.Root>
        <AlertDialog.Trigger>
          <Button size="2" color="red" variant="soft" disabled={rejectMutation.isPending}>
            Reject
          </Button>
        </AlertDialog.Trigger>
        <AlertDialog.Content>
          <AlertDialog.Title>Reject Member Request</AlertDialog.Title>
          <AlertDialog.Description size="2" color="gray">
            Are you sure you want to reject this member application?
            <br />
            <br />
            <TextField.Root
              placeholder="Reason for rejection (optional)"
              value={rejectReason}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRejectReason(e.currentTarget.value)}
            />
          </AlertDialog.Description>

          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action
              onClick={() => rejectMutation.mutate()}
            >
              <Button color="red">Reject</Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>

      {approveMutation.isSuccess && (
        <Text color="green" size="2">
          ✓ Member approved successfully
        </Text>
      )}
      {rejectMutation.isSuccess && (
        <Text color="red" size="2">
          ✓ Request rejected
        </Text>
      )}
    </Flex>
  );
}
