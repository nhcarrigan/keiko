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
import {
  errorReply,
  sanctionDmMessage,
  successReply,
} from "../utils/components.js";
import { logger } from "../utils/logger.js";
import type { Command } from "../interfaces/command.js";

const banCommand: Command = {
  data: new SlashCommandBuilder().
    setName("ban").
    setDescription("Ban a member from the server.").
    setDefaultMemberPermissions(PermissionFlagsBits.BanMembers).
    setContexts([ InteractionContextType.Guild ]).
    addUserOption((option) => {
      return option.
        setName("user").
        setDescription("The member to ban.").
        setRequired(true);
    }).
    addStringOption((option) => {
      return option.
        setName("reason").
        setDescription("The reason for the ban.").
        setRequired(true).
        setMaxLength(512);
    }).
    addIntegerOption((option) => {
      return option.
        setName("days").
        setDescription(
          "Days of message history to delete (0–7). Defaults to 0.",
        ).
        setRequired(false).
        setMinValue(0).
        setMaxValue(7);
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
    const days = interaction.options.getInteger("days") ?? 0;

    if (target.bot) {
      await interaction.editReply(
        errorReply("Invalid Target", "You cannot ban a bot."),
      );
      return;
    }

    if (target.id === interaction.user.id) {
      await interaction.editReply(
        errorReply("Invalid Target", "You cannot ban yourself."),
      );
      return;
    }

    const member = interaction.guild?.members.cache.get(target.id);

    if (member) {
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
            "You cannot ban someone with an equal or higher role.",
          ),
        );
        return;
      }

      try {
        await target.send(
          sanctionDmMessage(
            `You have been banned from **${interaction.guild?.name ?? "the server"}**.\n**Reason:** ${reason}`,
            "ban",
          ),
        );
      } catch {
        // DMs may be closed; continue without failing the command.
      }
    }

    try {
      await interaction.guild?.bans.create(target.id, {
        deleteMessageSeconds: days * 86_400,
        reason:               reason,
      });
    } catch {
      await interaction.editReply(
        errorReply(
          "Action Failed",
          "Failed to ban the member. Check my permissions and role hierarchy.",
        ),
      );
      return;
    }

    const sanctionNumber = await sendSanction({
      reason:   reason,
      type:     "ban",
      username: target.username,
      uuid:     target.id,
    });

    await logModerationAction(interaction.client, {
      action:         "Member Banned",
      colour:         "ban",
      emoji:          "🔨",
      moderatorTag:   interaction.user.username,
      reason:         reason,
      sanctionNumber: sanctionNumber,
      source:         "Command",
      targetId:       target.id,
      targetTag:      target.username,
    });

    await interaction.editReply(
      successReply(
        "Member Banned",
        `**User**: ${target.username} (\`${target.id}\`)\n**Days Deleted**: ${days.toString()}\n**Reason**: ${reason}`,
      ),
    );
  },
};

void logger.log("debug", "Ban command loaded.");

export { banCommand };
