import type { BotCommand, CommandContext } from '../../types/command.js';

export default {
  name: 'ping',
  aliases: ['p'],
  category: 'general',
  description: 'Cek bot aktif',
  async execute({ reply }: CommandContext) {
    await reply('pong');
  },
} satisfies BotCommand;
