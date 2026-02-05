// bot.js
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// ------------------ CONFIG ------------------
const TOKEN = process.env.TOKEN;
const ADMIN_ID = process.env.ADMIN_ID; // numeric Telegram ID
const MENU_LINK = process.env.MENU_LINK || 'https://your-website.com/modal-page';
const PORT = process.env.PORT || 3000;

if (!TOKEN || !ADMIN_ID || !MENU_LINK) {
  console.error('❌ TOKEN, ADMIN_ID, or MENU_LINK missing!');
  process.exit(1);
}

// ------------------ EXPRESS (Health Check) ------------------
const app = express();
app.get('/', (req, res) => res.send('✅ Telegram Bot is running'));
app.listen(PORT, () => console.log(`🌐 Web server running on port ${PORT}`));

// ------------------ TELEGRAM BOT ------------------
const bot = new TelegramBot(TOKEN, { polling: true });

// ------------------ 2-Button Menu ------------------
function createButtonMenu() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Menu', url: MENU_LINK },
          { text: 'View Admin', url: `tg://user?id=${ADMIN_ID}` }
        ]
      ]
    }
  };
}

// ------------------ Auto-reply with Typing Simulation ------------------
bot.on('message', async (msg) => {
  const userId = msg.from.id;
  const username = msg.from.username ? '@' + msg.from.username : msg.from.first_name;

  try {
    // Step 1: show typing action
    await bot.sendChatAction(userId, 'typing');

    // Step 2: wait 10 seconds
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Step 3: send auto-reply with 2-button menu
    await bot.sendMessage(
      userId,
      `សួស្តី! ${username}\nយើងខ្ញុំនឹងតបសារឆាប់ៗ។ Thank you 💙🙏`,
      createButtonMenu()
    );

    console.log(`✅ Replied to ${username} (${userId})`);

  } catch (err) {
    console.error('❌ Error sending message:', err.message);
  }
});

// ------------------ Polling Errors ------------------
bot.on('polling_error', (err) => console.error('⚠️ Polling error:', err.code, err.message));

// ------------------ Graceful Shutdown ------------------
process.on('SIGINT', () => { bot.stopPolling(); process.exit(); });
process.on('SIGTERM', () => { bot.stopPolling(); process.exit(); });
