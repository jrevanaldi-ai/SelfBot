import { Boom } from '@hapi/boom';
import { delay, DisconnectReason } from '@itsliaaa/baileys';
import { config } from '../config/env.js';
import { markReady } from '../utils/readyGate.js';
import type { BotSocket } from '../types/command.js';

interface ConnectionHandlers {
  onReconnect: () => void;
}

interface ConnectionUpdate {
  connection?: string;
  lastDisconnect?: {
    error?: any;
  };
}

let pairingCodeRequested = false;

export function bindConnectionEvents(sock: BotSocket, { onReconnect }: ConnectionHandlers): void {
  sock.ev.on('connection.update', async (update: ConnectionUpdate) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'connecting') {
      await requestPairingCodeIfNeeded(sock);
      return;
    }

    if (connection === 'open') {
      pairingCodeRequested = false;
      markReady();
      return;
    }

    if (connection === 'close') {
      const statusCode =
        lastDisconnect?.error?.output?.statusCode ||
        new Boom(lastDisconnect?.error).output.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect) onReconnect();
      return;
    }
  });
}

async function requestPairingCodeIfNeeded(sock: BotSocket): Promise<void> {
  if (sock.authState.creds.registered || pairingCodeRequested) return;

  pairingCodeRequested = true;

  try {
    await delay(1500);

    const code = await sock.requestPairingCode(config.phoneNumber);

    console.log('');
    console.log(`Pairing code: ${code}`);
    console.log(
      'Buka WhatsApp -> Perangkat tertaut -> Tautkan perangkat -> Tautkan dengan nomor telepon.',
    );
    console.log('');
  } catch (error) {
    pairingCodeRequested = false;
    throw error;
  }
}
