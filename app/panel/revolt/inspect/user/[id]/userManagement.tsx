"use client";

import { consumeChangelog } from "@/components/core/admin/changelogs/helpers";
import { Strike } from "@/lib/database/revolt/safety_strikes";
import { useMutation } from "@tanstack/react-query";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useState } from "react";
import { decodeTime } from "ulid";

import {
  AlertDialog,
  Badge,
  Button,
  Checkbox,
  Flex,
  Select,
  Table,
  Text,
  TextField,
} from "@radix-ui/themes";

import { banUser, strikeUser, unsuspendUser as unsuspendUserAction } from "./actions";

export const USER_FLAG_SUSPENDED = 1;
export const USER_FLAG_DELETED = 2;
export const USER_FLAG_BANNED = 4;

dayjs.extend(relativeTime);

export function UserStrikeActions({
  id,
  flags,
  caseId,
  addStrike,
}: {
  id: string;
  flags: number;
  caseId?: string;
  addStrike?: (strike: Strike) => void;
}) {
  const [actualFlags, setFlags] = useState(flags);

  const [reason, setReason] = useState<string[]>([""]);
  const [context, setContext] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [days, setDays] = useState<"7" | "14" | "indefinite">("7");

  // --- SAFE CASE ID ---
  const safeCaseId =
    !caseId ||
    caseId === "$undefined" ||
    caseId === "undefined" ||
    caseId === "null" ||
    caseId.trim() === "" ||
    caseId.length !== 26
      ? undefined
      : caseId;

  // --- REASON EDITOR ---
  const reasonEditor = () =>
    reason.map((value, idx) => (
      <div key={idx}>
        <TextField.Root
          value={value}
          onChange={(e) =>
            setReason((r) => r.map((v, i) => (i === idx ? e.target.value : v)))
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setReason((r) => [...r, ""]);
            } else if (e.key === "Backspace" && !reason[idx] && reason.length > 1) {
              setReason((r) => r.filter((_, i) => i !== idx));
            }
          }}
          placeholder={
            idx === 0
              ? "Specify strike reason (press enter to add reasons)"
              : "Specify a reason (backspace to remove)"
          }
        />
      </div>
    ));

  // --- STRIKE / SUSPEND / BAN ---
  const mutation = useMutation({
    mutationFn: async (type: "strike" | "suspension" | "ban") => {
      if (type === "ban" && !confirm) {
        alert("Not banning, check the confirmation checkbox!");
        return;
      }

      if (type === "ban") {
        await banUser(id, reason, context, safeCaseId);
        setFlags(USER_FLAG_BANNED);
      } else {
        const { changelog, strike } = await strikeUser(
          id,
          type,
          reason,
          context,
          safeCaseId,
          days,
        );

        consumeChangelog(changelog);
        addStrike?.(strike);

        if (type === "suspension") {
          setFlags(USER_FLAG_SUSPENDED);
        }
      }

      setReason([""]);
      setContext("");
      setConfirm(false);
    },
  });

  const unsuspend = useMutation({
    mutationFn: async () => {
      await unsuspendUserAction(id);
      setFlags(0);
    },
  });

  return (
    <>
      {/* STRIKE */}
      <AlertDialog.Root>
        <AlertDialog.Trigger>
          <Button disabled={mutation.isPending}>Strike</Button>
        </AlertDialog.Trigger>
        <AlertDialog.Content>
          <AlertDialog.Title>Create new strike</AlertDialog.Title>
          <AlertDialog.Description size="2" color="gray">
            You have received an account strike, for one or more reasons:
            <br />
            <br />
            {reasonEditor()}
            Further violations will result in suspension or a permanent ban
            depending on severity, please abide by the Acceptable Usage Policy.
            <br />
            <br />
            <TextField.Root
              value={context}
              onChange={(e) => setContext(e.currentTarget.value)}
              placeholder="Additional context (only moderators will see this)"
            />
          </AlertDialog.Description>

          <Flex gap="3" mt="4" justify="end" align="center">
            {!safeCaseId && (
              <Badge color="red">
                This strike will not be associated with a case!
              </Badge>
            )}
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action onClick={() => mutation.mutate("strike")}>
              <Button variant="solid" color="red">
                Strike
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>

      {/* SUSPEND / UNSUSPEND */}
      {actualFlags === USER_FLAG_SUSPENDED ? (
        <Button
          color="amber"
          variant="outline"
          disabled={mutation.isPending}
          onClick={() => unsuspend.mutate()}
        >
          Unsuspend
        </Button>
      ) : (
        <AlertDialog.Root>
          <AlertDialog.Trigger>
            <Button
              color="amber"
              disabled={
                mutation.isPending ||
                (actualFlags ? actualFlags !== USER_FLAG_DELETED : false)
              }
            >
              Suspend
            </Button>
          </AlertDialog.Trigger>
          <AlertDialog.Content>
            <AlertDialog.Title>Suspend user</AlertDialog.Title>
            <AlertDialog.Description size="2" color="gray">
              Your account has been suspended, for one or more reasons:
              <br />
              <br />
              {reasonEditor()}
              Further violations may result in a permanent ban depending on
              severity, please abide by the Acceptable Usage Policy.
              <br />
              <br />
              <Flex gap="2">
                <Select.Root
                  defaultValue="7"
                  value={days}
                  onValueChange={(value) => setDays(value as never)}
                >
                  <Select.Trigger />
                  <Select.Content>
                    <Select.Item value="7">7 days</Select.Item>
                    <Select.Item value="14">14 days</Select.Item>
                    <Select.Item value="indefinite">Indefinite</Select.Item>
                  </Select.Content>
                </Select.Root>
                <TextField.Root
                  className="flex-grow"
                  value={context}
                  onChange={(e) => setContext(e.currentTarget.value)}
                  placeholder="Additional context (only moderators will see this)"
                />
              </Flex>
              <br />
              <Text color="amber">
                An email will automatically be sent and the user will be
                unsuspended after the given time period.
              </Text>
            </AlertDialog.Description>

            <Flex gap="3" mt="4" justify="end" align="center">
              {!safeCaseId && (
                <Badge color="red">
                  This strike will not be associated with a case!
                </Badge>
              )}
              <AlertDialog.Cancel>
                <Button variant="soft" color="gray">
                  Cancel
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action onClick={() => mutation.mutate("suspension")}>
                <Button variant="solid" color="red">
                  Suspend
                </Button>
              </AlertDialog.Action>
            </Flex>
          </AlertDialog.Content>
        </AlertDialog.Root>
      )}

      {/* BAN */}
      <AlertDialog.Root>
        <AlertDialog.Trigger>
          <Button
            color="red"
            disabled={
              mutation.isPending || actualFlags === USER_FLAG_BANNED
            }
          >
            {actualFlags === USER_FLAG_BANNED ? "Banned" : "Ban"}
          </Button>
        </AlertDialog.Trigger>
        <AlertDialog.Content>
          <AlertDialog.Title>Ban user</AlertDialog.Title>
          <AlertDialog.Description size="2" color="gray">
            {reasonEditor()}
            <Text as="label" size="2">
              <Flex gap="2">
                <Checkbox
                  checked={confirm}
                  onCheckedChange={(v) => setConfirm(!!v)}
                />{" "}
                I understand this action cannot be reversed.
              </Flex>
            </Text>
            <br />

            <TextField.Root
              className="flex-grow"
              value={context}
              onChange={(e) => setContext(e.currentTarget.value)}
              placeholder="Additional context (only moderators will see this)"
            />
            <br />
            <Text color="amber">An email will automatically be sent.</Text>
          </AlertDialog.Description>

          <Flex gap="3" mt="4" justify="end" align="center">
            {!safeCaseId && (
              <Badge color="red">
                This strike will not be associated with a case!
              </Badge>
            )}
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action onClick={() => mutation.mutate("ban")}>
              <Button variant="solid" color="red">
                Ban
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </>
  );
}

export function UserStrikes({
  id,
  flags,
  caseId,
  strikes,
}: {
  id: string;
  flags: number;
  caseId?: string;
  strikes: Strike[];
}) {
  const [actualStrikes, setStrikes] = useState(strikes);

  return (
    <>
      <Flex gap="2">
        <UserStrikeActions
          id={id}
          flags={flags}
          caseId={caseId}
          addStrike={(strike) => setStrikes((arr) => [...arr, strike])}
        />
      </Flex>

      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Reason</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Information</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {actualStrikes.map((strike) => (
            <Table.Row key={strike._id}>
              <Table.Cell>{strike.reason}</Table.Cell>
              <Table.Cell>
                {strike.type === "suspension" && (
                  <Badge color="amber">Suspended</Badge>
                )}{" "}
                {strike.type === "ban" && <Badge color="red">Banned</Badge>}{" "}
                <Badge
                  suppressHydrationWarning
                  title={new Date(decodeTime(strike._id)).toISOString()}
                >
                  Created {dayjs(decodeTime(strike._id)).fromNow()}
                </Badge>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </>
  );
}
