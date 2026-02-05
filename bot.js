const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const TOKEN = process.env.TOKEN;
const ADMIN_ID = process.env.ADMIN_ID; // for View Admin button
const MENU_LINK = process.env.MENU_LINK || 'https://your-website.com/modal-page';

if (!TOKEN || !ADMIN_ID || !MENU_LINK) {
  console.error('❌ TOKEN, ADMIN_ID, or MENU_LINK missing!');
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

// Create 2-button menu: Menu + View Admin
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

// Auto-reply with "Typing..." simulation
bot.on('message', async (msg) => {
  const userId = msg.from.id;
  const username = msg.from.username ? '@' + msg.from.username : msg.from.first_name;
  
  // Step 1: send typing action
  await bot.sendChatAction(userId, 'typing');

  // Step 2: wait 10 seconds
  await new Promise(resolve => setTimeout(resolve, 10000)); // 10000 ms = 10 seconds

  // Step 3: send auto-reply with menu
  await bot.sendMessage(
    userId,
    `សួស្តី! ${username}\nយើងខ្ញុំនឹងតបសារឆាប់ៗ។ Thank you 💙🙏`,
    createButtonMenu()
  );
});

// Polling errors
bot.on('polling_error', (err) => console.error('⚠️ Polling error:', err.code, err.message));
