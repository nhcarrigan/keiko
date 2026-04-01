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
} from "discord.js";
import { logModerationAction } from "../modules/logModAction.js";
import { errorReply, successReply } from "../utils/components.js";
import { logger } from "../utils/logger.js";
import type { Command } from "../interfaces/command.js";

const unbanCommand: Command = {
  data: new SlashCommandBuilder().
    setName("unban").
    setDescription("Lift a ban from a user.").
    setDefaultMemberPermissions(PermissionFlagsBits.BanMembers).
    setContexts([ InteractionContextType.Guild ]).
    addUserOption((option) => {
      return option.
        setName("user").
        setDescription("The user to unban.").
        setRequired(true);
    }).
    addStringOption((option) => {
      return option.
        setName("reason").
        setDescription("The reason for lifting the ban.").
        setRequired(true).
        setMaxLength(512);
    }),

  execute: async(interaction) => {
    await interaction.deferReply({ ephemeral: true });

    const hasPermission = interaction.memberPermissions?.has(
      PermissionFlagsBits.BanMembers,
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

    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason", true);

    if (target.id === interaction.user.id) {
      await interaction.editReply(
        errorReply("Invalid Target", "You cannot unban yourself."),
      );
      return;
    }

    try {
      await interaction.guild?.bans.fetch(target.id);
    } catch {
      await interaction.editReply(
        errorReply("Not Banned", "That user does not have an active ban."),
      );
      return;
    }

    try {
      await interaction.guild?.bans.remove(target.id, reason);
    } catch {
      await interaction.editReply(
        errorReply(
          "Action Failed",
          "Failed to remove the ban. Check my permissions.",
        ),
      );
      return;
    }

    await logModerationAction(interaction.client, {
      action:         "Member Unbanned",
      colour:         "unban",
      emoji:          "🔓",
      moderatorTag:   interaction.user.username,
      reason:         reason,
      sanctionNumber: null,
      source:         "Command",
      targetId:       target.id,
      targetTag:      target.username,
    });

    await interaction.editReply(
      successReply(
        "Member Unbanned",
        `**User**: ${target.username} (\`${target.id}\`)\n**Reason**: ${reason}`,
      ),
    );
  },
};

void logger.log("debug", "Unban command loaded.");

export { unbanCommand };
