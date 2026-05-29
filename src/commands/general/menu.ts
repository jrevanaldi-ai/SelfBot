import { config } from '../../config/env.js';
import type { BotCommand, CommandContext } from '../../types/command.js';

export default {
  name: 'menu',
  aliases: ['help'],
  category: 'general',
  description: 'Lihat daftar command',
  async execute({ reply, commands }: CommandContext) {
    const grouped = groupCommandsByCategory(commands.filter((command) => !command.hidden));
    const rows = [config.botName, ''];

    for (const [category, categoryCommands] of grouped) {
      rows.push(`[${formatCategory(category)}]`);

      for (const command of categoryCommands) {
        const shown = command.aliases?.slice(0, 2) || [];
        const aliases = shown.length ? ` (${shown.join(', ')})` : '';
        rows.push(`${command.name}${aliases}`);
      }

      rows.push('');
    }

    await reply(rows.join('\n').trim());
  },
} satisfies BotCommand;

function groupCommandsByCategory(commands: BotCommand[]): Map<string, BotCommand[]> {
  const grouped = new Map<string, BotCommand[]>();

  for (const command of commands) {
    const category = command.category || 'uncategorized';
    const list = grouped.get(category) || [];
    list.push(command);
    grouped.set(category, list);
  }

  return grouped;
}

function formatCategory(category: string): string {
  return category
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
