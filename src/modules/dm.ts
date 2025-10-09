/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */

import { MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { isNaomiInteraction } from "../utils/isNaomi.js";
import { logger } from "../utils/logger.js";
import { replyToError } from "../utils/replyToError.js";

/**
 * Sends a DM to start a conversation in case the DM channel is lost.
 * @param interaction -- The interaction payload from Discord.
 */
export const dm = async(
  interaction: ChatInputCommandInteraction,
): Promise<void> => {
  try {
    await interaction.deferReply({ flags: [ MessageFlags.Ephemeral ] });

    const isNaomi = await isNaomiInteraction(interaction);
    if (!isNaomi) {
      return;
    }
    await interaction.user.send(
      "Hello Naomi. How may I serve you today?",
    );
    await interaction.reply({
      content:   "I've sent you a DM!",
      ephemeral: true,
    });
  } catch (error) {
    await replyToError(interaction);
    if (error instanceof Error) {
      await logger.error("about command", error);
    }
  }
};
