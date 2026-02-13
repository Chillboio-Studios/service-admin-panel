import { PageTitle } from "@/components/common/navigation/PageTitle";
import { getScopedUser } from "@/lib/auth";
import { RBAC_PERMISSION_HR_MEMBER_CREATE } from "@/lib/auth/rbacInternal";
import { Metadata } from "next";
import Link from "next/link";

import { Button, Card, Flex, Grid, Heading, Text } from "@radix-ui/themes";

export const metadata: Metadata = {
  title: "Human Resources",
  description: "Manage team members and organizational structure.",
};

export default async function HRDashboard() {
  try {
    await getScopedUser(RBAC_PERMISSION_HR_MEMBER_CREATE);
  } catch {
    // User exists but may not have create permission - still allow viewing
  }

  return (
    <>
      <PageTitle metadata={metadata} />

      <Grid columns={{ initial: "1", md: "2", lg: "3" }} gap="3" width="auto">
        <Card>
          <Flex direction="column" gap="3">
            <Flex direction="column">
              <Heading size="5">Team Members</Heading>
              <Text color="gray" size="2">
                Manage your team roster
              </Text>
            </Flex>
            <Button asChild>
              <Link href="/panel/hr/team">View Team</Link>
            </Button>
          </Flex>
        </Card>

        <Card>
          <Flex direction="column" gap="3">
            <Flex direction="column">
              <Heading size="5">Pending Approvals</Heading>
              <Text color="gray" size="2">
                Review new member applications
              </Text>
            </Flex>
            <Button asChild variant="outline">
              <Link href="/panel/hr/team?filter=pending">
                Review Applications
              </Link>
            </Button>
          </Flex>
        </Card>

        <Card>
          <Flex direction="column" gap="3">
            <Flex direction="column">
              <Heading size="5">Invitations</Heading>
              <Text color="gray" size="2">
                Send invitations to new team members
              </Text>
            </Flex>
            <Button asChild variant="outline">
              <Link href="/panel/hr/team/invite">Send Invitation</Link>
            </Button>
          </Flex>
        </Card>
      </Grid>
    </>
  );
}
