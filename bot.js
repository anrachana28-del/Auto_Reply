// ================== IMPORTS ==================
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

// ================== CONFIG ==================
const TOKEN       = process.env.TOKEN;
const PORT        = process.env.PORT || 3000;
const FB_PAGE     = process.env.FB_PAGE;
const ADMIN_LINK  = process.env.ADMIN_LINK;
const REPLY_DELAY = Number(process.env.REPLY_DELAY) || 5000; // default 5s

if (!TOKEN) {
  console.error('❌ TOKEN is missing');
  process.exit(1);
}

// ================== EXPRESS (Health Check) ==================
const app = express();
app.get('/', (req, res) => res.send('✅ Telegram Bot is running'));
app.listen(PORT, () => console.log(`🌐 Web server running on port ${PORT}`));

// ================== TELEGRAM BOT ==================
const bot = new TelegramBot(TOKEN, { polling: true });

// Delay helper
const delay = (ms) => new Promise(r => setTimeout(r, ms));

// ================== BUTTONS ==================
const BUTTONS = {
  reply_markup: {
    inline_keyboard: [
      [
        ...(FB_PAGE ? [{ text: '📘 Facebook Page', url: FB_PAGE }] : []),
        ...(ADMIN_LINK ? [{ text: '👤 Admin', url: ADMIN_LINK }] : [])
      ]
    ]
  }
};

// ================== ACTIVE CHAT TRACKER ==================
const activeChats = new Set();

// ================== MESSAGE HANDLER ==================
bot.on('message', async (msg) => {
  // Only respond to text messages
  if (!msg.text) return;

  const chatId = msg.chat.id;

  // Prevent spamming if user sends multiple messages fast
  if (activeChats.has(chatId)) return;
  activeChats.add(chatId);

  const username = msg.from.username ? '@' + msg.from.username : msg.from.first_name;

  try {
    // 1️⃣ Show typing
    await bot.sendChatAction(chatId, 'typing');

    // 2️⃣ Wait delay
    await delay(REPLY_DELAY);

    // 3️⃣ Send reply
    await bot.sendMessage(
      chatId,
      `សួស្តី! ${username} 👋
យើងខ្ញុំនឹងតបសារឆាប់ៗនេះ សូមអធ្យាស្រ័យចំពោះការឆ្លើយយឺត។
I will reply shortly. Thank you 💙🙏`,
      BUTTONS
    );

    console.log(`✅ Replied to ${username}`);

  } catch (err) {
    console.error('❌ Error sending message:', err);
  } finally {
    // Allow next message from user to trigger reply
    activeChats.delete(chatId);
  }
});
