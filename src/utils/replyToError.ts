/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  type MessageContextMenuCommandInteraction,
} from "discord.js";

/**
 * Responds to an interaction with a generic error message.
 * @param interaction -- The interaction payload from Discord.
 */
export const replyToError = async(
  interaction:
    | ChatInputCommandInteraction
    | MessageContextMenuCommandInteraction,
): Promise<void> => {
  const button = new ButtonBuilder().
    setLabel("Need help?").
    setStyle(ButtonStyle.Link).
    setURL("https://chat.nhcarrigan.com");
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
  if (interaction.deferred || interaction.replied) {
    await interaction.editReply({
      components: [ row ],
      content:    "Something went wrong with this command.",
    });
    return;
  }
  await interaction.reply({
    components: [ row ],
    content:    "Something went wrong with this command.",
  });
};
