"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  Flex,
  Grid,
  Heading,
  Text,
  Tabs,
  Badge,
  Skeleton,
} from "@radix-ui/themes";
import {
  BarChart,
  AreaChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  getGeneralAnalytics,
  getModerationAnalytics,
  getRecentActivity,
  getTopReportReasons,
  getUserStatistics,
} from "../analytics/actions";
import { PageTitle } from "@/components/common/navigation/PageTitle";

const COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#FFA07A",
  "#98D8C8",
  "#F7DC6F",
];

export default function AnalyticsDashboard() {
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => getGeneralAnalytics(),
  });

  const { data: modAnalytics, isLoading: modLoading } = useQuery({
    queryKey: ["mod-analytics"],
    queryFn: () => getModerationAnalytics(),
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: () => getRecentActivity(),
  });

  const { data: topReasons, isLoading: reasonsLoading } = useQuery({
    queryKey: ["report-reasons"],
    queryFn: () => getTopReportReasons(),
  });

  const { data: userStats, isLoading: userStatsLoading } = useQuery({
    queryKey: ["user-statistics"],
    queryFn: () => getUserStatistics(),
  });

  return (
    <>
      <PageTitle
        metadata={{
          title: "Analytics Dashboard",
          description: "View platform statistics and analytics",
        }}
      />

      <Flex direction="column" gap="6">
        {/* Key Metrics */}
        <Flex direction="column" gap="2">
          <Heading size="6">Key Metrics</Heading>
          <Grid columns={{ initial: "1", sm: "2", md: "4" }} gap="3">
            <Card>
              <Flex direction="column" gap="2">
                <Text size="1" weight="medium" color="gray">
                  Open Cases
                </Text>
                {analyticsLoading ? (
                  <Skeleton width="80px" height="32px" />
                ) : (
                  <Heading size="6">{analyticsData?.openCases || 0}</Heading>
                )}
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
                {analyticsLoading ? (
                  <Skeleton width="80px" height="32px" />
                ) : (
                  <Heading size="6">{analyticsData?.pendingReports || 0}</Heading>
                )}
                <Text size="1" color="gray">
                  Unreviewed
                </Text>
              </Flex>
            </Card>

            <Card>
              <Flex direction="column" gap="2">
                <Text size="1" weight="medium" color="gray">
                  Closed Cases
                </Text>
                {analyticsLoading ? (
                  <Skeleton width="80px" height="32px" />
                ) : (
                  <Heading size="6">{analyticsData?.closedCases || 0}</Heading>
                )}
                <Text size="1" color="gray">
                  All time
                </Text>
              </Flex>
            </Card>

            <Card>
              <Flex direction="column" gap="2">
                <Text size="1" weight="medium" color="gray">
                  Total Users
                </Text>
                {analyticsLoading ? (
                  <Skeleton width="80px" height="32px" />
                ) : (
                  <Heading size="6">{analyticsData?.totalUsers || 0}</Heading>
                )}
                <Text size="1" color="gray">
                  Platform wide
                </Text>
              </Flex>
            </Card>
          </Grid>
        </Flex>

        {/* Moderation Stats */}
        <Flex direction="column" gap="4">
          <Heading size="6">Moderation Overview</Heading>
          <Grid columns={{ initial: "1", md: "2" }} gap="4">
            <Card>
              <Flex direction="column" gap="3">
                <Heading size="5">Action Summary</Heading>
                {modLoading ? (
                  <>
                    <Skeleton width="100%" height="200px" />
                  </>
                ) : (
                  <Grid columns={{ initial: "1", sm: "3" }} gap="2">
                    <Flex direction="column" gap="1">
                      <Text size="1" color="gray">
                        Strikes
                      </Text>
                      <Heading size="5">{modAnalytics?.strikes || 0}</Heading>
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text size="1" color="gray">
                        Suspensions
                      </Text>
                      <Heading size="5">{modAnalytics?.suspensions || 0}</Heading>
                    </Flex>
                    <Flex direction="column" gap="1">
                      <Text size="1" color="gray">
                        Bans
                      </Text>
                      <Heading size="5">{modAnalytics?.bans || 0}</Heading>
                    </Flex>
                  </Grid>
                )}
              </Flex>
            </Card>

            <Card>
              <Flex direction="column" gap="3">
                <Heading size="5">User Statistics</Heading>
                {userStatsLoading ? (
                  <Skeleton width="100%" height="150px" />
                ) : (
                  <Grid columns="1" gap="2">
                    <Flex justify="between" align="center">
                      <Text size="2">Total Users</Text>
                      <Badge size="2">{userStats?.total || 0}</Badge>
                    </Flex>
                    <Flex justify="between" align="center">
                      <Text size="2">Human Users</Text>
                      <Badge size="2" color="blue">
                        {userStats?.human || 0}
                      </Badge>
                    </Flex>
                    <Flex justify="between" align="center">
                      <Text size="2">Bots</Text>
                      <Badge size="2" color="green">
                        {userStats?.bots || 0}
                      </Badge>
                    </Flex>
                    <Flex justify="between" align="center">
                      <Text size="2">Verified</Text>
                      <Badge size="2" color="green">
                        {userStats?.verified || 0}
                      </Badge>
                    </Flex>
                  </Grid>
                )}
              </Flex>
            </Card>
          </Grid>
        </Flex>

        {/* Charts */}
        <Flex direction="column" gap="4">
          <Heading size="6">Activity Trends</Heading>
          <Grid columns={{ initial: "1", md: "2" }} gap="4">
            <Card>
              <Flex direction="column" gap="3">
                <Heading size="5">Reports (Last 30 Days)</Heading>
                {modLoading ? (
                  <Skeleton width="100%" height="200px" />
                ) : modAnalytics?.reports && modAnalytics.reports.length > 0 ? (
                  <Flex direction="column" gap="2">
                    {modAnalytics.reports.slice(-7).map((item) => (
                      <Flex key={item.date} justify="between" align="center">
                        <Text size="1">{item.date}</Text>
                        <Badge>{item.value}</Badge>
                      </Flex>
                    ))}
                  </Flex>
                ) : (
                  <Text color="gray">No data available</Text>
                )}
              </Flex>
            </Card>

            <Card>
              <Flex direction="column" gap="3">
                <Heading size="5">Cases (Last 30 Days)</Heading>
                {modLoading ? (
                  <Skeleton width="100%" height="200px" />
                ) : modAnalytics?.cases && modAnalytics.cases.length > 0 ? (
                  <Flex direction="column" gap="2">
                    {modAnalytics.cases.slice(-7).map((item) => (
                      <Flex key={item.date} justify="between" align="center">
                        <Text size="1">{item.date}</Text>
                        <Badge color="green">{item.value}</Badge>
                      </Flex>
                    ))}
                  </Flex>
                ) : (
                  <Text color="gray">No data available</Text>
                )}
              </Flex>
            </Card>
          </Grid>
        </Flex>

        {/* Top Report Reasons */}
        {topReasons && topReasons.length > 0 && (
          <Flex direction="column" gap="4">
            <Heading size="6">Top Report Reasons</Heading>
            <Card>
              <Flex direction="column" gap="3">
                {reasonsLoading ? (
                  <Skeleton width="100%" height="300px" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={topReasons}
                        dataKey="count"
                        nameKey="reason"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                      >
                        {topReasons.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Flex>
            </Card>
          </Flex>
        )}

        {/* Recent Activity */}
        <Flex direction="column" gap="4">
          <Heading size="6">Recent Activity</Heading>
          <Card>
            <Flex direction="column" gap="3">
              {activityLoading ? (
                <>
                  <Skeleton width="100%" height="80px" />
                  <Skeleton width="100%" height="80px" />
                </>
              ) : recentActivity && recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <Flex
                    key={activity.id}
                    justify="between"
                    align="center"
                    px="4"
                    py="3"
                    className="border-b border-gray-200 last:border-b-0"
                  >
                    <Flex direction="column" gap="1">
                      <Text size="2" weight="medium">
                        {activity.action}
                      </Text>
                      <Text size="1" color="gray">
                        by {activity.user} on {activity.timestamp}
                      </Text>
                    </Flex>
                    <Badge>{activity.object.type}</Badge>
                  </Flex>
                ))
              ) : (
                <Text color="gray">No recent activity</Text>
              )}
            </Flex>
          </Card>
        </Flex>

        {/* Account Status */}
        {analyticsData && (
          <Flex direction="column" gap="4">
            <Heading size="6">Account Status</Heading>
            <Grid columns={{ initial: "1", sm: "2" }} gap="4">
              <Card>
                <Flex direction="column" gap="2">
                  <Text size="1" weight="medium" color="gray">
                    Disabled Accounts
                  </Text>
                  <Heading size="6">{analyticsData.disabledAccounts}</Heading>
                  <Text size="1" color="gray">
                    Locked or suspended
                  </Text>
                </Flex>
              </Card>

              <Card>
                <Flex direction="column" gap="2">
                  <Text size="1" weight="medium" color="gray">
                    Flagged for Spam
                  </Text>
                  <Heading size="6">{analyticsData.spamAccounts}</Heading>
                  <Text size="1" color="gray">
                    Under review
                  </Text>
                </Flex>
              </Card>
            </Grid>
          </Flex>
        )}
      </Flex>
    </>
  );
}
