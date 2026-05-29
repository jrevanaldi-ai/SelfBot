import {
  getMessageJids,
  getPhoneNumberFromJid,
  getResolvableUserJid,
  jidType,
} from '../../utils/jids.js';
import type { BotCommand, BotSocket, CommandContext, UserIdLookup } from '../../types/command.js';

export default {
  name: 'id',
  aliases: ['jid', 'lid', 'pn'],
  category: 'general',
  description: 'Cek JID, PN, dan LID',
  async execute({ sock, message, reply, isGroup }: CommandContext) {
    const ids = getMessageJids(message);
    const lookupJid = getResolvableUserJid(ids);
    const resolved = lookupJid ? await findUserIds(sock, lookupJid) : null;

    const lines: string[] = ['*ID Info*'];

    if (isGroup) {
      lines.push('', '• Group');
      pushJid(lines, 'JID', ids.chatJid);
    }

    lines.push('', '• Sender');
    if (ids.senderPn) lines.push(`Nomor : ${ids.senderPn}`);
    pushJid(lines, 'PN', ids.senderPnJid);
    pushJid(lines, 'LID', ids.senderLid);
    if (!ids.senderPn && !ids.senderPnJid && !ids.senderLid) {
      pushJid(lines, 'JID', ids.senderJid);
    }

    if (resolved) {
      const resolvedPn = getPhoneNumberFromJid(resolved.phoneNumber);
      const extras: string[] = [];
      if (resolvedPn && resolvedPn !== ids.senderPn) {
        extras.push(`Nomor : ${resolvedPn}`);
      }
      if (resolved.phoneNumber && resolved.phoneNumber !== ids.senderPnJid) {
        extras.push(`PN    : ${formatJid(resolved.phoneNumber)}`);
      }
      if (resolved.lid && resolved.lid !== ids.senderLid) {
        extras.push(`LID   : ${formatJid(resolved.lid)}`);
      }
      if (extras.length) {
        lines.push('', '• Lookup', ...extras);
      }
    }

    await reply(lines.join('\n'));
  },
} satisfies BotCommand;

async function findUserIds(sock: BotSocket, jid: string): Promise<UserIdLookup | null> {
  try {
    return (await sock.findUserId(jid)) as UserIdLookup;
  } catch {
    return null;
  }
}

function formatJid(jid?: string): string {
  return jid ? `${jid} [${jidType(jid)}]` : '-';
}

function pushJid(lines: string[], label: string, jid?: string): void {
  if (!jid) return;
  const pad = label.padEnd(5, ' ');
  lines.push(`${pad} : ${formatJid(jid)}`);
}
