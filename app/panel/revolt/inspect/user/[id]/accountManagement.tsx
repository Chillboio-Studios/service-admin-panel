"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import {
  AlertDialog,
  Badge,
  Button,
  Flex,
  Table,
  Text,
  TextField,
} from "@radix-ui/themes";

import {
  cancelAccountDeletion,
  clearRecoveryCodes,
  disableAccount,
  disableMfaTotp,
  enableAccount,
  queueAccountDeletion,
  resetLockout,
  updateAccountEmail,
  verifyAccountEmail,
} from "./actions";

export function ManageAccount({
  id,
  attempts,
  disabled: initialDisabled,
  deletionQueued,
  suspensionActive,
}: {
  id: string;
  attempts: number;
  disabled?: boolean;
  deletionQueued?: boolean;
  suspensionActive?: boolean;
}) {
  const [isDisabled, setIsDisabled] = useState(initialDisabled || false);
  const [isDeletionQueued, setIsDeletionQueued] = useState(deletionQueued || false);

  const disableMut = useMutation({
    mutationFn: async () => {
      if (isDisabled) {
        await enableAccount(id);
        setIsDisabled(false);
      } else {
        await disableAccount(id);
        setIsDisabled(true);
      }
    },
  });

  const deletionMut = useMutation({
    mutationFn: async () => {
      if (isDeletionQueued) {
        await cancelAccountDeletion(id);
        setIsDeletionQueued(false);
      } else {
        await queueAccountDeletion(id);
        setIsDeletionQueued(true);
      }
    },
  });

  const lockoutMut = useMutation({
    mutationFn: async () => {
      await resetLockout(id);
    },
  });

  return (
    <Flex direction="row" gap="2" wrap="wrap">
      <Button
        color={isDisabled ? "green" : "red"}
        variant="outline"
        disabled={disableMut.isPending || !!suspensionActive}
        onClick={() => disableMut.mutate()}
        title={suspensionActive ? "Account is disabled due to active suspension" : undefined}
      >
        {suspensionActive
          ? "Disabled (Suspended)"
          : isDisabled
            ? "Enable Account"
            : "Disable Account"}
      </Button>
      <Button
        color={isDeletionQueued ? "amber" : "red"}
        variant="outline"
        disabled={deletionMut.isPending}
        onClick={() => deletionMut.mutate()}
      >
        {isDeletionQueued ? "Cancel Deletion" : "Queue Deletion"}
      </Button>
      <Button
        variant="outline"
        disabled={lockoutMut.isPending || attempts === 0}
        onClick={() => lockoutMut.mutate()}
      >
        Reset Lockout {attempts > 0 && <>({attempts} failed attempts)</>}
      </Button>
    </Flex>
  );
}

export function ManageAccountEmail({
  id,
  email,
  verified: initialVerified,
}: {
  id: string;
  email: string;
  verified: boolean;
}) {
  const [value, setValue] = useState(email);
  const [verified, setVerified] = useState(initialVerified);

  const updateMut = useMutation({
    mutationFn: async () => {
      await updateAccountEmail(id, value);
    },
  });

  const verifyMut = useMutation({
    mutationFn: async () => {
      await verifyAccountEmail(id);
      setVerified(true);
    },
  });

  return (
    <Flex direction="row" gap="2">
      <TextField.Root
        value={value}
        className="grow"
        onChange={(e) => setValue(e.currentTarget.value)}
      />
      <Button
        disabled={updateMut.isPending || value === email}
        onClick={() => updateMut.mutate()}
      >
        Update
      </Button>
      <Button
        disabled={verifyMut.isPending || verified}
        color={verified ? "green" : "amber"}
        onClick={() => verifyMut.mutate()}
      >
        {verified ? "Email verified" : "Verify"}
      </Button>
    </Flex>
  );
}

export function ManageAccountMFA({
  id,
  totp: initialTotp,
  recovery: initialRecovery,
}: {
  id: string;
  totp: boolean;
  recovery: number;
}) {
  const [totp, setTotp] = useState(initialTotp);
  const [recovery, setRecovery] = useState(initialRecovery);

  const totpMut = useMutation({
    mutationFn: async () => {
      await disableMfaTotp(id);
      setTotp(false);
    },
  });

  const recoveryMut = useMutation({
    mutationFn: async () => {
      await clearRecoveryCodes(id);
      setRecovery(0);
    },
  });

  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Method</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Action</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        <Table.Row>
          <Table.RowHeaderCell>TOTP</Table.RowHeaderCell>
          <Table.Cell>
            <Badge color={totp ? "green" : "red"}>
              {totp ? "Enabled" : "Disabled"}
            </Badge>
          </Table.Cell>
          <Table.Cell>
            <AlertDialog.Root>
              <AlertDialog.Trigger>
                <Button size="1" disabled={!totp || totpMut.isPending}>
                  Disable
                </Button>
              </AlertDialog.Trigger>
              <AlertDialog.Content>
                <AlertDialog.Title>Disable TOTP</AlertDialog.Title>
                <AlertDialog.Description>
                  This will disable TOTP-based 2FA for this user. They will need
                  to re-enroll if they want to use it again.
                </AlertDialog.Description>
                <Flex gap="3" mt="4" justify="end">
                  <AlertDialog.Cancel>
                    <Button variant="soft" color="gray">Cancel</Button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action>
                    <Button color="red" onClick={() => totpMut.mutate()}>
                      Disable TOTP
                    </Button>
                  </AlertDialog.Action>
                </Flex>
              </AlertDialog.Content>
            </AlertDialog.Root>
          </Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.RowHeaderCell>Recovery Codes</Table.RowHeaderCell>
          <Table.Cell>
            <Badge color={recovery ? "blue" : "red"}>
              {recovery} codes available
            </Badge>
          </Table.Cell>
          <Table.Cell>
            <AlertDialog.Root>
              <AlertDialog.Trigger>
                <Button size="1" disabled={recovery === 0 || recoveryMut.isPending}>
                  Clear
                </Button>
              </AlertDialog.Trigger>
              <AlertDialog.Content>
                <AlertDialog.Title>Clear Recovery Codes</AlertDialog.Title>
                <AlertDialog.Description>
                  This will remove all recovery codes. The user will not be able
                  to use recovery codes to sign in.
                </AlertDialog.Description>
                <Flex gap="3" mt="4" justify="end">
                  <AlertDialog.Cancel>
                    <Button variant="soft" color="gray">Cancel</Button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action>
                    <Button color="red" onClick={() => recoveryMut.mutate()}>
                      Clear Codes
                    </Button>
                  </AlertDialog.Action>
                </Flex>
              </AlertDialog.Content>
            </AlertDialog.Root>
          </Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table.Root>
  );
}
