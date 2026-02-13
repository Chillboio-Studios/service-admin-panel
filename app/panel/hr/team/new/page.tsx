"use client";

import { createPersonAction } from "../actions";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  Button,
  Card,
  Flex,
  Heading,
  Text,
  TextField,
} from "@radix-ui/themes";

import { PageTitle } from "@/components/common/navigation/PageTitle";

export default function NewTeamMemberPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      await createPersonAction(name, email, reason);
    },
    onSuccess: () => {
      router.push("/panel/hr/team");
    },
  });

  return (
    <>
      <PageTitle
        metadata={{
          title: "Add Team Member",
          description: "Invite a new person to join your team",
        }}
      />

      <Card className="max-w-2xl">
        <Flex direction="column" gap="4">
          <Flex direction="column">
            <Heading size="5">Invite New Team Member</Heading>
            <Text color="gray" size="2">
              Send an invitation to a new team member to join your organization
            </Text>
          </Flex>

          <Flex direction="column" gap="3">
            <Flex direction="column" gap="2">
              <Text weight="medium" size="2">
                Full Name
              </Text>
              <TextField.Root
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
              />
            </Flex>

            <Flex direction="column" gap="2">
              <Text weight="medium" size="2">
                Email Address
              </Text>
              <TextField.Root
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
              />
            </Flex>

            <Flex direction="column" gap="2">
              <Text weight="medium" size="2">
                Reason for Invitation
              </Text>
              <TextField.Root
                placeholder="E.g., Hired as software engineer"
                value={reason}
                onChange={(e) => setReason(e.currentTarget.value)}
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
                  !name || !email || !reason || mutation.isPending
                }
              >
                {mutation.isPending ? "Sending..." : "Send Invitation"}
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
