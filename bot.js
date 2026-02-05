const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// ---------------- CONFIG ----------------
const TOKEN = process.env.TOKEN;
const MENU_LINK = process.env.MENU_LINK;           // Web App for Menu
const ADMIN_MENU_LINK = process.env.ADMIN_MENU_LINK; // Web App for Admin info
const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL;      // https://yourdomain.com/bot${TOKEN}

if (!TOKEN || !MENU_LINK || !ADMIN_MENU_LINK || !WEBHOOK_URL) {
  console.error('❌ Missing environment variables! TOKEN, MENU_LINK, ADMIN_MENU_LINK, WEBHOOK_URL required.');
  process.exit(1);
}

// ---------------- EXPRESS ----------------
const app = express();
app.use(express.json());

app.get('/', (req, res) => res.send('✅ Telegram Bot is running'));
app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));

// ---------------- TELEGRAM BOT ----------------
const bot = new TelegramBot(TOKEN);
bot.setWebHook(`${WEBHOOK_URL}`);

app.post(`/bot${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// ---------------- INLINE BUTTON MENU ----------------
const createButtonMenu = () => ({
  reply_markup: {
    inline_keyboard: [
      [
        { text: 'Menu', web_app: { url: MENU_LINK } },           // Web App modal
        { text: 'View Admin', web_app: { url: ADMIN_MENU_LINK } } // Web App modal
      ]
    ]
  }
});

// ---------------- USER COOLDOWN ----------------
const recentUsers = new Set();
const REPLY_COOLDOWN = 30 * 1000; // 30s per user

// ---------------- MESSAGE HANDLER ----------------
bot.on('message', async (msg) => {
  const userId = msg.from.id;
  const username = msg.from.username ? '@' + msg.from.username : msg.from.first_name;

  if (recentUsers.has(userId)) return;
  recentUsers.add(userId);

  try {
    // Typing simulation
    await bot.sendChatAction(userId, 'typing');
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds typing

    // Send menu with both Web App buttons
    await bot.sendMessage(
      userId,
      `សួស្តី! ${username}\nចុច "Menu" ដើម្បីបើក modal របស់ Web App Menu ឬ "View Admin" ដើម្បីបើក modal Admin info.`,
      createButtonMenu()
    );
  } catch (err) {
    console.error('❌ Error sending message:', err.message);
  } finally {
    // remove cooldown after 30s
    setTimeout(() => recentUsers.delete(userId), REPLY_COOLDOWN);
  }
});

// ---------------- CALLBACK HANDLER ----------------
// No need to handle callback_query for Web App buttons
// Web App button automatically opens modal

// ---------------- POLLING ERROR HANDLER ----------------
bot.on('polling_error', (err) => console.error('⚠️ Polling error:', err.code, err.message));

// ---------------- PROCESS EXIT HANDLER ----------------
const shutdown = () => {
  console.log('🛑 Shutting down...');
  bot.deleteWebHook()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
