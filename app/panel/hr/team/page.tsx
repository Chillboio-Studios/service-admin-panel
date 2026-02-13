"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import {
  Badge,
  Button,
  Card,
  Flex,
  Heading,
  Skeleton,
  Table,
  Text,
  TextField,
} from "@radix-ui/themes";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";

import { PageTitle } from "@/components/common/navigation/PageTitle";
import { fetchPeopleAction } from "./actions";

export interface TeamMember {
  _id: string;
  name: string;
  email: string;
  status: "Active" | "Pending" | "Inactive" | "Retired";
  positions: string[];
  roles: string[];
}

export default function TeamPage() {
  const [filter, setFilter] = useState<"all" | "active" | "pending">("all");
  const [search, setSearch] = useState("");

  const { data: people, isLoading } = useQuery({
    queryKey: ["team"],
    queryFn: () => fetchPeopleAction(),
  });

  const filteredPeople =
    people?.filter((person: TeamMember) => {
      // Apply status filter
      if (filter === "active" && person.status !== "Active") return false;
      if (filter === "pending" && person.status !== "Pending") return false;

      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          person.name.toLowerCase().includes(searchLower) ||
          person.email.toLowerCase().includes(searchLower)
        );
      }

      return true;
    }) || [];

  return (
    <>
      <PageTitle
        metadata={{
          title: "Team Members",
          description: "Manage your team roster",
        }}
      />

      <Flex direction="column" gap="4">
        <Flex gap="3" direction={{ initial: "column", sm: "row" }}>
          <TextField.Root
            placeholder="Search by name or email..."
            className="flex-grow"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          >
            <TextField.Slot>
              <MagnifyingGlassIcon />
            </TextField.Slot>
          </TextField.Root>
          <Button asChild>
            <Link href="/panel/hr/team/new">Add Member</Link>
          </Button>
        </Flex>

        <Flex gap="2">
          <Button
            variant={filter === "all" ? "solid" : "surface"}
            size="2"
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "active" ? "solid" : "surface"}
            size="2"
            onClick={() => setFilter("active")}
          >
            Active
          </Button>
          <Button
            variant={filter === "pending" ? "solid" : "surface"}
            size="2"
            onClick={() => setFilter("pending")}
          >
            Pending
          </Button>
        </Flex>

        {isLoading ? (
          <Skeleton>
            <Card>
              <Text>Loading team members...</Text>
            </Card>
          </Skeleton>
        ) : filteredPeople.length > 0 ? (
          <Card>
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Positions</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {filteredPeople.map((person: TeamMember) => (
                  <Table.Row key={person._id}>
                    <Table.RowHeaderCell>
                      <Link href={`/panel/hr/team/${person._id}`}>
                        <Text weight="medium" className="hover:underline">
                          {person.name}
                        </Text>
                      </Link>
                    </Table.RowHeaderCell>
                    <Table.Cell>
                      <Text size="2" color="gray">
                        {person.email}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge
                        color={
                          person.status === "Active"
                            ? "green"
                            : person.status === "Pending"
                              ? "amber"
                              : "gray"
                        }
                      >
                        {person.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Flex gap="1" wrap="wrap">
                        {person.positions.length > 0 ? (
                          person.positions.map((pos) => (
                            <Badge key={pos} variant="surface" size="1">
                              {pos}
                            </Badge>
                          ))
                        ) : (
                          <Text size="1" color="gray">
                            No positions
                          </Text>
                        )}
                      </Flex>
                    </Table.Cell>
                    <Table.Cell>
                      <Button size="1" variant="outline" asChild>
                        <Link href={`/panel/hr/team/${person._id}`}>
                          View
                        </Link>
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Card>
        ) : (
          <Card>
            <Flex direction="column" gap="3" align="center">
              <Heading size="4">No team members found</Heading>
              <Text color="gray">
                {search
                  ? "Try adjusting your search criteria"
                  : "Get started by adding your first team member"}
              </Text>
              <Button asChild>
                <Link href="/panel/hr/team/new">Add First Member</Link>
              </Button>
            </Flex>
          </Card>
        )}
      </Flex>
    </>
  );
}
