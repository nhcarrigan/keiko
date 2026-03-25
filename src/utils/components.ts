/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */
/* eslint-disable @typescript-eslint/naming-convention -- Enum-style constants use PascalCase by convention */
/* eslint-disable unicorn/prevent-abbreviations -- modLogMessage is the established, concise name for this function */

/**
 * Components v2 type constants.
 * These are the raw numeric values for Discord's new UI Kit components.
 */
const ComponentTypes = {
  Container:   17,
  Separator:   14,
  TextDisplay: 10,
} as const;

/**
 * Message flag bit values for Components v2 and ephemeral messages.
 * Ephemeral = 64 (1 << 6), IsComponentsV2 = 32768 (1 << 15).
 */
const MessageFlags = {
  Ephemeral:              64,
  EphemeralAndComponents: 32_832,
  IsComponentsV2:         32_768,
} as const;

const Colours = {
  error:     0xED_42_45,
  info:      0x58_65_F2,
  join:      0x57_F2_87,
  leave:     0x99_AA_B5,
  modAction: 0xE6_7E_22,
  success:   0x57_F2_87,
  warning:   0xFE_E7_5C,
} as const;
/* eslint-enable @typescript-eslint/naming-convention -- Enum-style constants use PascalCase by convention */

type ColourKey = keyof typeof Colours;

const buildContainer = (
  colour: ColourKey,
  ...lines: Array<string>
): Record<string, unknown> => {
  const components: Array<
    | { type: typeof ComponentTypes.TextDisplay; content: string }
    | {
      type:    typeof ComponentTypes.Separator;
      divider: true;
      spacing: 1;
    }
  > = [];

  for (const [ index, line ] of lines.entries()) {
    components.push({
      content: line,
      type:    ComponentTypes.TextDisplay,
    });
    if (index < lines.length - 1) {
      components.push({
        divider: true,
        spacing: 1,
        type:    ComponentTypes.Separator,
      });
    }
  }

  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention -- Discord API uses snake_case for accent_color
    accent_color: Colours[colour],
    components:   components,
    spoiler:      false,
    type:         ComponentTypes.Container,
  };
};

/**
 * Builds an ephemeral Components v2 success reply payload.
 * @param title - The title of the success message.
 * @param body - The body text of the success message.
 * @returns A Discord message payload object.
 */
const successReply = (title: string, body: string): Record<string, unknown> => {
  return {
    components: [ buildContainer("success", `## ✅ ${title}`, body) ],
    flags:      MessageFlags.EphemeralAndComponents,
  };
};

/**
 * Builds an ephemeral Components v2 error reply payload.
 * @param title - The title of the error message.
 * @param body - The body text of the error message.
 * @returns A Discord message payload object.
 */
const errorReply = (title: string, body: string): Record<string, unknown> => {
  return {
    components: [ buildContainer("error", `## ❌ ${title}`, body) ],
    flags:      MessageFlags.EphemeralAndComponents,
  };
};

/**
 * Builds a Components v2 channel message payload for mod log entries.
 * @param title - The formatted title string (emoji + action combined).
 * @param fields - The formatted field lines for the log entry.
 * @param source - Whether the action originated from a command or the audit log.
 * @returns A Discord message payload object.
 */
const modLogMessage = (
  title: string,
  fields: string,
  source: "Command" | "Audit Log",
): Record<string, unknown> => {
  return {
    components: [
      buildContainer(
        "modAction",
        `## ${title}`,
        fields,
        `*Source: ${source}*`,
      ),
    ],
    flags: MessageFlags.IsComponentsV2,
  };
};

/**
 * Builds a Components v2 channel message payload for activity log entries.
 * @param emoji - The emoji to prefix the title with.
 * @param title - The title of the activity entry.
 * @param fields - The formatted field lines.
 * @returns A Discord message payload object.
 */
const activityMessage = (
  emoji: string,
  title: string,
  fields: string,
): Record<string, unknown> => {
  return {
    components: [ buildContainer("info", `## ${emoji} ${title}`, fields) ],
    flags:      MessageFlags.IsComponentsV2,
  };
};

/**
 * Builds a Components v2 channel message payload for welcome/goodbye events.
 * @param type - Whether the member joined or left.
 * @param fields - The formatted field lines.
 * @returns A Discord message payload object.
 */
const memberMessage = (
  type: "join" | "leave",
  fields: string,
): Record<string, unknown> => {
  return {
    components: [
      buildContainer(
        type === "join"
          ? "join"
          : "leave",
        type === "join"
          ? "## 👋 Member Joined"
          : "## 🚪 Member Left",
        fields,
      ),
    ],
    flags: MessageFlags.IsComponentsV2,
  };
};

export {
  activityMessage,
  errorReply,
  memberMessage,
  modLogMessage,
  successReply,
};
