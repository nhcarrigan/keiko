/**
 * @copyright NHCarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */

/**
 * Sleeps for a given number of milliseconds.
 * @param milliseconds - The number of milliseconds to sleep.
 * @returns A promise that resolves after the given number of milliseconds.
 */
export const sleep = async(milliseconds: number): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
};
