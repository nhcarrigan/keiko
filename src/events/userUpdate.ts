/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */
/* eslint-disable unicorn/no-keyword-prefix -- old/new prefixes are the established Discord.js event parameter names */
/* eslint-disable max-lines-per-function -- Event handler checks multiple independent change types */

import { logActivity } from "../modules/logActivity.js";
import { logger } from "../utils/logger.js";
import type { PartialUser, User } from "discord.js";

/**
 * Logs user profile update events (username, display name, avatar) to the
 * activity log channel. Skips bots.
 * @param oldUser - The user before the update.
 * @param newUser - The user after the update.
 * @returns A promise that resolves when all applicable changes have been logged.
 */
export const onUserUpdate = async(
  oldUser: PartialUser | User,
  newUser: User,
): Promise<void> => {
  if (newUser.bot) {
    return;
  }

  try {
    if (oldUser.username !== newUser.username) {
      await logActivity({
        client: newUser.client,
        emoji:  "✏️",
        fields: [
          `**User**: ${newUser.username} (\`${newUser.id}\`)`,
          `**Before**: ${oldUser.username ?? "*(unknown)*"}`,
          `**After**: ${newUser.username}`,
        ].join("\n"),
        title: "Username Changed",
      });
    }

    if (oldUser.globalName !== newUser.globalName) {
      await logActivity({
        client: newUser.client,
        emoji:  "📛",
        fields: [
          `**User**: ${newUser.username} (\`${newUser.id}\`)`,
          `**Before**: ${oldUser.globalName ?? "*(none)*"}`,
          `**After**: ${newUser.globalName ?? "*(none)*"}`,
        ].join("\n"),
        title: "Display Name Changed",
      });
    }

    if (oldUser.avatar !== newUser.avatar) {
      await logActivity({
        client: newUser.client,
        emoji:  "🖼️",
        fields: [
          `**User**: ${newUser.username} (\`${newUser.id}\`)`,
          `**New Avatar**: ${newUser.displayAvatarURL()}`,
        ].join("\n"),
        title: "Avatar Changed",
      });
    }
  } catch (error) {
    await logger.error(
      "Failed to log user update",
      error instanceof Error
        ? error
        : new Error(String(error)),
    );
  }
};
