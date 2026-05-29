# Bot Baileys ESM TypeScript

Bot WhatsApp modular menggunakan `@itsliaaa/baileys` dan login pairing code.

## Setup

```bash
npm install
cp .env.example .env
npm run start
```

Isi `BOT_PHONE_NUMBER` di `.env` dengan format kode negara tanpa tanda `+`.

Contoh:

```env
BOT_PHONE_NUMBER=6281234567890
```

Saat pertama jalan, pairing code akan muncul di terminal. Masukkan kode itu dari WhatsApp:

`Perangkat tertaut` -> `Tautkan perangkat` -> `Tautkan dengan nomor telepon`.

## Struktur

```text
src/
  commands/      Command bot, auto-load dari folder kategori
  config/        Konfigurasi env
  events/        Event Baileys
  socket/        Pembuatan koneksi WhatsApp
  utils/         Helper kecil
```

## Command

Command otomatis dimuat dari `src/commands/<category>/*.ts`.

Contoh:

```text
src/commands/general/menu.ts
src/commands/general/ping.ts
```

Format command:

```ts
export default {
  name: 'ping',
  aliases: ['p'],
  category: 'general',
  description: 'Cek bot aktif',
  async execute({ reply }) {
    await reply('pong');
  },
};
```

Command awal:

- `.ping`
- `.menu`
