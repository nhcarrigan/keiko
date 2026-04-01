/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */
/* eslint-disable unicorn/no-keyword-prefix -- old/new prefixes are the established Discord.js event parameter names */
/* eslint-disable max-lines-per-function -- Event handler checks multiple independent change types */
/* eslint-disable complexity -- Event handler branches cover distinct member update scenarios */
/* eslint-disable max-statements -- Event handler has many intermediate variables across change types */

import { logActivity } from "../modules/logActivity.js";
import { logger } from "../utils/logger.js";
import type { GuildMember, PartialGuildMember } from "discord.js";

/**
 * Logs member update events (roles, nickname, server avatar) to the activity
 * log channel. Skips bots and partial old-member states where comparison is
 * unreliable.
 * @param oldMember - The guild member before the update.
 * @param newMember - The guild member after the update.
 * @returns A promise that resolves when all applicable changes have been logged.
 */
export const onGuildMemberUpdate = async(
  oldMember: GuildMember | PartialGuildMember,
  newMember: GuildMember,
): Promise<void> => {
  if (newMember.user.bot) {
    return;
  }

  if (oldMember.partial) {
    return;
  }

  const { username, id: userId } = newMember.user;

  try {
    if (oldMember.nickname !== newMember.nickname) {
      const before = oldMember.nickname ?? "*(none)*";
      const after = newMember.nickname ?? "*(none)*";

      await logActivity({
        client: newMember.client,
        colour: "nicknameChange",
        emoji:  "📝",
        fields: [
          `**User**: ${username} (\`${userId}\`)`,
          `**Before**: ${before}`,
          `**After**: ${after}`,
        ].join("\n"),
        title: "Nickname Changed",
      });
    }

    const addedRoles = newMember.roles.cache.filter(
      (role) => {
        return !oldMember.roles.cache.has(role.id);
      },
    );

    if (addedRoles.size > 0) {
      const roleList = addedRoles.map((role) => {
        return `<@&${role.id}>`;
      }).join(", ");

      await logActivity({
        client: newMember.client,
        colour: "rolesAdded",
        emoji:  "➕",
        fields: [
          `**User**: ${username} (\`${userId}\`)`,
          `**Roles Added**: ${roleList}`,
        ].join("\n"),
        title: "Roles Added",
      });
    }

    const removedRoles = oldMember.roles.cache.filter(
      (role) => {
        return !newMember.roles.cache.has(role.id);
      },
    );

    if (removedRoles.size > 0) {
      const roleList = removedRoles.map((role) => {
        return `<@&${role.id}>`;
      }).join(", ");

      await logActivity({
        client: newMember.client,
        colour: "rolesRemoved",
        emoji:  "➖",
        fields: [
          `**User**: ${username} (\`${userId}\`)`,
          `**Roles Removed**: ${roleList}`,
        ].join("\n"),
        title: "Roles Removed",
      });
    }

    if (oldMember.avatar !== newMember.avatar) {
      await logActivity({
        client: newMember.client,
        colour: "serverAvatar",
        emoji:  "🖼️",
        fields: [
          `**User**: ${username} (\`${userId}\`)`,
          `**New Server Avatar**: ${newMember.displayAvatarURL()}`,
        ].join("\n"),
        title: "Server Avatar Changed",
      });
    }
  } catch (error) {
    await logger.error(
      "Failed to log member update",
      error instanceof Error
        ? error
        : new Error(String(error)),
    );
  }
};
