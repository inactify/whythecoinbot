require('dotenv').config();

const { Telegraf } = require('telegraf');
const cron = require('node-cron');
const http = require('http');

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || '')
  .split(',')
  .map(id => id.trim())
  .filter(Boolean);

const GROUP_CHAT_ID = process.env.GROUP_CHAT_ID;

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is missing.');
  process.exit(1);
}

if (!GROUP_CHAT_ID) {
  console.error('❌ GROUP_CHAT_ID is missing.');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

let paused = false;

// =====================================================
// $WHY CONTENT ENGINE
// =====================================================

const DAILY_POSTS = [
  `🤷🏾‍♂️ WHY DID WE LAUNCH THIS COIN?

Honestly...

WHY NOT?

🟡 THE OFFICIAL CURRENCY OF BAD DECISIONS.`,

  `🔥 $WHY PHILOSOPHY

You don't need a reason.

You just need a WHY.

😂🤷🏾‍♂️

THE OFFICIAL CURRENCY OF BAD DECISIONS.`,

  `🤦🏾‍♂️ YOU SAID YOU WERE DONE BUYING MEME COINS.

Then you saw $WHY.

Now you're here.

WHY? 😂`,

  `😂 SOME PEOPLE INVEST AFTER RESEARCH.

OTHERS SEE A MEME AND SAY:

"WHY NOT?"

Welcome to $WHY.`,

  `🤷🏾‍♂️ BAD DECISIONS.

GREAT MEMES.

BIGGER DREAMS.

This is $WHY.

THE OFFICIAL CURRENCY OF BAD DECISIONS.`
];

// =====================================================
// HELPERS
// =====================================================

function isAdmin(ctx) {
  return ADMIN_USER_IDS.includes(String(ctx.from?.id));
}

function randomPost() {
  return DAILY_POSTS[Math.floor(Math.random() * DAILY_POSTS.length)];
}

async function publishRandomPost() {
  if (paused) {
    console.log('⏸️ Automatic posting is paused.');
    return;
  }

  try {
    const post = randomPost();

    await bot.telegram.sendMessage(GROUP_CHAT_ID, post);

    console.log('🔥 Random $WHY post published.');
  } catch (error) {
    console.error('❌ Failed to publish post:', error.message);
  }
}

// =====================================================
// COMMANDS
// =====================================================

bot.start(async (ctx) => {
  await ctx.reply(
    `🤷🏾‍♂️ Welcome to $WHY.

THE OFFICIAL CURRENCY OF BAD DECISIONS.

You made the decision.
You knew it was questionable.
You did it anyway.

WHY? 😂

🔥 Memes
🔥 Chaos
🔥 Community`
  );
});

bot.help(async (ctx) => {
  await ctx.reply(
    `🤷🏾‍♂️ $WHY BOT

Available commands:

/start - Welcome message
/help - Show commands
/status - Check bot status
/chatid - Show this chat ID

Admin:
/post <message> - Publish a message
/now - Publish a random $WHY post
/pinwelcome - Publish and pin the welcome post
/pause - Pause automatic posts
/resume - Resume automatic posts
/schedule - Show posting schedule`
  );
});

bot.command('chatid', async (ctx) => {
  await ctx.reply(`Chat ID: ${ctx.chat.id}`);
});

bot.command('status', async (ctx) => {
  await ctx.reply(
    `🤷🏾‍♂️ $WHY BOT STATUS

🟢 Bot: Online
🟢 Posting: ${paused ? 'Paused' : 'Active'}
🟢 Group: Connected
🟢 Content Engine: Ready`
  );
});

bot.command('schedule', async (ctx) => {
  await ctx.reply(
    `⏰ $WHY POSTING SCHEDULE

🇳🇬 Nigeria Time (Africa/Lagos)

🕘 9:00 AM
🕑 2:00 PM
🕗 8:00 PM

Random $WHY content is automatically posted at these times.

Use /now for an immediate post.`
  );
});

// =====================================================
// ADMIN: POST CUSTOM MESSAGE
// =====================================================

bot.command('post', async (ctx) => {
  if (!isAdmin(ctx)) {
    return ctx.reply('🚫 Admin only.');
  }

  const message = ctx.message.text.replace(/^\/post\s*/i, '').trim();

  if (!message) {
    return ctx.reply('Usage:\n/post Your message here');
  }

  try {
    await bot.telegram.sendMessage(GROUP_CHAT_ID, message);

    await ctx.reply('✅ Posted to the $WHY community.');
  } catch (error) {
    console.error('❌ /post error:', error.message);
    await ctx.reply('❌ Failed to publish the message.');
  }
});

// =====================================================
// ADMIN: RANDOM POST NOW
// =====================================================

bot.command('now', async (ctx) => {
  if (!isAdmin(ctx)) {
    return ctx.reply('🚫 Admin only.');
  }

  try {
    await publishRandomPost();

    await ctx.reply('🔥 Random $WHY post published.');
  } catch (error) {
    console.error('❌ /now error:', error.message);
    await ctx.reply('❌ Failed to publish random post.');
  }
});

// =====================================================
// ADMIN: PIN WELCOME
// =====================================================

bot.command('pinwelcome', async (ctx) => {
  if (!isAdmin(ctx)) {
    return ctx.reply('🚫 Admin only.');
  }

  const welcome = `🤷🏾‍♂️ WHY DID YOU JOIN?

Welcome to the official $WHY community!

🟡 THE OFFICIAL CURRENCY OF BAD DECISIONS.

You made the decision.
You knew it was questionable.
You did it anyway.

WHY? 😂

🔥 Memes
🔥 Chaos
🔥 Community

🚫 No scams
🚫 No fake contract addresses
🚫 No fake profit promises

Welcome to $WHY.`;

  try {
    const message = await bot.telegram.sendMessage(
      GROUP_CHAT_ID,
      welcome
    );

    await bot.telegram.pinChatMessage(
      GROUP_CHAT_ID,
      message.message_id,
      {
        disable_notification: true
      }
    );

    await ctx.reply('📌 Welcome message posted and pinned.');
  } catch (error) {
    console.error('❌ /pinwelcome error:', error.message);
    await ctx.reply(
      '❌ Could not pin the message. Make sure the bot is an admin with permission to pin messages.'
    );
  }
});

// =====================================================
// ADMIN: PAUSE
// =====================================================

bot.command('pause', async (ctx) => {
  if (!isAdmin(ctx)) {
    return ctx.reply('🚫 Admin only.');
  }

  paused = true;

  await ctx.reply(
    '⏸️ Automatic $WHY posting is now PAUSED.'
  );
});

// =====================================================
// ADMIN: RESUME
// =====================================================

bot.command('resume', async (ctx) => {
  if (!isAdmin(ctx)) {
    return ctx.reply('🚫 Admin only.');
  }

  paused = false;

  await ctx.reply(
    '▶️ Automatic $WHY posting is now ACTIVE.'
  );
});

// =====================================================
// NEW MEMBER WELCOME
// =====================================================

bot.on('new_chat_members', async (ctx) => {
  try {
    for (const member of ctx.message.new_chat_members) {
      if (member.is_bot) continue;

      await ctx.reply(
        `🤷🏾‍♂️ Welcome, ${member.first_name}!

You made the decision.
You knew it was questionable.
You joined anyway.

WHY? 😂

🟡 THE OFFICIAL CURRENCY OF BAD DECISIONS.

🔥 Memes
🔥 Chaos
🔥 Community`
      );
    }
  } catch (error) {
    console.error('❌ Welcome error:', error.message);
  }
});

// =====================================================
// AUTOMATIC POSTING
// AFRICA/LAGOS = NIGERIA TIME
// =====================================================

cron.schedule(
  '0 9 * * *',
  publishRandomPost,
  {
    timezone: 'Africa/Lagos'
  }
);

cron.schedule(
  '0 14 * * *',
  publishRandomPost,
  {
    timezone: 'Africa/Lagos'
  }
);

cron.schedule(
  '0 20 * * *',
  publishRandomPost,
  {
    timezone: 'Africa/Lagos'
  }
);

console.log('⏰ Automatic posting schedule loaded:');
console.log('🇳🇬 09:00 Africa/Lagos');
console.log('🇳🇬 14:00 Africa/Lagos');
console.log('🇳🇬 20:00 Africa/Lagos');

// =====================================================
// RENDER HEALTH SERVER
// =====================================================

const PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, {
      'Content-Type': 'application/json'
    });

    res.end(
      JSON.stringify({
        status: 'ok',
        bot: 'WHYTheCoinBot',
        paused
      })
    );

    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/plain'
  });

  res.end('$WHY Bot is alive 🤷🏾‍♂️');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 HTTP server listening on 0.0.0.0:${PORT}`);
});

// =====================================================
// START TELEGRAM BOT
// =====================================================

bot.launch()
  .then(() => {
    console.log('🤷🏾‍♂️ $WHY BOT IS RUNNING...');
  })
  .catch((error) => {
    console.error('❌ Telegram bot failed to start:', error);
    process.exit(1);
  });

// =====================================================
// SHUTDOWN
// =====================================================

process.once('SIGINT', () => {
  bot.stop('SIGINT');
  server.close();
});

process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
  server.close();
});
