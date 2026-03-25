/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */

import { errorReply } from "../utils/components.js";
import { logger } from "../utils/logger.js";
import type { Command } from "../interfaces/command.js";
import type { Collection, Interaction } from "discord.js";

/**
 * Routes incoming slash command interactions to the appropriate command handler.
 * @param interaction - The Discord interaction that was created.
 * @param commands - The collection of registered commands.
 * @returns A promise that resolves when the interaction has been handled.
 */
export const onInteractionCreate = async(
  interaction: Interaction,
  commands: Collection<string, Command>,
): Promise<void> => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = commands.get(interaction.commandName);

  if (!command) {
    await interaction.reply(
      errorReply(
        "Unknown Command",
        `The command \`/${interaction.commandName}\` is not recognised.`,
      ),
    );
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    await logger.error(
      `Command /${interaction.commandName} failed`,
      error instanceof Error
        ? error
        : new Error(String(error)),
    );

    const replyPayload = errorReply(
      "An Error Occurred",
      "Something went wrong while running that command. Please try again.",
    );

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(replyPayload);
    } else {
      await interaction.reply(replyPayload);
    }
  }
};
