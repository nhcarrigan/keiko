/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */

import {
  MessageFlags,
  type ChatInputCommandInteraction,
} from "discord.js";
import { isNaomiInteraction } from "../utils/isNaomi.js";
import { logger } from "../utils/logger.js";
import { replyToError } from "../utils/replyToError.js";

/**
 * Sends a clear message in the DMs.
 * @param interaction -- The interaction payload from Discord.
 */
export const clear = async(
  interaction: ChatInputCommandInteraction,
): Promise<void> => {
  try {
    await interaction.deferReply({ flags: [ MessageFlags.Ephemeral ] });

    const isNaomi = await isNaomiInteraction(interaction);
    if (!isNaomi) {
      return;
    }
    const sent = await interaction.user.send({
      content: "<Clear History>",
    }).catch(() => {
      return null;
    });

    await interaction.editReply({
      content: sent
        ? "I have added a clear history marker to your DMs."
        // eslint-disable-next-line stylistic/max-len -- This is a long string.
        : "I was unable to send you a DM. Please ensure your privacy settings allow direct messages.",
    });
  } catch (error) {
    await replyToError(interaction);
    if (error instanceof Error) {
      await logger.error("about command", error);
    }
  }
};
