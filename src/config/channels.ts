/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */

/**
 * Channel IDs for the SpellWare community server.
 */
export const channelConfig = {

  /**
   * Channel for message, thread, and voice activity events.
   */
  activityLog: "1386142996218646589",

  /**
   * Channel for moderation actions (commands and audit log).
   */
  modLog: "1386143438755332117",

  /**
   * Channel for member join and leave events.
   */
  welcomeLog: "1486178785723285524",
} as const;
