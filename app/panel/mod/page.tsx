import { PageTitle } from "@/components/common/navigation/PageTitle";
import { getScopedUser } from "@/lib/auth";
import {
  RBAC_PERMISSION_MODERATION_AGENT,
  RBAC_PERMISSION_MODERATION_DISCOVER,
} from "@/lib/auth/rbacInternal";
import { Metadata } from "next";
import Link from "next/link";

import { Button, Card, Flex, Grid, Heading, Text } from "@radix-ui/themes";
import {
  ExclamationTriangleIcon,
  GlobeIcon,
  MagnifyingGlassIcon,
  ReaderIcon,
} from "@radix-ui/react-icons";

export const metadata: Metadata = {
  title: "Content Moderation",
  description: "Platform moderation and content management tools.",
};

export default async function ModDashboard() {
  let hasModAgent = false;
  let hasDiscover = false;

  try {
    await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
    hasModAgent = true;
  } catch {
    // No moderation agent permission
  }

  try {
    await getScopedUser(RBAC_PERMISSION_MODERATION_DISCOVER);
    hasDiscover = true;
  } catch {
    // No discover permission
  }

  if (!hasModAgent && !hasDiscover) {
    return (
      <>
        <PageTitle metadata={metadata} />
        <Card>
          <Flex direction="column" gap="3" align="center">
            <Heading size="4">Access Denied</Heading>
            <Text color="gray">
              You do not have permission to access moderation tools.
            </Text>
          </Flex>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageTitle metadata={metadata} />

      <Grid columns={{ initial: "1", md: "2" }} gap="3" width="auto">
        {hasModAgent && (
          <>
            <Card>
              <Flex direction="column" gap="3">
                <Flex direction="column" gap="1">
                  <Flex gap="2" align="center">
                    <MagnifyingGlassIcon width="20" height="20" />
                    <Heading size="5">Search & Inspect</Heading>
                  </Flex>
                  <Text color="gray" size="2">
                    Find and inspect users, messages, and content
                  </Text>
                </Flex>
                <Button asChild variant="outline">
                  <Link href="/panel/revolt/inspect">Search by ID</Link>
                </Button>
              </Flex>
            </Card>

            <Card>
              <Flex direction="column" gap="3">
                <Flex direction="column" gap="1">
                  <Flex gap="2" align="center">
                    <ReaderIcon width="20" height="20" />
                    <Heading size="5">Reports & Cases</Heading>
                  </Flex>
                  <Text color="gray" size="2">
                    Manage reports and moderation cases
                  </Text>
                </Flex>
                <Button asChild variant="outline">
                  <Link href="/panel/mod/legacy/reports">View Reports</Link>
                </Button>
              </Flex>
            </Card>

            <Card>
              <Flex direction="column" gap="3">
                <Flex direction="column" gap="1">
                  <Flex gap="2" align="center">
                    <ExclamationTriangleIcon width="20" height="20" />
                    <Heading size="5">Create Report</Heading>
                  </Flex>
                  <Text color="gray" size="2">
                    File a new moderation report or case
                  </Text>
                </Flex>
                <Button asChild variant="outline">
                  <Link href="/panel/mod/legacy/create-report">
                    New Report
                  </Link>
                </Button>
              </Flex>
            </Card>
          </>
        )}

        {hasDiscover && (
          <Card>
            <Flex direction="column" gap="3">
              <Flex direction="column" gap="1">
                <Flex gap="2" align="center">
                  <GlobeIcon width="20" height="20" />
                  <Heading size="5">Discover</Heading>
                </Flex>
                <Text color="gray" size="2">
                  Manage Discover server requests and applications
                </Text>
              </Flex>
              <Button asChild variant="outline">
                <Link href="/panel/mod/legacy/discover">Discover Queue</Link>
              </Button>
            </Flex>
          </Card>
        )}
      </Grid>
    </>
  );
}
