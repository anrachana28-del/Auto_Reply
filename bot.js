const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// ---------------- CONFIG ----------------
const TOKEN = process.env.TOKEN;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || '@YourAdminUsername';
const MENU_LINK = process.env.MENU_LINK;  // web modal link from .env
const PORT = process.env.PORT || 3000;

if (!TOKEN || !ADMIN_USERNAME || !MENU_LINK) {
  console.error('❌ Missing TOKEN, ADMIN_USERNAME, or MENU_LINK');
  process.exit(1);
}

// ---------------- EXPRESS HEALTH CHECK ----------------
const app = express();
app.get('/', (req, res) => res.send('✅ Telegram Bot is running'));
app.listen(PORT, () => console.log(`🌐 Web server running on port ${PORT}`));

// ---------------- TELEGRAM BOT ----------------
const bot = new TelegramBot(TOKEN, { polling: true });

// ---------------- Inline Menu Buttons ----------------
function createButtonMenu() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Menu', url: MENU_LINK },        // open Web modal / browser
          { text: 'View Admin', callback_data: 'view_admin' }  // inline Telegram reply
        ]
      ]
    }
  };
}

// ---------------- Auto-reply with Typing Simulation ----------------
bot.on('message', async (msg) => {
  const userId = msg.from.id;
  const username = msg.from.username ? '@' + msg.from.username : msg.from.first_name;

  try {
    // Step 1: show typing
    await bot.sendChatAction(userId, 'typing');

    // Step 2: wait 10 seconds
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Step 3: send message with menu buttons
    await bot.sendMessage(
      userId,
      `សួស្តី! ${username}\nClick "Menu" to open the web modal or "View Admin" for admin info.`,
      createButtonMenu()
    );
  } catch (err) {
    console.error('❌ Error sending message:', err.message);
  }
});

// ---------------- Handle Callback Queries ----------------
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;

  if (query.data === 'view_admin') {
    // Inline reply with Admin username
    await bot.sendMessage(chatId, `សូមទាក់ទង Admin: ${ADMIN_USERNAME}`);
  }

  await bot.answerCallbackQuery(query.id); // hide loading circle
});

// ---------------- Polling Errors ----------------
bot.on('polling_error', (err) => console.error('⚠️ Polling error:', err.code, err.message));

// ---------------- Graceful Shutdown ----------------
process.on('SIGINT', () => { bot.stopPolling(); process.exit(); });
process.on('SIGTERM', () => { bot.stopPolling(); process.exit(); });
