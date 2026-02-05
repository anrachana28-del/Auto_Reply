// ======================
// Telegram Bot with Web App Menu using Webhook
// ======================

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
require('dotenv').config();

// ---------------------- CONFIG ----------------------
const TOKEN = process.env.TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;
const MENU_LINK = process.env.MENU_LINK || 'https://your-website.com/modal-page';
const PORT = process.env.PORT || 3000;

if (!TOKEN || !ADMIN_ID) {
  console.error('❌ TOKEN or ADMIN_ID missing!');
  process.exit(1);
}

// ---------------------- INIT BOT ----------------------
const bot = new TelegramBot(TOKEN);
const app = express();
app.use(express.json()); // parse JSON for webhook

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

// ---------------------- WEBHOOK ENDPOINT ----------------------
app.post(`/bot${TOKEN}`, async (req, res) => {
  bot.processUpdate(req.body); // pass Telegram update to bot
  res.sendStatus(200);
});

// ---------------------- MESSAGE HANDLER ----------------------
bot.on('message', async (msg) => {
  const userId = msg.from.id;

  // Reply only once per user
  if (repliedUsers.has(userId)) return;
  repliedUsers.add(userId);

  const username = msg.from.username ? '@' + msg.from.username : msg.from.first_name;

  try {
    // Typing action
    await bot.sendChatAction(userId, 'typing');

    // Optional delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Send Web App Menu
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
bot.on('message', async (msg) => {
  if (msg.web_app_data) {
    try {
      const data = JSON.parse(msg.web_app_data.data);
      console.log('Received data from Web App:', data);

      await bot.sendMessage(msg.from.id, `✅ Received your data: ${JSON.stringify(data)}`);
    } catch (err) {
      console.error('Error parsing Web App data:', err);
    }
  }
});

// ---------------------- START SERVER ----------------------
app.listen(PORT, async () => {
  console.log(`✅ Server running on port ${PORT}`);

  // Set Telegram webhook
  const webhookUrl = `https://your-domain.com/bot${TOKEN}`; // replace with your domain
  try {
    await bot.setWebHook(webhookUrl);
    console.log(`✅ Webhook set: ${webhookUrl}`);
  } catch (err) {
    console.error('❌ Failed to set webhook:', err);
  }
});
