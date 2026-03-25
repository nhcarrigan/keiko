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

const kickCommand: Command = {
  data: new SlashCommandBuilder().
    setName("kick").
    setDescription("Kick a member from the server.").
    setDefaultMemberPermissions(PermissionFlagsBits.KickMembers).
    setContexts([ InteractionContextType.Guild ]).
    addUserOption((option) => {
      return option.
        setName("user").
        setDescription("The member to kick.").
        setRequired(true);
    }).
    addStringOption((option) => {
      return option.
        setName("reason").
        setDescription("The reason for the kick.").
        setRequired(true).
        setMaxLength(512);
    }),

  execute: async(interaction) => {
    await interaction.deferReply({ ephemeral: true });

    const hasPermission = interaction.memberPermissions?.has(
      PermissionFlagsBits.KickMembers,
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
        errorReply("Invalid Target", "You cannot kick a bot."),
      );
      return;
    }

    if (target.id === interaction.user.id) {
      await interaction.editReply(
        errorReply("Invalid Target", "You cannot kick yourself."),
      );
      return;
    }

    const member = interaction.guild?.members.cache.get(target.id);

    if (!member) {
      await interaction.editReply(
        errorReply("Member Not Found", "That user is not in this server."),
      );
      return;
    }

    const selfMember = interaction.guild?.members.cache.get(
      interaction.user.id,
    );
    if (
      selfMember
      && member.roles.highest.position >= selfMember.roles.highest.position
    ) {
      await interaction.editReply(
        errorReply(
          "Insufficient Permissions",
          "You cannot kick someone with an equal or higher role.",
        ),
      );
      return;
    }

    try {
      await target.send(
        `You have been kicked from **${interaction.guild?.name ?? "the server"}**.\n**Reason:** ${reason}`,
      );
    } catch {
      // DMs may be closed; continue without failing the command.
    }

    try {
      await member.kick(reason);
    } catch {
      await interaction.editReply(
        errorReply(
          "Action Failed",
          "Failed to kick the member. Check my permissions and role hierarchy.",
        ),
      );
      return;
    }

    const sanctionNumber = await sendSanction({
      reason:   reason,
      type:     "kick",
      username: target.username,
      uuid:     target.id,
    });

    await logModerationAction(interaction.client, {
      action:         "Member Kicked",
      emoji:          "👢",
      moderatorTag:   interaction.user.username,
      reason:         reason,
      sanctionNumber: sanctionNumber,
      source:         "Command",
      targetId:       target.id,
      targetTag:      target.username,
    });

    await interaction.editReply(
      successReply(
        "Member Kicked",
        `**User**: ${target.username} (\`${target.id}\`)\n**Reason**: ${reason}`,
      ),
    );
  },
};

void logger.log("debug", "Kick command loaded.");

export { kickCommand };
