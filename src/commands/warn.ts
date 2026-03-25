/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */
/* eslint-disable max-lines-per-function -- Command handlers have many validation and action steps */
/* eslint-disable max-statements -- Command handlers have many validation and action steps */
/* eslint-disable complexity -- Command handlers have multiple validation branches */

import {
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { logModerationAction } from "../modules/logModAction.js";
import { sendSanction } from "../modules/sendSanction.js";
import { errorReply, successReply } from "../utils/components.js";
import { logger } from "../utils/logger.js";
import type { Command } from "../interfaces/command.js";

const warnCommand: Command = {
  data: new SlashCommandBuilder().
    setName("warn").
    setDescription("Issue a formal warning to a member.").
    setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).
    setContexts([ InteractionContextType.Guild ]).
    addUserOption((option) => {
      return option.
        setName("user").
        setDescription("The member to warn.").
        setRequired(true);
    }).
    addStringOption((option) => {
      return option.
        setName("reason").
        setDescription("The reason for the warning.").
        setRequired(true).
        setMaxLength(512);
    }),

  execute: async(interaction) => {
    await interaction.deferReply({ ephemeral: true });

    const hasPermission = interaction.memberPermissions?.has(
      PermissionFlagsBits.ModerateMembers,
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

    if (target.bot) {
      await interaction.editReply(
        errorReply("Invalid Target", "You cannot warn a bot."),
      );
      return;
    }

    if (target.id === interaction.user.id) {
      await interaction.editReply(
        errorReply("Invalid Target", "You cannot warn yourself."),
      );
      return;
    }

    const member = interaction.guild?.members.cache.get(target.id);
    const selfMember = interaction.guild?.members.cache.get(
      interaction.user.id,
    );

    if (
      member
      && selfMember
      && member.roles.highest.position >= selfMember.roles.highest.position
    ) {
      await interaction.editReply(
        errorReply(
          "Insufficient Permissions",
          "You cannot warn someone with an equal or higher role.",
        ),
      );
      return;
    }

    const sanctionNumber = await sendSanction({
      reason:   reason,
      type:     "warning",
      username: target.username,
      uuid:     target.id,
    });

    try {
      await target.send(
        `You have received a warning in **${interaction.guild?.name ?? "the server"}**.\n**Reason:** ${reason}`,
      );
    } catch {
      // DMs may be closed; continue without failing the command.
    }

    await logModerationAction(interaction.client, {
      action:         "Warning Issued",
      emoji:          "⚠️",
      moderatorTag:   interaction.user.username,
      reason:         reason,
      sanctionNumber: sanctionNumber,
      source:         "Command",
      targetId:       target.id,
      targetTag:      target.username,
    });

    await interaction.editReply(
      successReply(
        "Warning Issued",
        `**User**: ${target.username} (\`${target.id}\`)\n**Reason**: ${reason}`,
      ),
    );
  },
};

void logger.log("debug", "Warn command loaded.");

export { warnCommand };
