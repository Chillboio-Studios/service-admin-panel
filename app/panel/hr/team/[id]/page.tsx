import { PageTitle } from "@/components/common/navigation/PageTitle";
import { getScopedUser } from "@/lib/auth";
import { RBAC_PERMISSION_HR_MEMBER_APPROVE } from "@/lib/auth/rbacInternal";
import { fetchPerson } from "@/lib/database/hr/people";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  Badge,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  Text,
} from "@radix-ui/themes";

import { TeamMemberDetails } from "./TeamMemberDetails";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const person = await fetchPerson({ _id: params.id });
  if (!person) return { title: "Member Not Found" };

  return {
    title: `${person.name} - Team Member`,
  };
}

export const dynamic = "force-dynamic";

export default async function TeamMemberPage({ params }: Props) {
  const person = await fetchPerson({ _id: params.id });
  if (!person) notFound();

  let canApprove = false;
  try {
    await getScopedUser(RBAC_PERMISSION_HR_MEMBER_APPROVE);
    canApprove = true;
  } catch {
    // User doesn't have approval permission
  }

  return (
    <>
      <PageTitle
        metadata={{
          title: person.name,
          description: `Manage ${person.name}'s team profile`,
        }}
      />

      <Grid columns={{ initial: "1", lg: "2", xl: "3" }} gap="3" width="auto">
        <Card>
          <Flex direction="column" gap="3">
            <Flex direction="column">
              <Heading size="6">{person.name}</Heading>
              <Text color="gray" size="2">
                {person.email}
              </Text>
            </Flex>

            <Flex direction="column" gap="2">
              <Flex direction="column">
                <Text size="1" weight="medium" color="gray">
                  Status
                </Text>
                <Badge
                  color={
                    person.status === "Active"
                      ? "green"
                      : person.status === "Pending"
                        ? "amber"
                        : person.status === "Retired"
                          ? "gray"
                          : "orange"
                  }
                >
                  {person.status}
                </Badge>
              </Flex>

              {person.positions.length > 0 && (
                <Flex direction="column">
                  <Text size="1" weight="medium" color="gray">
                    Positions
                  </Text>
                  <Flex gap="2" wrap="wrap">
                    {person.positions.map((pos) => (
                      <Badge key={pos} variant="surface">
                        {pos}
                      </Badge>
                    ))}
                  </Flex>
                </Flex>
              )}

              {person.roles.length > 0 && (
                <Flex direction="column">
                  <Text size="1" weight="medium" color="gray">
                    Roles
                  </Text>
                  <Flex gap="2" wrap="wrap">
                    {person.roles.map((role) => (
                      <Badge key={role} variant="surface">
                        {role}
                      </Badge>
                    ))}
                  </Flex>
                </Flex>
              )}
            </Flex>

            {person.approvalRequest && canApprove && (
              <Flex direction="column" gap="2">
                <Heading size="3">Approval Request</Heading>
                <Text size="2">{person.approvalRequest.reason}</Text>
                <Text size="1" color="gray">
                  Requested by: {person.approvalRequest.requestee}
                </Text>
              </Flex>
            )}
          </Flex>
        </Card>

        {canApprove && person.status === "Pending" && (
          <Card>
            <Flex direction="column" gap="3">
              <Heading size="5">Approval Actions</Heading>
              <TeamMemberDetails
                personId={person._id}
                approvalRequest={person.approvalRequest}
              />
            </Flex>
          </Card>
        )}

        {person.notes && (
          <Card>
            <Flex direction="column" gap="2">
              <Heading size="5">Notes</Heading>
              <Text size="2">{person.notes}</Text>
            </Flex>
          </Card>
        )}
      </Grid>
    </>
  );
}
