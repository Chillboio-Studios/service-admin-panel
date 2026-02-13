import { getScopedUser } from "@/lib/auth";
import {
  RBAC_PERMISSION_HR_MEMBER_CREATE,
  RBAC_PERMISSION_MODERATION_AGENT,
  RBAC_PERMISSION_MODERATION_DISCOVER,
} from "@/lib/auth/rbacInternal";
import { Metadata } from "next";
import Link from "next/link";

import {
  Badge,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  Text,
} from "@radix-ui/themes";
import {
  ExclamationTriangleIcon,
  GlobeIcon,
  PersonIcon,
} from "@radix-ui/react-icons";

import pkg from "../../package.json";

export const metadata: Metadata = {
  title: "Stoat Dashboard",
  description: "Integrated RBAC and content moderation tool for Stoat.",
};

export default async function Home() {
  // Check user permissions
  let permissions = {
    hr: false,
    modAgent: false,
    discover: false,
  };

  try {
    await getScopedUser(RBAC_PERMISSION_HR_MEMBER_CREATE);
    permissions.hr = true;
  } catch {
    // No HR permission
  }

  try {
    await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);
    permissions.modAgent = true;
  } catch {
    // No moderation permission
  }

  try {
    await getScopedUser(RBAC_PERMISSION_MODERATION_DISCOVER);
    permissions.discover = true;
  } catch {
    // No discover permission
  }

  const hasAnyPermission =
    permissions.hr || permissions.modAgent || permissions.discover;

  return (
    <>
      <Flex direction="column" gap="4">
        <Flex direction="column" gap="1">
          <Heading size="8">Welcome to Stoat</Heading>
          <Text color="gray" size="3">
            Integrated administration and content moderation dashboard for Revolt
          </Text>
        </Flex>

        {!hasAnyPermission ? (
          <Card>
            <Flex direction="column" gap="3" align="center">
              <Heading size="4">Access Restricted</Heading>
              <Text color="gray">
                You don&apos;t have permission to access any modules. Please contact
                your administrator.
              </Text>
            </Flex>
          </Card>
        ) : (
          <>
            <Grid
              columns={{ initial: "1", sm: "2", md: "3" }}
              gap="3"
              width="auto"
            >
              {permissions.hr && (
                <Card>
                  <Flex direction="column" gap="3">
                    <Flex gap="2" align="center">
                      <PersonIcon width="20" height="20" />
                      <Heading size="5">Human Resources</Heading>
                    </Flex>
                    <Text size="2" color="gray">
                      Manage your team members, positions, and organizational
                      structure
                    </Text>
                    <Button asChild size="2" variant="outline">
                      <Link href="/panel/hr">Go to HR</Link>
                    </Button>
                  </Flex>
                </Card>
              )}

              {(permissions.modAgent || permissions.discover) && (
                <Card>
                  <Flex direction="column" gap="3">
                    <Flex gap="2" align="center">
                      <ExclamationTriangleIcon width="20" height="20" />
                      <Heading size="5">Content Moderation</Heading>
                    </Flex>
                    <Text size="2" color="gray">
                      Search users, manage reports, and handle moderation cases
                    </Text>
                    <Button asChild size="2" variant="outline">
                      <Link href="/panel/mod">Go to Moderation</Link>
                    </Button>
                  </Flex>
                </Card>
              )}

              {permissions.discover && (
                <Card>
                  <Flex direction="column" gap="3">
                    <Flex gap="2" align="center">
                      <GlobeIcon width="20" height="20" />
                      <Heading size="5">Discover</Heading>
                    </Flex>
                    <Text size="2" color="gray">
                      Manage Discover server applications and requests
                    </Text>
                    <Button asChild size="2" variant="outline">
                      <Link href="/panel/mod/legacy/discover">View Queue</Link>
                    </Button>
                  </Flex>
                </Card>
              )}
            </Grid>

            <Card>
              <Flex direction="column" gap="3">
                <Heading size="5">Quick Actions</Heading>
                <Grid columns={{ initial: "1", sm: "2" }} gap="2">
                  {permissions.modAgent && (
                    <>
                      <Button asChild variant="outline">
                        <Link href="/panel/revolt/inspect">Search User</Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href="/panel/mod/legacy/create-report">
                          Create Report
                        </Link>
                      </Button>
                    </>
                  )}
                  {permissions.hr && (
                    <Button asChild variant="outline">
                      <Link href="/panel/hr/team/new">Add Team Member</Link>
                    </Button>
                  )}
                </Grid>
              </Flex>
            </Card>
          </>
        )}

        <Card>
          <Flex direction="column" gap="2">
            <Heading size="4">About Stoat</Heading>
            <Text size="2">
              Stoat is a comprehensive administration and moderation platform
              for Revolt. It provides tools for team management, content
              moderation, and platform administration.
            </Text>
            <Flex gap="2" align="center" pt="2">
              <Badge variant="outline">v{pkg.version}</Badge>
              <Text size="1" color="gray">
                &middot;
              </Text>
              <Link href="https://github.com/revoltchat/admin-panel">
                <Text size="1" color="blue">
                  View Source Code
                </Text>
              </Link>
            </Flex>
          </Flex>
        </Card>
      </Flex>
    </>
  );
}
