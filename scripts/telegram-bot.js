// scripts/telegram-bot.js
const { Telegraf } = require('telegraf');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// ✅ Initialize Firebase Admin (Modern Import Method)
try {
  const serviceAccount = require('../firebase-service-account.json');
  
  initializeApp({
    credential: cert(serviceAccount)
  });
  
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
  console.log('⚠️ Make sure firebase-service-account.json exists in the ROOT folder: E:\\Coding\\Girigo\\');
  process.exit(1);
}

const db = getFirestore();

// ✅ Your Credentials
const BOT_TOKEN = '8864876012:AAE6wwYk_Wg1GVSgX1UNcLA-7f3QZwwPs3g';
const ADMIN_CHAT_ID = '1305072195';

// Initialize Telegram Bot
const bot = new Telegraf(BOT_TOKEN);

// Security: Only allow your Chat ID to use the bot
const isAdmin = (ctx) => String(ctx.chat.id) === ADMIN_CHAT_ID;

// Start command
bot.start((ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('🚫 Access denied.');
  ctx.reply('🦊 Girigo Bot is running!\n\nCommands:\n/stats - View app statistics\n/users - Active users\n/errors - Recent errors');
});

// /stats command
bot.command('stats', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('🚫 Access denied.');
  try {
    const wishesSnapshot = await db.collection('wishes').count().get();
    const completionsSnapshot = await db.collection('completions').count().get();
    const errorsSnapshot = await db.collection('errors').count().get();

    ctx.reply(`📊 **Girigo Statistics**\n\n` +
      `📝 Total Wishes: ${wishesSnapshot.data().count}\n` +
      `✅ Completions: ${completionsSnapshot.data().count}\n` +
      `🐛 Errors: ${errorsSnapshot.data().count}`
    );
  } catch (error) {
    ctx.reply('Error fetching stats: ' + error.message);
  }
});

// /users command
bot.command('users', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('🚫 Access denied.');
  try {
    const usersSnapshot = await db.collection('users').get();
    const activeUsers = usersSnapshot.docs.filter(doc => {
      const data = doc.data();
      const lastActive = data.lastActive?.toDate();
      return lastActive && (Date.now() - lastActive.getTime()) < 7 * 24 * 60 * 60 * 1000;
    });

    ctx.reply(`👥 **Active Users (Last 7 Days)**\n\n` +
      `Total: ${activeUsers.length}\n\n` +
      `Recent:\n` +
      (activeUsers.length > 0 ? activeUsers.slice(0, 5).map(u => `- ${u.data().name || 'Anonymous'}`).join('\n') : 'No recent users')
    );
  } catch (error) {
    ctx.reply('Error fetching users: ' + error.message);
  }
});

// /errors command
bot.command('errors', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('🚫 Access denied.');
  try {
    const errorsSnapshot = await db.collection('errors')
      .orderBy('timestamp', 'desc')
      .limit(5)
      .get();

    const errors = errorsSnapshot.docs.map(doc => {
      const data = doc.data();
      return `🐛 **${data.context}**\nUser: ${data.userId}\nError: ${data.errorMessage}\nTime: ${data.timestamp?.toDate().toLocaleString()}`;
    }).join('\n\n');

    ctx.reply(`**Recent Errors**\n\n${errors || 'No errors recorded'}`);
  } catch (error) {
    ctx.reply('Error fetching errors: ' + error.message);
  }
});

console.log('🤖 Girigo Telegram Bot starting...');
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));