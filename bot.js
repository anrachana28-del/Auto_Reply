const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const TOKEN = process.env.TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;
const MENU_LINK = process.env.MENU_LINK || 'https://your-website.com/modal-page';

if (!TOKEN || !ADMIN_ID) {
  console.error('❌ TOKEN or ADMIN_ID missing!');
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

// Button menu: Menu link + View Admin
function createButtonMenu() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Menu', url: MENU_LINK },      // click → open external page once
          { text: 'View Admin', url: `tg://user?id=${ADMIN_ID}` }
        ]
      ]
    }
  };
}

bot.on('message', async (msg) => {
  const userId = msg.from.id;
  const username = msg.from.username ? '@'+msg.from.username : msg.from.first_name;

  // Show typing action
  await bot.sendChatAction(userId, 'typing');

  // Wait 10 seconds
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Send reply + menu
  await bot.sendMessage(
    userId,
    `សួស្តី! ${username}\nClick the button below to open the Menu or contact Admin:`,
    createButtonMenu()
  );
});
