"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Card,
  Flex,
  Grid,
  Heading,
  Text,
  Button,
  Dialog,
  TextField,
  Select,
  Badge,
  Table,
  Skeleton,
  Tabs,
  Checkbox,
  ScrollArea,
} from "@radix-ui/themes";
import {
  getOrganizationStructure,
  createRole,
  updateRole,
  deleteRole,
  createPosition,
  updatePosition,
  deletePosition,
} from "./actions";
import { PageTitle } from "@/components/common/navigation/PageTitle";

const COLORS = [
  "tomato",
  "red",
  "ruby",
  "crimson",
  "pink",
  "plum",
  "purple",
  "violet",
  "iris",
  "indigo",
  "blue",
  "cyan",
  "teal",
  "jade",
  "green",
  "grass",
  "brown",
  "orange",
  "sky",
  "mint",
  "lime",
  "yellow",
  "amber",
  "gold",
  "bronze",
  "gray",
];

export default function PositionsRolesManager() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"roles" | "positions">("roles");
  const [createRoleOpen, setCreateRoleOpen] = useState(false);
  const [createPositionOpen, setCreatePositionOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newPositionTitle, setNewPositionTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState("blue");
  const [selectedRolesForPosition, setSelectedRolesForPosition] = useState<
    string[]
  >([]);

  const { data: orgData, isLoading } = useQuery({
    queryKey: ["organization"],
    queryFn: () => getOrganizationStructure(),
  });

  const createRoleMutation = useMutation({
    mutationFn: () =>
      createRole(newRoleName, [], selectedColor as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      setCreateRoleOpen(false);
      setNewRoleName("");
    },
  });

  const createPositionMutation = useMutation({
    mutationFn: () =>
      createPosition(newPositionTitle, selectedRolesForPosition, selectedColor as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      setCreatePositionOpen(false);
      setNewPositionTitle("");
      setSelectedRolesForPosition([]);
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: string) => deleteRole(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
  });

  const deletePositionMutation = useMutation({
    mutationFn: (positionId: string) => deletePosition(positionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
  });

  return (
    <>
      <PageTitle
        metadata={{
          title: "Positions & Roles",
          description: "Manage organizational positions and roles",
        }}
      />

      <Tabs.Root value={activeTab} onValueChange={setActiveTab as any}>
        <Tabs.List>
          <Tabs.Trigger value="roles">Roles</Tabs.Trigger>
          <Tabs.Trigger value="positions">Positions</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="roles">
          <Flex direction="column" gap="4" style={{ marginTop: "1rem" }}>
            <Flex justify="between" align="center">
              <Heading size="5">Manage Roles</Heading>
              <Button
                onClick={() => setCreateRoleOpen(true)}
              >
                Create Role
              </Button>
            </Flex>

            {isLoading ? (
              <Skeleton width="100%" height="400px" />
            ) : orgData?.roles && orgData.roles.length > 0 ? (
              <ScrollArea>
                <Table.Root>
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Permissions</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Color</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {orgData.roles.map((role: any) => (
                      <Table.Row key={role._id}>
                        <Table.Cell>{role.name}</Table.Cell>
                        <Table.Cell>
                          <Text size="1" color="gray">
                            {role.permissions.length} permissions
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge color={role.color as any}>
                            {role.color || "default"}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Button
                            size="1"
                            color="red"
                            variant="soft"
                            onClick={() => deleteRoleMutation.mutate(role._id)}
                            disabled={deleteRoleMutation.isPending}
                          >
                            Delete
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </ScrollArea>
            ) : (
              <Card>
                <Text color="gray">No roles created yet</Text>
              </Card>
            )}
          </Flex>
        </Tabs.Content>

        <Tabs.Content value="positions">
          <Flex direction="column" gap="4" style={{ marginTop: "1rem" }}>
            <Flex justify="between" align="center">
              <Heading size="5">Manage Positions</Heading>
              <Button
                onClick={() => setCreatePositionOpen(true)}
              >
                Create Position
              </Button>
            </Flex>

            {isLoading ? (
              <Skeleton width="100%" height="400px" />
            ) : orgData?.positions && orgData.positions.length > 0 ? (
              <ScrollArea>
                <Table.Root>
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell>Title</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Roles</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Color</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {orgData.positions.map((position: any) => (
                      <Table.Row key={position._id}>
                        <Table.Cell>{position.title}</Table.Cell>
                        <Table.Cell>
                          <Flex gap="1" wrap="wrap">
                            {position.roleDetails?.map((role: any) => (
                              <Badge key={role._id} color={role.color as any}>
                                {role.name}
                              </Badge>
                            ))}
                          </Flex>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge color={position.color as any}>
                            {position.color || "default"}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Button
                            size="1"
                            color="red"
                            variant="soft"
                            onClick={() =>
                              deletePositionMutation.mutate(position._id)
                            }
                            disabled={deletePositionMutation.isPending}
                          >
                            Delete
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </ScrollArea>
            ) : (
              <Card>
                <Text color="gray">No positions created yet</Text>
              </Card>
            )}
          </Flex>
        </Tabs.Content>
      </Tabs.Root>

      {/* Create Role Dialog */}
      <Dialog.Root open={createRoleOpen} onOpenChange={setCreateRoleOpen}>
        <Dialog.Content>
          <Dialog.Title>Create New Role</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Add a new role to your organization
          </Dialog.Description>

          <Flex direction="column" gap="3">
            <label>
              <Text as="div" size="2" mb="1" weight="medium">
                Role Name
              </Text>
              <TextField.Root
                value={newRoleName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewRoleName(e.target.value)}
                placeholder="e.g., Manager, Developer"
              />
            </label>

            <label>
              <Text as="div" size="2" mb="1" weight="medium">
                Color
              </Text>
              <Select.Root value={selectedColor} onValueChange={setSelectedColor}>
                <Select.Trigger />
                <Select.Content>
                  {COLORS.map((color) => (
                    <Select.Item key={color} value={color}>
                      {color}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </label>
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              onClick={() => createRoleMutation.mutate()}
              disabled={!newRoleName || createRoleMutation.isPending}
            >
              {createRoleMutation.isPending ? "Creating..." : "Create Role"}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* Create Position Dialog */}
      <Dialog.Root open={createPositionOpen} onOpenChange={setCreatePositionOpen}>
        <Dialog.Content>
          <Dialog.Title>Create New Position</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Add a new position to your organizational structure
          </Dialog.Description>

          <Flex direction="column" gap="3">
            <label>
              <Text as="div" size="2" mb="1" weight="medium">
                Position Title
              </Text>
              <TextField.Root
                value={newPositionTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewPositionTitle(e.target.value)}
                placeholder="e.g., Team Lead, Senior Manager"
              />
            </label>

            <label>
              <Text as="div" size="2" mb="1" weight="medium">
                Color
              </Text>
              <Select.Root value={selectedColor} onValueChange={setSelectedColor}>
                <Select.Trigger />
                <Select.Content>
                  {COLORS.map((color) => (
                    <Select.Item key={color} value={color}>
                      {color}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </label>

            {orgData?.roles && orgData.roles.length > 0 && (
              <label>
                <Text as="div" size="2" mb="1" weight="medium">
                  Associated Roles
                </Text>
                <Card>
                  <Flex direction="column" gap="2">
                    {orgData.roles.map((role: any) => (
                      <Flex key={role._id} align="center" gap="2">
                        <Checkbox
                          checked={selectedRolesForPosition.includes(role._id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRolesForPosition([
                                ...selectedRolesForPosition,
                                role._id,
                              ]);
                            } else {
                              setSelectedRolesForPosition(
                                selectedRolesForPosition.filter(
                                  (id) => id !== role._id,
                                ),
                              );
                            }
                          }}
                        />
                        <Text size="2">{role.name}</Text>
                      </Flex>
                    ))}
                  </Flex>
                </Card>
              </label>
            )}
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              onClick={() => createPositionMutation.mutate()}
              disabled={!newPositionTitle || createPositionMutation.isPending}
            >
              {createPositionMutation.isPending
                ? "Creating..."
                : "Create Position"}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}
