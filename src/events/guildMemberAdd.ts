/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */

import { ChannelType, type GuildMember } from "discord.js";
import { channelConfig } from "../config/channels.js";
import { memberMessage } from "../utils/components.js";
import { logger } from "../utils/logger.js";

/**
 * Logs a member join event to the welcome log channel.
 * @param member - The guild member who joined.
 * @returns A promise that resolves when the event has been logged.
 */
export const onGuildMemberAdd = async(member: GuildMember): Promise<void> => {
  try {
    const rawChannel = member.client.channels.cache.get(
      channelConfig.welcomeLog,
    );

    if (rawChannel?.type !== ChannelType.GuildText) {
      return;
    }

    const createdAt = member.user.createdAt.toLocaleDateString("en-GB", {
      day:   "2-digit",
      month: "short",
      year:  "numeric",
    });

    const fields = [
      `**User**: ${member.user.username} (\`${member.user.id}\`)`,
      `**Account Created**: ${createdAt}`,
    ].join("\n");

    await rawChannel.send(memberMessage("join", fields));
  } catch (error) {
    await logger.error(
      "Failed to log member join",
      error instanceof Error
        ? error
        : new Error(String(error)),
    );
  }
};
