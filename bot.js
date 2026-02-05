// bot.js
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// ------------------ CONFIG ------------------
const TOKEN = process.env.TOKEN;
const ADMIN_ID = process.env.ADMIN_ID; // numeric Telegram ID
const PORT = process.env.PORT || 3000;

if (!TOKEN || !ADMIN_ID) {
  console.error('❌ TOKEN or ADMIN_ID missing!');
  process.exit(1);
}

// ------------------ EXPRESS (Health Check) ------------------
const app = express();
app.get('/', (req, res) => res.send('✅ Telegram Bot is running'));
app.listen(PORT, () => console.log(`🌐 Web server running on port ${PORT}`));

// ------------------ TELEGRAM BOT ------------------
const bot = new TelegramBot(TOKEN, { polling: true });

// ------------------ 2-Button Menu (Inline Modal + Admin) ------------------
function createButtonMenu() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Menu', callback_data: 'menu_modal' },       // inline modal
          { text: 'View Admin', url: `tg://user?id=${ADMIN_ID}` } // open admin chat
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
      `សួស្តី! ${username}\nClick "Menu" below to see options inside Telegram or contact Admin.`,
      createButtonMenu()
    );

    console.log(`✅ Replied to ${username} (${userId})`);

  } catch (err) {
    console.error('❌ Error sending message:', err.message);
  }
});

// ------------------ Handle Callback Query for Menu ------------------
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;

  if (query.data === 'menu_modal') {
    // Show inline menu inside Telegram
    await bot.editMessageText(
      '📋 Menu Content:\n1. Option A\n2. Option B\n3. Option C',
      {
        chat_id: chatId,
        message_id: query.message.message_id,
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Close', callback_data: 'close_modal' }]
          ]
        }
      }
    );
  } else if (query.data === 'close_modal') {
    // Close the inline menu
    await bot.deleteMessage(chatId, query.message.message_id);
  }

  // Hide loading circle
  await bot.answerCallbackQuery(query.id);
});

// ------------------ Polling Errors ------------------
bot.on('polling_error', (err) => console.error('⚠️ Polling error:', err.code, err.message));

// ------------------ Graceful Shutdown ------------------
process.on('SIGINT', () => { bot.stopPolling(); process.exit(); });
process.on('SIGTERM', () => { bot.stopPolling(); process.exit(); });
