// ================== Imports ==================
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// ================== CONFIG ==================
const TOKEN      = process.env.TOKEN;
const PORT       = process.env.PORT || 3000;
const FB_PAGE    = process.env.FB_PAGE || 'https://www.facebook.com/YourPage';
const GROUP_ID   = process.env.GROUP_ID;        // numeric chat ID of your Telegram group
const ADMIN_LINK = process.env.ADMIN_LINK || 'https://t.me/YourAdminUsername'; // button only

if (!TOKEN || !GROUP_ID) {
  console.error('❌ TOKEN or GROUP_ID missing in environment variables');
  process.exit(1);
}

// ================== EXPRESS (Health Check) ==================
const app = express();
app.get('/', (req, res) => res.send('✅ Telegram Bot is running'));
app.listen(PORT, '0.0.0.0', () => console.log(`🌐 Web server running on port ${PORT}`));

// ================== TELEGRAM BOT ==================
const bot = new TelegramBot(TOKEN, { polling: true });

// ================== BUTTONS ==================
const USER_BUTTONS = (userId) => ({
  reply_markup: {
    inline_keyboard: [
      [
        { text: 'View User', url: `tg://user?id=${userId}` },
        { text: 'Admin', url: ADMIN_LINK }
      ]
    ]
  }
});

// ================== MEMORY CONTROL ==================
const MAX_USERS = 5000;
const repliedUsers = new Map(); // userId -> timestamp

// Cleanup every 1 hour
setInterval(() => {
  const now = Date.now();
  for (const [userId, timestamp] of repliedUsers) {
    if (now - timestamp > 12 * 60 * 60 * 1000) { // older than 12h
      repliedUsers.delete(userId);
    }
  }
  console.log('🗑 Memory cleanup done. Users tracked:', repliedUsers.size);
}, 60 * 60 * 1000);

// ================== MESSAGE HANDLER ==================
bot.on('message', async (msg) => {
  const userId = msg.from.id;
  const username = msg.from.username ? '@' + msg.from.username : msg.from.first_name;
  const text = msg.text;

  if (!text) return;
  if (repliedUsers.has(userId)) return;

  // Memory control
  if (repliedUsers.size >= MAX_USERS) {
    const oldestKey = repliedUsers.keys().next().value;
    repliedUsers.delete(oldestKey);
  }
  repliedUsers.set(userId, Date.now());

  try {
    // 1️⃣ Reply user
    await bot.sendMessage(
      userId,
      `សួស្តី! ${username}\nយើងខ្ញុំនឹងតបសារឆាប់ៗនេះ សូមអធ្យាស្រ័យចំពោះការឆ្លើយយឺត។\nI will reply shortly. Thank you 💙🙏`,
      USER_BUTTONS(userId)
    );
    console.log(`✅ Replied to ${username} (${userId})`);

    // 2️⃣ Forward message to group
    await bot.forwardMessage(GROUP_ID, userId, msg.message_id);

    // 3️⃣ Send clickable box with user info
    const boxText = `📨 New message from ${username}`;
    await bot.sendMessage(GROUP_ID, boxText, USER_BUTTONS(userId));

    console.log(`➡ Forwarded message + clickable box to group (${GROUP_ID})`);

  } catch (err) {
    console.error('❌ Error handling message:', err.message);
  }
});

// ================== ERROR HANDLING ==================
bot.on('polling_error', (err) => {
  console.error('⚠️ Polling error:', err.code, err.message);
});

// ================== GRACEFUL SHUTDOWN ==================
process.on('SIGINT', () => {
  console.log('🛑 Bot stopping...');
  bot.stopPolling();
  process.exit();
});
process.on('SIGTERM', () => {
  console.log('🛑 Bot stopping (SIGTERM)...');
  bot.stopPolling();
  process.exit();
});
