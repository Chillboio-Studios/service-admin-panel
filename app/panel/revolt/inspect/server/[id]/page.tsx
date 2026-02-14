import { PageTitle } from "@/components/common/navigation/PageTitle";
import { Changelog } from "@/components/core/admin/changelogs/Changelog";
import { getScopedUser } from "@/lib/auth";
import { RBAC_PERMISSION_MODERATION_AGENT } from "@/lib/auth/rbacInternal";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  Badge,
  Card,
  Flex,
  Grid,
  Heading,
  Text,
} from "@radix-ui/themes";

import { fetchServer } from "./actions";
import {
  ServerChannelsCard,
  ServerFlagManager,
  ServerMembersCard,
  ServerReportsCard,
} from "./ServerComponents";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const server = await fetchServer(params.id);
  if (!server) return { title: "Server Not Found" };
  return {
    title: `${(server as any).name || params.id} - Inspect Server`,
  };
}

export const dynamic = "force-dynamic";

export default async function ServerInspect({ params }: Props) {
  await getScopedUser(RBAC_PERMISSION_MODERATION_AGENT);

  const server = await fetchServer(params.id);
  if (!server) notFound();

  return (
    <>
      <PageTitle
        metadata={{
          title: `${(server as any).name || params.id} - Inspect Server`,
        }}
      />

      <Grid columns={{ initial: "1", lg: "2", xl: "3" }} gap="2" width="auto">
        {/* Server Overview */}
        <Card>
          <Flex direction="column" gap="3">
            <Flex direction="column">
              <Heading size="6">{(server as any).name || "Unnamed Server"}</Heading>
              <Text color="gray" size="1">
                Server ID: {params.id}
              </Text>
            </Flex>

            <Flex gap="2" wrap="wrap">
              <Badge>{server.memberCount} members</Badge>
              <Badge>{server.channelCount} channels</Badge>
              {(server as any).owner && (
                <Badge color="amber">Owner: {(server as any).owner}</Badge>
              )}
              {(server as any).nsfw && <Badge color="red">NSFW</Badge>}
            </Flex>

            {(server as any).description && (
              <Flex direction="column" gap="1">
                <Heading size="2">Description</Heading>
                <Text size="2">{(server as any).description}</Text>
              </Flex>
            )}
          </Flex>
        </Card>

        {/* Flags Management */}
        <Card>
          <Flex direction="column" gap="3">
            <Flex direction="column">
              <Heading size="6">Server Flags</Heading>
              <Text color="gray" size="1">
                Manage server flags and verification status.
              </Text>
            </Flex>
            <ServerFlagManager
              serverId={params.id}
              initialFlags={(server as any).flags ?? 0}
            />
          </Flex>
        </Card>

        {/* Channels */}
        <Card>
          <Flex direction="column" gap="3">
            <Flex direction="column">
              <Heading size="6">Channels</Heading>
              <Text color="gray" size="1">
                Channels in this server.
              </Text>
            </Flex>
            <ServerChannelsCard serverId={params.id} />
          </Flex>
        </Card>

        {/* Members */}
        <Card>
          <Flex direction="column" gap="3">
            <Flex direction="column">
              <Heading size="6">Members</Heading>
              <Text color="gray" size="1">
                Members of this server (limited to 50).
              </Text>
            </Flex>
            <ServerMembersCard serverId={params.id} />
          </Flex>
        </Card>

        {/* Reports */}
        <Card>
          <Flex direction="column" gap="3">
            <Flex direction="column">
              <Heading size="6">Reports</Heading>
              <Text color="gray" size="1">
                Reports involving this server.
              </Text>
            </Flex>
            <ServerReportsCard serverId={params.id} />
          </Flex>
        </Card>
      </Grid>

      <Card>
        <Flex direction="column" gap="2">
          <Flex direction="column">
            <Heading size="6">Discuss</Heading>
            <Text color="gray" size="1">
              Recent actions and comments relating to this server.
            </Text>
          </Flex>
          <Changelog object={{ type: "User", id: params.id }} />
        </Flex>
      </Card>
    </>
  );
}
