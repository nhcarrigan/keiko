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
  type Message,
} from "discord.js";

const naomiId = "465650873650118659";

/**
 * Checks if a user has an active entitlement (subscription) for the bot.
 * If they do not, it responds to the interaction with a button to subscribe.
 * @param interaction -- The interaction payload from Discord.
 * @returns A boolean indicating whether the user is subscribed.
 */
const isNaomiInteraction = async(
  interaction: ChatInputCommandInteraction,
): Promise<boolean> => {
  const isNaomi = interaction.user.id === naomiId;

  if (!isNaomi) {
    const subscribeButton = new ButtonBuilder().
      setStyle(ButtonStyle.Premium).
      setSKUId("1425905043244060762");
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      subscribeButton,
    );
    await interaction.editReply({
      components: [ row ],
      // eslint-disable-next-line stylistic/max-len -- Big boi string.
      content:    "Sorry, as Naomi's personal assistant I am unable to assist you with your request. However, consider donating to Naomi so she can create additional free tools you CAN use.",
    });
    return false;
  }
  return true;
};

/**
 * Checks if a user has an active entitlement (subscription) for the bot.
 * If they do not, it responds to the message with a button to subscribe.
 * @param message -- The message payload from Discord.
 * @returns A boolean indicating whether the user is subscribed.
 */
const isNaomiMessage = async(
  message: Message,
): Promise<boolean> => {
  if (message.author.id === "465650873650118659") {
    return true;
  }
  const subscribeButton = new ButtonBuilder().
    setStyle(ButtonStyle.Premium).
    setSKUId("1425905043244060762");
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    subscribeButton,
  );
  await message.client.application.entitlements.fetch();
  const isEntitled = message.client.application.entitlements.cache.find(
    (entitlement) => {
      return entitlement.userId === message.author.id && entitlement.isActive();
    },
  );

  if (!isEntitled) {
    await message.reply({
      components: [ row ],
      // eslint-disable-next-line stylistic/max-len -- Big boi string.
      content:    "Sorry, as Naomi's personal assistant I am unable to assist you with your request. However, consider donating to Naomi so she can create additional free tools you CAN use.",
    });
    return false;
  }
  return true;
};

export { isNaomiInteraction, isNaomiMessage };
