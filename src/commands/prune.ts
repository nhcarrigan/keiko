/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */
/* eslint-disable max-lines-per-function -- Command handlers have many validation and action steps */

import {
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type GuildTextBasedChannel,
} from "discord.js";
import { logModerationAction } from "../modules/logModAction.js";
import { errorReply, successReply } from "../utils/components.js";
import { logger } from "../utils/logger.js";
import type { Command } from "../interfaces/command.js";

/**
 * Performs a bulk delete on a text channel and returns the number deleted,
 * or null if the bulk delete fails.
 * Wrapped to handle the type narrowing gap after isTextBased() checks.
 * @param channel - The text channel to delete messages from.
 * @param amount - The number of messages to delete.
 * @returns The number of messages actually deleted, or null on failure.
 */
const bulkDeleteMessages = async(
  channel: GuildTextBasedChannel,
  amount: number,
): Promise<number | null> => {
  try {
    const deleted = await channel.bulkDelete(amount, true);
    return deleted.size;
  } catch {
    return null;
  }
};

const pruneCommand: Command = {
  data: new SlashCommandBuilder().
    setName("prune").
    setDescription("Delete the last N messages in this channel.").
    setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).
    setContexts([ InteractionContextType.Guild ]).
    addIntegerOption((option) => {
      return option.
        setName("amount").
        setDescription("Number of messages to delete (1–100).").
        setRequired(true).
        setMinValue(1).
        setMaxValue(100);
    }),

  execute: async(interaction) => {
    await interaction.deferReply({ ephemeral: true });

    const hasPermission = interaction.memberPermissions?.has(
      PermissionFlagsBits.ManageMessages,
    );
    if (hasPermission !== true) {
      await interaction.editReply(
        errorReply(
          "Insufficient Permissions",
          "You do not have permission to use this command.",
        ),
      );
      return;
    }

    const amount = interaction.options.getInteger("amount", true);
    const rawChannel = interaction.channel;

    if (rawChannel?.isTextBased() !== true) {
      await interaction.editReply(
        errorReply(
          "Invalid Channel",
          "This command can only be used in text channels.",
        ),
      );
      return;
    }

    const channelName = "name" in rawChannel
      ? String(rawChannel.name)
      : rawChannel.id;

    /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- rawChannel is narrowed by isTextBased() but the type union is not fully resolved */
    const textChannel = rawChannel as GuildTextBasedChannel;

    const deletedCount = await bulkDeleteMessages(textChannel, amount);

    if (deletedCount === null) {
      await interaction.editReply(
        errorReply(
          "Action Failed",
          "Failed to delete messages. "
          + "Messages older than 14 days cannot be bulk deleted.",
        ),
      );
      return;
    }

    await logModerationAction(interaction.client, {
      action:         "Messages Pruned",
      emoji:          "🗑️",
      moderatorTag:   interaction.user.username,
      reason:         `Bulk delete of ${deletedCount.toString()} messages in <#${rawChannel.id}>`,
      sanctionNumber: null,
      source:         "Command",
      targetId:       rawChannel.id,
      targetTag:      `#${channelName}`,
    });

    await interaction.editReply(
      successReply(
        "Messages Pruned",
        `Deleted **${deletedCount.toString()}** messages from <#${rawChannel.id}>.`,
      ),
    );
  },
};

void logger.log("debug", "Prune command loaded.");

export { pruneCommand };
