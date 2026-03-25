/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */

import {
  ChannelType,
  type GuildMember,
  type PartialGuildMember,
} from "discord.js";
import { channelConfig } from "../config/channels.js";
import { memberMessage } from "../utils/components.js";
import { logger } from "../utils/logger.js";

/**
 * Logs a member leave event to the welcome log channel.
 * @param member - The guild member who left (may be partial if uncached).
 * @returns A promise that resolves when the event has been logged.
 */
export const onGuildMemberRemove = async(
  member: GuildMember | PartialGuildMember,
): Promise<void> => {
  try {
    const rawChannel = member.client.channels.cache.get(
      channelConfig.welcomeLog,
    );

    if (rawChannel?.type !== ChannelType.GuildText) {
      return;
    }

    const joinedAt = member.joinedAt === null
      ? "Unknown"
      : member.joinedAt.toLocaleDateString("en-GB", {
        day:   "2-digit",
        month: "short",
        year:  "numeric",
      });

    const fields = [
      `**User**: ${member.user.username} (\`${member.id}\`)`,
      `**Joined**: ${joinedAt}`,
    ].join("\n");

    await rawChannel.send(memberMessage("leave", fields));
  } catch (error) {
    await logger.error(
      "Failed to log member leave",
      error instanceof Error
        ? error
        : new Error(String(error)),
    );
  }
};
