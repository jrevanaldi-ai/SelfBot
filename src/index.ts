import { config, validateConfig } from './config/env.js';
import { logger } from './utils/logger.js';
import { createSocket } from './socket/createSocket.js';
import { bindConnectionEvents } from './events/connection.js';
import { bindMessageEvents } from './events/messages.js';
import type { BotSocket } from './types/command.js';

let restartTimer: NodeJS.Timeout | null = null;

async function startBot(): Promise<BotSocket> {
  validateConfig();

  const sock = await createSocket();

  bindConnectionEvents(sock, {
    onReconnect: scheduleReconnect,
  });
  bindMessageEvents(sock);

  return sock;
}

function scheduleReconnect(): void {
  if (restartTimer) return;

  restartTimer = setTimeout(() => {
    restartTimer = null;
    startBot().catch((error) => {
      logger.error({ err: error }, 'Failed to reconnect');
      scheduleReconnect();
    });
  }, config.reconnectDelayMs);
}

process.on('uncaughtException', (error) => {
  logger.error({ err: error }, 'Uncaught exception');
});

process.on('unhandledRejection', (error) => {
  logger.error({ err: error }, 'Unhandled rejection');
});

startBot().catch((error) => {
  logger.error({ err: error }, 'Failed to start bot');
  process.exitCode = 1;
});
