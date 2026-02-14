"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  Card,
  Flex,
  Grid,
  Heading,
  Text,
  TextField,
  Button,
  Tabs,
  Switch,
  Skeleton,
  Table,
  ScrollArea,
  Badge,
  Dialog,
} from "@radix-ui/themes";
import {
  getAuditLog,
  searchAuditLog,
  getSystemSettings,
  updateSystemSettings,
  getAuditLogCount,
  exportAuditLog,
} from "./actions";
import { PageTitle } from "@/components/common/navigation/PageTitle";
import {
  DownloadIcon,
  MagnifyingGlassIcon,
  GearIcon,
} from "@radix-ui/react-icons";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"audit" | "system">("audit");
  const [searchQuery, setSearchQuery] = useState("");
  const [auditPage, setAuditPage] = useState(0);
  const [exportFormat, setExportFormat] = useState<"json" | "csv">("json");

  // Audit Log
  const { data: auditLogs, isLoading: auditLoading } = useQuery({
    queryKey: ["audit-logs", auditPage, searchQuery],
    queryFn: () =>
      searchQuery
        ? searchAuditLog(searchQuery)
        : getAuditLog(50, auditPage * 50),
  });

  const { data: auditCount } = useQuery({
    queryKey: ["audit-count"],
    queryFn: () => getAuditLogCount(),
  });

  // System Settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["system-settings"],
    queryFn: () => getSystemSettings(),
  });

  const [formSettings, setFormSettings] = useState<any>(settings || {});

  const updateSettingsMutation = useMutation({
    mutationFn: () => updateSystemSettings(formSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
    },
  });

  const exportAuditMutation = useMutation({
    mutationFn: () => exportAuditLog(exportFormat),
    onSuccess: (data) => {
      const mimeType = exportFormat === "json" ? "application/json" : "text/csv";
      const ext = exportFormat === "json" ? "json" : "csv";
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().split("T")[0]}.${ext}`;
      a.click();
    },
  });

  React.useEffect(() => {
    if (settings) {
      setFormSettings(settings);
    }
  }, [settings]);

  return (
    <>
      <PageTitle
        metadata={{
          title: "Settings & Audit",
          description: "Manage system settings and audit logs",
        }}
      />

      <Tabs.Root value={activeTab} onValueChange={setActiveTab as any}>
        <Tabs.List>
          <Tabs.Trigger value="audit">Audit Log</Tabs.Trigger>
          <Tabs.Trigger value="system">System Settings</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="audit">
          <Flex direction="column" gap="4" style={{ marginTop: "1rem" }}>
            {/* Stats */}
            <Card>
              <Flex direction="column" gap="2">
                <Text size="1" weight="medium" color="gray">
                  Total Audit Entries
                </Text>
                {auditCount !== undefined ? (
                  <Heading size="6">{auditCount}</Heading>
                ) : (
                  <Skeleton width="80px" height="32px" />
                )}
              </Flex>
            </Card>

            {/* Controls */}
            <Flex gap="3" direction={{ initial: "column", sm: "row" }}>
              <TextField.Root
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setAuditPage(0);
                }}
                className="flex-grow"
              >
                <TextField.Slot>
                  <MagnifyingGlassIcon />
                </TextField.Slot>
              </TextField.Root>
              <Button
                onClick={() => exportAuditMutation.mutate()}
                variant="soft"
                disabled={exportAuditMutation.isPending}
              >
                <DownloadIcon /> Export
              </Button>
            </Flex>

            {/* Audit Log Table */}
            {auditLoading ? (
              <Skeleton width="100%" height="400px" />
            ) : auditLogs && auditLogs.length > 0 ? (
              <ScrollArea>
                <Table.Root>
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell>User</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Action</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Object</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Timestamp</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Details</Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {auditLogs.map((log) => (
                      <Table.Row key={log.id}>
                        <Table.Cell>
                          <Text size="1">{log.user}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge>{log.action}</Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Flex direction="column" gap="1">
                            <Text size="1">{log.object.type}</Text>
                            <Text size="1" color="gray">
                              {log.object.id.substring(0, 16)}
                            </Text>
                          </Flex>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="1" color="gray">
                            {new Date(log.timestamp).toLocaleString()}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="1" color="gray">
                            {log.details?.substring(0, 30)}
                          </Text>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </ScrollArea>
            ) : (
              <Card>
                <Text color="gray">No audit logs found</Text>
              </Card>
            )}

            {/* Pagination */}
            {!searchQuery && (
              <Flex gap="2" justify="center">
                <Button
                  variant="soft"
                  onClick={() =>
                    setAuditPage((p) => Math.max(0, p - 1))
                  }
                  disabled={auditPage === 0}
                >
                  Previous
                </Button>
                <Text align="center" style={{ minWidth: "100px" }}>
                  Page {auditPage + 1}
                </Text>
                <Button
                  variant="soft"
                  onClick={() => setAuditPage((p) => p + 1)}
                  disabled={!auditLogs || auditLogs.length < 50}
                >
                  Next
                </Button>
              </Flex>
            )}
          </Flex>
        </Tabs.Content>

        <Tabs.Content value="system">
          <Flex direction="column" gap="4" style={{ marginTop: "1rem" }}>
            {settingsLoading ? (
              <>
                <Skeleton width="100%" height="200px" />
                <Skeleton width="100%" height="200px" />
              </>
            ) : (
              <>
                <Card>
                  <Flex direction="column" gap="4">
                    <Heading size="5">
                      <GearIcon /> General Settings
                    </Heading>

                    <label>
                      <Text as="div" size="2" mb="1" weight="medium">
                        Maximum Case Age (days)
                      </Text>
                      <TextField.Root
                        type="number"
                        value={formSettings.maxCaseAge || ""}
                        onChange={(e) =>
                          setFormSettings({
                            ...formSettings,
                            maxCaseAge: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </label>

                    <label>
                      <Text as="div" size="2" mb="1" weight="medium">
                        Strike Decay Period (months)
                      </Text>
                      <TextField.Root
                        type="number"
                        value={formSettings.strikeDecayMonths || ""}
                        onChange={(e) =>
                          setFormSettings({
                            ...formSettings,
                            strikeDecayMonths: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </label>

                    <label>
                      <Text as="div" size="2" mb="1" weight="medium">
                        Suspension Appeal Days
                      </Text>
                      <TextField.Root
                        type="number"
                        value={formSettings.suspensionAppealDays || ""}
                        onChange={(e) =>
                          setFormSettings({
                            ...formSettings,
                            suspensionAppealDays: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </label>

                    <label>
                      <Text as="div" size="2" mb="1" weight="medium">
                        Admin Email
                      </Text>
                      <TextField.Root
                        type="email"
                        value={formSettings.notificationEmail || ""}
                        onChange={(e) =>
                          setFormSettings({
                            ...formSettings,
                            notificationEmail: e.target.value,
                          })
                        }
                      />
                    </label>

                    <label>
                      <Text as="div" size="2" mb="1" weight="medium">
                        Audit Log Retention (months)
                      </Text>
                      <TextField.Root
                        type="number"
                        value={formSettings.logRetentionMonths || ""}
                        onChange={(e) =>
                          setFormSettings({
                            ...formSettings,
                            logRetentionMonths: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </label>
                  </Flex>
                </Card>

                <Card>
                  <Flex direction="column" gap="4">
                    <Heading size="5">Automation Settings</Heading>

                    <Flex align="center" justify="between">
                      <label htmlFor="autoclose">
                        <Text weight="medium">Auto-Close Reports</Text>
                      </label>
                      <Switch
                        id="autoclose"
                        checked={formSettings.reportAutoClose || false}
                        onCheckedChange={(checked) =>
                          setFormSettings({
                            ...formSettings,
                            reportAutoClose: checked,
                          })
                        }
                      />
                    </Flex>

                    {formSettings.reportAutoClose && (
                      <label>
                        <Text as="div" size="2" mb="1" weight="medium">
                          Auto-Close After (days)
                        </Text>
                        <TextField.Root
                          type="number"
                          value={formSettings.reportAutoCloseAge || ""}
                          onChange={(e) =>
                            setFormSettings({
                              ...formSettings,
                              reportAutoCloseAge: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </label>
                    )}
                  </Flex>
                </Card>

                <Button
                  size="3"
                  onClick={() => updateSettingsMutation.mutate()}
                  disabled={updateSettingsMutation.isPending}
                >
                  {updateSettingsMutation.isPending
                    ? "Saving..."
                    : "Save Changes"}
                </Button>
              </>
            )}
          </Flex>
        </Tabs.Content>
      </Tabs.Root>
    </>
  );
}
