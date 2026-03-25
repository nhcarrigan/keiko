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

/**
 * Duration choices in seconds mapped to human-readable labels.
 */
const durationChoices = [
  { name: "1 Minute", value: "60" },
  { name: "5 Minutes", value: "300" },
  { name: "10 Minutes", value: "600" },
  { name: "30 Minutes", value: "1800" },
  { name: "1 Hour", value: "3600" },
  { name: "6 Hours", value: "21600" },
  { name: "12 Hours", value: "43200" },
  { name: "1 Day", value: "86400" },
  { name: "3 Days", value: "259200" },
  { name: "7 Days", value: "604800" },
  { name: "14 Days", value: "1209600" },
  { name: "28 Days", value: "2419200" },
] as const;

const muteCommand: Command = {
  data: new SlashCommandBuilder().
    setName("mute").
    setDescription("Apply a timeout to a member.").
    setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).
    setContexts([ InteractionContextType.Guild ]).
    addUserOption((option) => {
      return option.
        setName("user").
        setDescription("The member to mute.").
        setRequired(true);
    }).
    addStringOption((option) => {
      return option.
        setName("duration").
        setDescription("How long to mute the member.").
        setRequired(true).
        addChoices(...durationChoices);
    }).
    addStringOption((option) => {
      return option.
        setName("reason").
        setDescription("The reason for the mute.").
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
    const durationSeconds = Number.parseInt(
      interaction.options.getString("duration", true),
      10,
    );
    const reason = interaction.options.getString("reason", true);
    const durationLabel
      = durationChoices.find((choice) => {
        return choice.value === String(durationSeconds);
      })?.
        name ?? `${durationSeconds.toString()}s`;

    if (target.bot) {
      await interaction.editReply(
        errorReply("Invalid Target", "You cannot mute a bot."),
      );
      return;
    }

    if (target.id === interaction.user.id) {
      await interaction.editReply(
        errorReply("Invalid Target", "You cannot mute yourself."),
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
          "You cannot mute someone with an equal or higher role.",
        ),
      );
      return;
    }

    const milliseconds = durationSeconds * 1000;
    const timeoutUntil = new Date(Date.now() + milliseconds);

    try {
      await member.disableCommunicationUntil(timeoutUntil, reason);
    } catch {
      await interaction.editReply(
        errorReply(
          "Action Failed",
          "Failed to apply the timeout. "
          + "Check my permissions and role hierarchy.",
        ),
      );
      return;
    }

    const sanctionNumber = await sendSanction({
      reason:   reason,
      type:     "mute",
      username: target.username,
      uuid:     target.id,
    });

    try {
      await target.send(
        `You have been muted in **${interaction.guild?.name ?? "the server"}** for **${durationLabel}**.\n**Reason:** ${reason}`,
      );
    } catch {
      // DMs may be closed; continue without failing the command.
    }

    await logModerationAction(interaction.client, {
      action:         "Member Muted",
      emoji:          "🔇",
      moderatorTag:   interaction.user.username,
      reason:         reason,
      sanctionNumber: sanctionNumber,
      source:         "Command",
      targetId:       target.id,
      targetTag:      target.username,
    });

    await interaction.editReply(
      successReply(
        "Member Muted",
        `**User**: ${target.username} (\`${target.id}\`)\n**Duration**: ${durationLabel}\n**Reason**: ${reason}`,
      ),
    );
  },
};

void logger.log("debug", "Mute command loaded.");

export { muteCommand };
