/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */

import { logger } from "../utils/logger.js";

type SanctionType = "ban" | "kick" | "mute" | "warning";

interface SanctionPayload {
  readonly reason:   string;
  readonly type:     SanctionType;
  readonly username: string;
  readonly uuid:     string;
}

interface SanctionResponse {
  readonly message: string;
}

/**
 * Sends a sanction record to the Hikari sanction API.
 * Returns the assigned sanction number, or null if the request failed.
 * @param payload - The sanction payload to send.
 * @returns The assigned sanction number, or null if the request failed.
 */
const sendSanction = async(
  payload: SanctionPayload,
): Promise<number | null> => {
  try {
    const response = await fetch("https://hikari.nhcarrigan.com/api/sanction", {
      body:    JSON.stringify({ ...payload, platform: "discord" }),
      headers: {
        /* eslint-disable @typescript-eslint/naming-convention -- HTTP header names are not camelCase */
        "Authorization": process.env.SANCTION_TOKEN ?? "",
        "Content-Type":  "application/json",
        /* eslint-enable @typescript-eslint/naming-convention -- HTTP header names are not camelCase */
      },
      method: "POST",
    });

    if (response.ok) {
      /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Response shape is validated by the API contract */
      const data = (await response.json()) as SanctionResponse;
      const match = /(?<id>\d+)/.exec(data.message);
      return match?.groups?.id === undefined
        ? null
        : Number.parseInt(match.groups.id, 10);
    }

    const text = await response.text();
    await logger.error(
      "Sanction API error",
      new Error(`HTTP ${response.status.toString()}: ${text}`),
    );
    return null;
  } catch (error) {
    await logger.error(
      "Failed to reach sanction API",
      error instanceof Error
        ? error
        : new Error(String(error)),
    );
    return null;
  }
};

export type { SanctionType };
export { sendSanction };
