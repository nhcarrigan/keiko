/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */
/* eslint-disable max-lines-per-function -- Command handlers have many validation and action steps */
/* eslint-disable max-statements -- Command handlers have many validation and action steps */

import {
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { logModerationAction } from "../modules/logModAction.js";
import { errorReply, successReply } from "../utils/components.js";
import { logger } from "../utils/logger.js";
import type { Command } from "../interfaces/command.js";

const unmuteCommand: Command = {
  data: new SlashCommandBuilder().
    setName("unmute").
    setDescription("Remove a timeout from a member.").
    setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).
    setContexts([ InteractionContextType.Guild ]).
    addUserOption((option) => {
      return option.
        setName("user").
        setDescription("The member to unmute.").
        setRequired(true);
    }).
    addStringOption((option) => {
      return option.
        setName("reason").
        setDescription("The reason for removing the mute.").
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
          "You cannot unmute someone with an equal or higher role.",
        ),
      );
      return;
    }

    if (!member.isCommunicationDisabled()) {
      await interaction.editReply(
        errorReply("Not Muted", "That member does not have an active timeout."),
      );
      return;
    }

    try {
      await member.disableCommunicationUntil(null, reason);
    } catch {
      await interaction.editReply(
        errorReply(
          "Action Failed",
          "Failed to remove the timeout. "
          + "Check my permissions and role hierarchy.",
        ),
      );
      return;
    }

    await logModerationAction(interaction.client, {
      action:         "Member Unmuted",
      emoji:          "🔊",
      moderatorTag:   interaction.user.username,
      reason:         reason,
      sanctionNumber: null,
      source:         "Command",
      targetId:       target.id,
      targetTag:      target.username,
    });

    await interaction.editReply(
      successReply(
        "Member Unmuted",
        `**User**: ${target.username} (\`${target.id}\`)\n**Reason**: ${reason}`,
      ),
    );
  },
};

void logger.log("debug", "Unmute command loaded.");

export { unmuteCommand };
