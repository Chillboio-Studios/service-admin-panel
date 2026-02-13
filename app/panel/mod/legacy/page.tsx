import { PageTitle } from "@/components/common/navigation/PageTitle";
import { getScopedUser } from "@/lib/auth";
import { RBAC_PERMISSION_MODERATION_AGENT } from "@/lib/auth/rbacInternal";
import { Metadata } from "next";

import { Card, Flex, Grid, Heading, Text } from "@radix-ui/themes";

export const metadata: Metadata = {
  title: "Moderation Overview",
  description: "Platform moderation statistics and overview.",
};

export default async function ModOverview() {
  await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  return (
    <>
      <PageTitle metadata={metadata} />

      <Grid columns={{ initial: "1", md: "2", lg: "4" }} gap="3" width="auto">
        <Card>
          <Flex direction="column" gap="2">
            <Text size="1" weight="medium" color="gray">
              Active Cases
            </Text>
            <Heading size="6">—</Heading>
            <Text size="1" color="gray">
              Awaiting review
            </Text>
          </Flex>
        </Card>

        <Card>
          <Flex direction="column" gap="2">
            <Text size="1" weight="medium" color="gray">
              Pending Reports
            </Text>
            <Heading size="6">—</Heading>
            <Text size="1" color="gray">
              This month
            </Text>
          </Flex>
        </Card>

        <Card>
          <Flex direction="column" gap="2">
            <Text size="1" weight="medium" color="gray">
              Users Suspended
            </Text>
            <Heading size="6">—</Heading>
            <Text size="1" color="gray">
              This month
            </Text>
          </Flex>
        </Card>

        <Card>
          <Flex direction="column" gap="2">
            <Text size="1" weight="medium" color="gray">
              Users Banned
            </Text>
            <Heading size="6">—</Heading>
            <Text size="1" color="gray">
              Total
            </Text>
          </Flex>
        </Card>
      </Grid>

      <Card>
        <Flex direction="column" gap="3">
          <Heading size="5">Recent Activity</Heading>
          <Text color="gray" size="2">
            Moderation features and analytics are currently being developed.
            Use the navigation menu to access specific moderation tools.
          </Text>
        </Flex>
      </Card>
    </>
  );
}
