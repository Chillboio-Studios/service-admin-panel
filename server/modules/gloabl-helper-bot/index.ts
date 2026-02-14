import { bgWhite, blue } from "@colors/colors";
import type { Message } from "revolt-api";
import type { ProtocolV1 } from "revolt.js/lib/events/v1";
import { ulid } from "ulid";

import { sendMessage } from "../../../lib/core";
import {
  adminDiscoverRequests,
  bots,
  invites,
  servers,
} from "../../../lib/db/types";
import { RedisEventListener } from "../../../lib/events";
import { createLogger } from "../../logger";

/**
 * Logging for the module
 */
export const log = createLogger(bgWhite(" Helper Bot "));

/**
 * Helper bot
 */
class HelperBot extends RedisEventListener {
  /**
   * Handle events from Redis
   * @param event Event
   */
  handle(event: ProtocolV1["server"]) {
    if (event.type === "Message") {
      this.inspect(event as unknown as Message);
    }
  }

  RE_INVITE = /rvlt.gg\/([A-Za-z0-9]+)/;
  RE_ID = /[A-Z0-9]{26}/;

  /**
   * Inspect the actual message
   * @param message Message
   */
  async inspect(message: Message) {
    function reply(content: string) {
      sendMessage({
        author: "0".repeat(26),
        channel: message.channel,
        system: {
          type: "text",
          content,
        },
      });
    }

    // #Submit to Discover
    if (message.channel === "01FD53QCD84PX7D2GBV5SBE09N" && message.content) {
      const code = this.RE_INVITE.exec(message.content);
      if (code !== null) {
        const invite = await invites().findOne({
          _id: code[1],
        });

        if (invite?.type === "Server") {
          const server = await servers().findOne({
            _id: invite.server,
          });

          if (!server) return;
          if (server.discoverable) {
            reply(
              "This server is already discoverable!\nRankings are regenerated every 6 hours.\nAlso ensure you've sent at least 5 messages in the past week!",
            );

            return;
          }

          if (
            server.owner === message.author ||
            message.author === "01EX2NCWQ0CHS3QJF0FEQS1GR4"
          ) {
            if (
              await adminDiscoverRequests().findOne({
                serverId: server._id,
              })
            ) {
              reply(
                "You've already requested to be listed, please be patient.",
              );
            } else {
              await adminDiscoverRequests().insertOne({
                _id: ulid(),
                type: "Server",
                serverId: server._id,
              });

              reply(
                "Discover listing request created!\nYou will be sent a DM when your server is added.",
              );
            }
          } else {
            reply("Only the server owner may list servers on Discover!");
          }
        }
      } else {
        const id = this.RE_ID.exec(message.content);
        if (id !== null) {
          const bot = await bots().findOne({
            _id: id[0],
          });

          if (!bot) return;
          if (bot.discoverable) {
            reply(
              "This bot is already discoverable!\nRankings are regenerated every 6 hours.\nAlso ensure the bot has sent a message in the past week!",
            );

            return;
          }

          if (bot.owner === message.author) {
            if (
              await adminDiscoverRequests().findOne({
                botId: bot._id,
              })
            ) {
              reply(
                "You've already requested to be listed, please be patient.",
              );
            } else {
              await adminDiscoverRequests().insertOne({
                _id: ulid(),
                type: "Bot",
                botId: bot._id,
              });

              reply(
                "Discover listing request created!\nYou will be sent a DM when your bot is added.",
              );
            }
          } else {
            reply("Only the bot owner may list their bot on Discover!");
          }
        }
      }
    }
  }
}

const botShield = new HelperBot();
botShield.init([
  "01FD53QCD84PX7D2GBV5SBE09N", // #Submit to Discover
]);

log(blue("Bot listening for messages!"));