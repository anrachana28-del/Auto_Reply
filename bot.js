// ======================
// Telegram Bot with Web App Menu + Typing Animation
// ======================

const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// ---------------------- CONFIG ----------------------
const TOKEN = process.env.TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;
const MENU_LINK = process.env.MENU_LINK || 'https://your-website.com/modal-page';
const REPLY_DELAY = parseInt(process.env.REPLY_DELAY) || 3000; // ms

if (!TOKEN || !ADMIN_ID) {
  console.error('❌ TOKEN or ADMIN_ID missing in .env!');
  process.exit(1);
}

// ---------------------- INIT BOT ----------------------
const bot = new TelegramBot(TOKEN, { polling: true });

// ---------------------- BUTTON MENU ----------------------
function createButtonMenu() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Menu',
            web_app: { url: MENU_LINK } // opens inside Telegram as modal Web App
          },
          {
            text: 'View Admin',
            url: `tg://user?id=${ADMIN_ID}` // opens chat with Admin
          }
        ]
      ]
    }
  };
}

// ---------------------- REPLIED USERS ----------------------
const repliedUsers = new Set();

// ---------------------- TYPING ANIMATION ----------------------
async function showTyping(chatId, delay) {
  const interval = setInterval(() => {
    bot.sendChatAction(chatId, 'typing').catch(console.error);
  }, 3000); // repeat typing every 3 seconds

  await new Promise(resolve => setTimeout(resolve, delay));
  clearInterval(interval);
}

// ---------------------- MESSAGE HANDLER ----------------------
bot.on('message', async (msg) => {
  const userId = msg.from.id;

  // ---------------------- HANDLE WEB APP DATA ----------------------
  if (msg.web_app_data) {
    try {
      const data = JSON.parse(msg.web_app_data.data);
      console.log('📩 Received data from Web App:', data);

      await bot.sendMessage(
        userId,
        `✅ Received your data: ${JSON.stringify(data)}`
      );
    } catch (err) {
      console.error('❌ Error parsing Web App data:', err);
      await bot.sendMessage(userId, '⚠️ Error processing your data.');
    }
    return; // stop further processing
  }

  // ---------------------- NORMAL MESSAGE ----------------------
  if (repliedUsers.has(userId)) return;
  repliedUsers.add(userId);

  const username = msg.from.username ? '@' + msg.from.username : msg.from.first_name;

  try {
    // Show typing animation for the entire delay
    await showTyping(userId, REPLY_DELAY);

    await bot.sendMessage(
      userId,
      `សួស្តី! ${username}\nClick the button below to open the Menu or contact Admin:`,
      createButtonMenu()
    );

    // Optional: auto-reset so user can reopen menu later
    setTimeout(() => repliedUsers.delete(userId), 60 * 60 * 1000); // 1 hour

  } catch (err) {
    console.error('❌ Error sending message:', err);
  }
});

// ---------------------- GRACEFUL SHUTDOWN ----------------------
process.once('SIGINT', () => {
  console.log('🛑 SIGINT received, stopping bot...');
  bot.stopPolling();
  process.exit(0);
});

process.once('SIGTERM', () => {
  console.log('🛑 SIGTERM received, stopping bot...');
  bot.stopPolling();
  process.exit(0);
});

console.log('✅ Telegram Bot is running (polling mode with typing animation)...');
