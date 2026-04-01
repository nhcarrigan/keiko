/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */
/* eslint-disable unicorn/no-keyword-prefix -- oldState/newState are the established Discord.js parameter names */

import { logActivity } from "../modules/logActivity.js";
import { logger } from "../utils/logger.js";
import type { VoiceState } from "discord.js";

/**
 * Resolves the action string for a voice state change.
 * @param oldState - The voice state before the update.
 * @param newState - The voice state after the update.
 * @returns A human-readable description of the voice action.
 */
const resolveVoiceAction = (
  oldState: VoiceState,
  newState: VoiceState,
): string => {
  if (!oldState.channel && newState.channel) {
    return `Joined <#${newState.channelId ?? "Unknown"}>`;
  }

  if (oldState.channel && !newState.channel) {
    return `Left <#${oldState.channelId ?? "Unknown"}>`;
  }

  return `Moved from <#${oldState.channelId ?? "Unknown"}> to <#${newState.channelId ?? "Unknown"}>`;
};

/**
 * Logs voice channel join, leave, and move events to the activity log channel.
 * @param oldState - The voice state before the update.
 * @param newState - The voice state after the update.
 * @returns A promise that resolves when the event has been logged.
 */
export const onVoiceStateUpdate = async(
  oldState: VoiceState,
  newState: VoiceState,
): Promise<void> => {
  if (oldState.channelId === newState.channelId) {
    return;
  }

  const user = newState.member?.user ?? oldState.member?.user;

  if (!user || user.bot) {
    return;
  }

  try {
    const action = resolveVoiceAction(oldState, newState);

    const fields = [
      `**User**: ${user.username} (\`${user.id}\`)`,
      `**Action**: ${action}`,
    ].join("\n");

    await logActivity({
      client: user.client,
      colour: "voiceState",
      emoji:  "🔊",
      fields: fields,
      title:  "Voice State Update",
    });
  } catch (error) {
    await logger.error(
      "Failed to log voice state update",
      error instanceof Error
        ? error
        : new Error(String(error)),
    );
  }
};
