/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */

import fastify from "fastify";
import { logger } from "../utils/logger.js";

const html = `<!DOCTYPE html>
<html>
  <head>
    <title>Keiko</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="Naomi's personal AI assistant." />
    <script src="https://cdn.nhcarrigan.com/headers/index.js" async defer></script>
  </head>
  <body>
    <main>
    <h1>Keiko</h1>
    <img src="https://cdn.nhcarrigan.com/new-avatars/keiko-full.png" width="250" alt="Keiko" />
    <section>
      <p>Naomi's personal AI assistant.</p>
      <a href="https://chat.nhcarrigan.com" class="social-button discord-button" style="display: inline-block; background-color: #5865F2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 5px;">
        <i class="fab fa-discord"></i> Join our Discord
      </a>
    </section>
    <section>
        <h2>Links</h2>
        <p>
            <a href="https://git.nhcarrigan.com/nhcarrigan/keiko">
                <i class="fa-solid fa-code"></i> Source Code
            </a>
        </p>
        <p>
            <a href="https://docs.nhcarrigan.com/">
                <i class="fa-solid fa-book"></i> Documentation
            </a>
        </p>
        <p>
            <a href="https://chat.nhcarrigan.com">
                <i class="fa-solid fa-circle-info"></i> Support
            </a>
        </p>
    </section>
    </main>
  </body>
</html>`;

/**
 * Starts up a web server for health monitoring.
 */
export const instantiateServer = (): void => {
  try {
    const server = fastify({
      logger: false,
    });

    server.get("/", (_request, response) => {
      response.header("Content-Type", "text/html");
      response.send(html);
    });

    server.listen({ port: 3333 }, (error) => {
      if (error) {
        void logger.error("instantiate server", error);
        return;
      }
      void logger.log("debug", "Server listening on port 3333.");
    });
  } catch (error) {
    if (error instanceof Error) {
      void logger.error("instantiate server", error);
      return;
    }
    void logger.error("instantiate server", new Error(String(error)));
  }
};
