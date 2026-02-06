const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

// ================== CONFIG ==================
const TOKEN       = process.env.TOKEN;
const PORT        = process.env.PORT || 3000;
const FB_PAGE     = process.env.FB_PAGE;
const ADMIN_LINK  = process.env.ADMIN_LINK;
const WEB_APP_URL = process.env.WEB_APP_URL; // ⭐ Telegram Web App URL

if (!TOKEN) {
  console.error('❌ TOKEN is missing');
  process.exit(1);
}

// ================== EXPRESS ==================
const app = express();

app.get('/', (req, res) => {
  res.send('✅ Telegram Bot is running');
});

app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

// ================== TELEGRAM BOT ==================
const bot = new TelegramBot(TOKEN, { polling: true });

// Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ================== BUTTONS ==================
const BUTTONS = {
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: '🌐 Open App',
          web_app: { url: WEB_APP_URL } // ✅ MODAL WEB APP
        }
      ],
      [
        { text: '📘 Facebook Page', url: FB_PAGE },
        { text: '👤 Admin', url: ADMIN_LINK }
      ]
    ]
  }
};

// ================== MESSAGE HANDLER ==================
bot.on('message', async (msg) => {
  if (!msg.text) return;

  const chatId = msg.chat.id;
  const username = msg.from.username
    ? '@' + msg.from.username
    : msg.from.first_name;

  try {
    // 1️⃣ Typing...
    await bot.sendChatAction(chatId, 'typing');

    // 2️⃣ Wait 5s
    await delay(5000);

    // 3️⃣ Reply
    await bot.sendMessage(
      chatId,
      `សួស្តី! ${username} 👋
សូមចុច Open App ដើម្បីបើក App ក្នុង Telegram 📱
Thank you 💙🙏`,
      BUTTONS
    );

    console.log(`✅ Replied to ${username}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
});
