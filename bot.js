require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

// ================== CONFIG ==================
const TOKEN       = process.env.TOKEN;
const PORT        = process.env.PORT || 3000;
const FB_PAGE     = process.env.FB_PAGE;
const ADMIN_LINK  = process.env.ADMIN_LINK;

if (!TOKEN) {
  console.error('❌ TOKEN is missing');
  process.exit(1);
}

// ================== EXPRESS ==================
const app = express();
app.get('/', (req, res) => res.send('✅ Telegram Bot is running'));
app.listen(PORT, () =>
  console.log(`🌐 Web server running on port ${PORT}`)
);

// ================== TELEGRAM BOT ==================
const bot = new TelegramBot(TOKEN, { polling: true });

// ================== HELPERS ==================
const delay = (ms) => new Promise(r => setTimeout(r, ms));

// ================== 24H CONTROL ==================
const repliedUsers = new Map(); // key => lastReplyTime
const REPLY_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours

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

// ================== MESSAGE HANDLER ==================
bot.on('message', async (msg) => {
  if (!msg.text) return;
  if (msg.from.is_bot) return;

  const chatId   = msg.chat.id;
  const chatType = msg.chat.type; // private | group | supergroup
  const userId   = msg.from.id;

  // 🔐 GROUP CHECKS
  if (chatType === 'group' || chatType === 'supergroup') {
    try {
      // 1️⃣ Check bot is admin
      const botMe = await bot.getMe();
      const botMember = await bot.getChatMember(chatId, botMe.id);
      if (
        botMember.status !== 'administrator' &&
        botMember.status !== 'creator'
      ) {
        return; // ❌ bot not admin
      }

      // 2️⃣ Ignore owner/admin user
      const userMember = await bot.getChatMember(chatId, userId);
      if (
        userMember.status === 'administrator' ||
        userMember.status === 'creator'
      ) {
        return; // ❌ ignore owner/admin
      }

    } catch (e) {
      console.error('❌ Group check error:', e.message);
      return;
    }
  }

  // 🕒 24h per-user check
  const key = `${chatId}:${userId}`;
  const now = Date.now();
  const lastReply = repliedUsers.get(key);

  if (lastReply && now - lastReply < REPLY_COOLDOWN) {
    return; // ❌ within 24h
  }

  const username = msg.from.username
    ? '@' + msg.from.username
    : msg.from.first_name;

  try {
    // ⌨️ Typing immediately
    await bot.sendChatAction(chatId, 'typing');

    // ⏳ Wait 4 seconds
    await delay(4000);

    // 📩 Send reply with buttons
    await bot.sendMessage(
      chatId,
`សួស្តី! ${username} 👋
យើងខ្ញុំនឹងតបសារឆាប់ៗនេះ សូមអធ្យាស្រ័យចំពោះការឆ្លើយយឺត។ I will reply shortly. Thank you 💙🙏`,
      BUTTONS
    );

    // ✅ Save reply time
    repliedUsers.set(key, now);

    console.log(`✅ Replied to ${username} in ${chatType}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
});
