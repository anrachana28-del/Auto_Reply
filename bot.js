// ======================
// Telegram Bot with Web App Menu
// ======================

const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// ---------------------- CONFIG ----------------------
const TOKEN = process.env.TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;
const MENU_LINK = process.env.MENU_LINK || 'https://your-website.com/modal-page';
const REPLY_DELAY = parseInt(process.env.REPLY_DELAY) || 3000; // delay in ms

if (!TOKEN || !ADMIN_ID) {
  console.error('❌ TOKEN or ADMIN_ID missing!');
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
// Avoid spamming users
const repliedUsers = new Set();

// ---------------------- MESSAGE HANDLER ----------------------
bot.on('message', async (msg) => {
  const userId = msg.from.id;

  // Reply only once per user
  if (repliedUsers.has(userId)) return;
  repliedUsers.add(userId);

  const username = msg.from.username ? '@' + msg.from.username : msg.from.first_name;

  try {
    // Show typing action
    await bot.sendChatAction(userId, 'typing');

    // Optional delay
    await new Promise(resolve => setTimeout(resolve, REPLY_DELAY));

    // Send message with Web App Menu
    await bot.sendMessage(
      userId,
      `សួស្តី! ${username}\nClick the button below to open the Menu or contact Admin:`,
      createButtonMenu()
    );
  } catch (err) {
    console.error('Error sending message:', err);
  }
});

// ---------------------- WEB APP DATA HANDLER ----------------------
// If your Web App sends data back to bot
bot.on('message', (msg) => {
  if (msg.web_app_data) {
    try {
      const data = JSON.parse(msg.web_app_data.data);
      console.log('Received data from Web App:', data);
      
      // Reply to user if needed
      bot.sendMessage(msg.from.id, `✅ Received your data: ${JSON.stringify(data)}`);
    } catch (err) {
      console.error('Error parsing Web App data:', err);
    }
  }
});

console.log('✅ Bot is running...');
