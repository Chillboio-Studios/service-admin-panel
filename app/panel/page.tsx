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
  Tabs,
} from "@radix-ui/themes";
import {
  ExclamationTriangleIcon,
  GlobeIcon,
  PersonIcon,
  BarChartIcon,
  GearIcon,
  BookmarkIcon,
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
              {/* Analytics */}
              {(permissions.hr || permissions.modAgent) && (
                <Card>
                  <Flex direction="column" gap="3">
                    <Flex gap="2" align="center">
                      <BarChartIcon width="20" height="20" />
                      <Heading size="5">Analytics</Heading>
                    </Flex>
                    <Text size="2" color="gray">
                      Platform statistics, metrics, and trends
                    </Text>
                    <Button asChild size="2" variant="outline">
                      <Link href="/panel/analytics">View Dashboard</Link>
                    </Button>
                  </Flex>
                </Card>
              )}

              {permissions.hr && (
                <Card>
                  <Flex direction="column" gap="3">
                    <Flex gap="2" align="center">
                      <PersonIcon width="20" height="20" />
                      <Heading size="5">Human Resources</Heading>
                    </Flex>
                    <Text size="2" color="gray">
                      Manage team members, roles, and positions
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
                      Search users, manage reports, and moderation cases
                    </Text>
                    <Button asChild size="2" variant="outline">
                      <Link href="/panel/mod/cases">Manage Cases</Link>
                    </Button>
                  </Flex>
                </Card>
              )}

              {permissions.modAgent && (
                <Card>
                  <Flex direction="column" gap="3">
                    <Flex gap="2" align="center">
                      <BookmarkIcon width="20" height="20" />
                      <Heading size="5">User Management</Heading>
                    </Flex>
                    <Text size="2" color="gray">
                      Search and manage platform users
                    </Text>
                    <Button asChild size="2" variant="outline">
                      <Link href="/panel/users">View Users</Link>
                    </Button>
                  </Flex>
                </Card>
              )}

              {permissions.hr && (
                <Card>
                  <Flex direction="column" gap="3">
                    <Flex gap="2" align="center">
                      <GearIcon width="20" height="20" />
                      <Heading size="5">Positions & Roles</Heading>
                    </Flex>
                    <Text size="2" color="gray">
                      Configure organizational structure
                    </Text>
                    <Button asChild size="2" variant="outline">
                      <Link href="/panel/hr/positions-roles">Manage</Link>
                    </Button>
                  </Flex>
                </Card>
              )}

              {(permissions.modAgent || permissions.hr) && (
                <Card>
                  <Flex direction="column" gap="3">
                    <Flex gap="2" align="center">
                      <GearIcon width="20" height="20" />
                      <Heading size="5">Settings & Audit</Heading>
                    </Flex>
                    <Text size="2" color="gray">
                      System configuration and audit logs
                    </Text>
                    <Button asChild size="2" variant="outline">
                      <Link href="/panel/settings">Go to Settings</Link>
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
                      Manage Discover applications and requests
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
                <Grid columns={{ initial: "1", sm: "2", md: "4" }} gap="2">
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
                      <Button asChild variant="outline">
                        <Link href="/panel/mod/cases">View Cases</Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href="/panel/users">Search Users</Link>
                      </Button>
                    </>
                  )}
                  {permissions.hr && (
                    <>
                      <Button asChild variant="outline">
                        <Link href="/panel/hr/team/new">Add Team Member</Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href="/panel/hr/positions-roles">Configure Org</Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href="/panel/hr/team">View Team</Link>
                      </Button>
                    </>
                  )}
                  {(permissions.modAgent || permissions.hr) && (
                    <Button asChild variant="outline">
                      <Link href="/panel/settings">Audit Log</Link>
                    </Button>
                  )}
                </Grid>
              </Flex>
            </Card>

            <Card>
              <Flex direction="column" gap="3">
                <Heading size="5">Dashboard Features</Heading>
                <Flex direction="column" gap="2">
                  <Grid columns={{ initial: "1", sm: "2" }} gap="2">
                    <Flex direction="column" gap="1">
                      <Text size="2" weight="medium">📊 Analytics Dashboard</Text>
                      <Text size="1" color="gray">Real-time platform statistics and trends</Text>
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text size="2" weight="medium">👥 Team Management</Text>
                      <Text size="1" color="gray">HR features for team organization</Text>
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text size="2" weight="medium">⚖️ Case Management</Text>
                      <Text size="1" color="gray">Advanced moderation case handling</Text>
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text size="2" weight="medium">📋 Audit Logs</Text>
                      <Text size="1" color="gray">Comprehensive activity tracking</Text>
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text size="2" weight="medium">⚙️ Configuration</Text>
                      <Text size="1" color="gray">System settings and automation</Text>
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text size="2" weight="medium">📁 Data Export</Text>
                      <Text size="1" color="gray">Export data as JSON or CSV</Text>
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text size="2" weight="medium">🔍 User Search</Text>
                      <Text size="1" color="gray">Advanced user discovery and filtering</Text>
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text size="2" weight="medium">📊 User Metrics</Text>
                      <Text size="1" color="gray">Detailed user statistics and trends</Text>
                    </Flex>
                  </Grid>
                </Flex>
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
