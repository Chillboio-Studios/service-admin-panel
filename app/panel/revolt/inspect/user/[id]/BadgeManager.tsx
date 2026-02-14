"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import {
  Badge,
  Button,
  Checkbox,
  Flex,
  Text,
} from "@radix-ui/themes";

import { setUserBadges } from "./actions";

const USER_BADGES: Record<string, number> = {
  Developer: 1,
  Translator: 2,
  "Supporter (Donated)": 4,
  "Responsible Disclosure": 8,
  "Early Adopter": 16,
  "Platform Moderator": 32,
  "Platform Admin": 64,
  "Platform Owner": 128,
};

export function BadgeManager({
  userId,
  initialBadges,
}: {
  userId: string;
  initialBadges: number;
}) {
  const [badges, setBadges] = useState(initialBadges);

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await setUserBadges(userId, badges);
      return result;
    },
  });

  const toggleBadge = (value: number) => {
    setBadges((current) =>
      current & value ? current & ~value : current | value,
    );
  };

  const hasChanges = badges !== initialBadges;

  return (
    <Flex direction="column" gap="2">
      {Object.entries(USER_BADGES).map(([name, value]) => (
        <Text as="label" size="2" key={name}>
          <Flex gap="2" align="center">
            <Checkbox
              checked={!!(badges & value)}
              onCheckedChange={() => toggleBadge(value)}
            />
            {name}
            <Badge color="gray" size="1">
              {value}
            </Badge>
          </Flex>
        </Text>
      ))}

      <Flex gap="2" align="center" mt="2">
        <Button
          disabled={!hasChanges || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? "Saving..." : "Save Badges"}
        </Button>
        <Text size="1" color="gray">
          Current value: {badges}
        </Text>
        {mutation.isSuccess && (
          <Badge color="green">Saved!</Badge>
        )}
        {mutation.isError && (
          <Badge color="red">Error saving badges</Badge>
        )}
      </Flex>
    </Flex>
  );
}
