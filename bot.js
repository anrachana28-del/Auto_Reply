// ======================
// Telegram Bot (Render Background Worker Ready + 5s Typing + Unlimited Replies)
// ======================

const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// ---------------------- CONFIG ----------------------
const TOKEN = process.env.TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;
const MENU_LINK = process.env.MENU_LINK || 'https://your-website.com/modal-page';

if (!TOKEN || !ADMIN_ID) {
  console.error('❌ TOKEN or ADMIN_ID missing in .env!');
  process.exit(1);
}

// ---------------------- INIT BOT ----------------------
// Create bot in non-polling mode first to delete webhook
const bot = new TelegramBot(TOKEN, { polling: false });

// ---------------------- DELETE ANY EXISTING WEBHOOK ----------------------
bot.deleteWebHook().then(() => {
  console.log('✅ Webhook deleted (if existed). Starting polling...');
  bot.startPolling();
}).catch(err => {
  console.error('❌ Error deleting webhook:', err);
  process.exit(1);
});

// ---------------------- BUTTON MENU ----------------------
function createButtonMenu() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Menu', web_app: { url: MENU_LINK } },
          { text: 'View Admin', url: `tg://user?id=${ADMIN_ID}` }
        ]
      ]
    }
  };
}

// ---------------------- TYPING ANIMATION ----------------------
async function showTyping(chatId) {
  const typingDuration = 5000; // 5 seconds
  const interval = setInterval(() => {
    bot.sendChatAction(chatId, 'typing').catch(console.error);
  }, 3000); // repeat every 3s

  await new Promise(resolve => setTimeout(resolve, typingDuration));
  clearInterval(interval);
}

// ---------------------- MESSAGE HANDLER ----------------------
bot.on('message', async (msg) => {
  const userId = msg.from.id;

  // Handle Web App data first
  if (msg.web_app_data) {
    try {
      const data = JSON.parse(msg.web_app_data.data);
      console.log('📩 Received data from Web App:', data);
      await bot.sendMessage(userId, `✅ Received your data: ${JSON.stringify(data)}`);
    } catch (err) {
      console.error('❌ Error parsing Web App data:', err);
      await bot.sendMessage(userId, '⚠️ Error processing your data.');
    }
    return;
  }

  const username = msg.from.username ? '@' + msg.from.username : msg.from.first_name;

  try {
    // Show typing animation for 5 seconds
    await showTyping(userId);

    // Always reply (unlimited)
    await bot.sendMessage(
      userId,
      `សួស្តី! ${username}\nClick the button below to open the Menu or contact Admin:`,
      createButtonMenu()
    );

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

console.log('✅ Telegram Bot is initializing (typing 5s, unlimited replies)...');
