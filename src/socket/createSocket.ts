import { makeWASocket, useMultiFileAuthState } from '@itsliaaa/baileys';
import { config } from '../config/env.js';
import { baileysLogger } from '../utils/logger.js';
import type { BotSocket } from '../types/command.js';

export async function createSocket(): Promise<BotSocket> {
  const { state, saveCreds } = await useMultiFileAuthState(config.sessionDir);

  const sock = makeWASocket({
    auth: state,
    logger: baileysLogger,
    markOnlineOnConnect: false,
    syncFullHistory: false,
  });

  sock.ev.on('creds.update', saveCreds);

  return sock;
}
