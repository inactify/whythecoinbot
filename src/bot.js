require('dotenv').config();

const { Telegraf } = require('telegraf');
const cron = require('node-cron');
const http = require('http');

// ===============================
// ENVIRONMENT VARIABLES
// ===============================

const BOT_TOKEN = process.env.BOT_TOKEN;

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || '')
  .split(',')
  .map(id => id.trim())
  .filter(Boolean);

const GROUP_CHAT_ID = process.env.GROUP_CHAT_ID;

// ===============================
// BOT SETUP
// ===============================

if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN is missing.');
}

if (!GROUP_CHAT_ID) {
  throw new Error('GROUP_CHAT_ID is missing.');
}

const bot = new Telegraf(BOT_TOKEN);

// ===============================
// BOT STATE
// ===============================

let postingPaused = false;

// ===============================
// MEMBER STATISTICS
// ===============================

// These counters track events while the bot is running.
// They reset if Render restarts the bot.

let memberStats = {
  joins: 0,
  leaves: 0
};

// ===============================
// $WHY POST LIBRARY
// ===============================

// 🌅 9 AM — MORNING / BRAND POSTS

const MORNING_POSTS = [
  `WHY DID WE LAUNCH THIS COIN?

Honestly… WHY NOT? 🤷🏾‍♂️

Welcome to $WHY.

THE OFFICIAL CURRENCY OF BAD DECISIONS.`,

  `WHY?

Because “WHY NOT?” wasn't enough.

So we made a coin. 😂

$WHY`,

  `GOOD DECISIONS ARE BORING.

QUESTIONABLE DECISIONS ARE MEMORABLE.

$WHY 🤷🏾‍♂️`,

  `We don't ask:

“Is this a good idea?”

We ask:

“WHY NOT?” 🤷🏾‍♂️

$WHY`,

  `What is $WHY?

A question.

A meme.

A community.

A questionable decision.

🤷🏾‍♂️ $WHY`,

  `You don't need a reason.

You need a WHY.

🟡 $WHY`,

  `$WHY PHILOSOPHY:

Life is short.
Make memories.
Make memes.
Question your decisions.

WHY? 🤷🏾‍♂️`,

  `BAD DECISIONS.
GREAT MEMES.
BIGGER DREAMS.

THIS IS $WHY.

THE OFFICIAL CURRENCY OF BAD DECISIONS.`
];

// 😂 2 PM — FUNNY / MEME POSTS

const AFTERNOON_POSTS = [
  `You said you're not buying another meme coin.

Then you found $WHY.

We know what happened next. 😂`,

  `Some people make good decisions.

Some make great decisions.

And then there are $WHY holders. 🤷🏾‍♂️`,

  `Your portfolio:

📈 “I'm winning!”

5 minutes later:

📉 “WHY?”

Welcome home. 😂`,

  `Brain: “Think carefully.”

You: “But it's a meme.”

Brain: “WHY?”

$WHY 🤷🏾‍♂️`,

  `Imagine explaining to your future self why you bought $WHY.

Future you:

“WHY?” 😂`,

  `Friend: “Do your research.”

You: “I did.”

Friend: “What did you find?”

You:

WHY? 😂`,

  `Bought something I didn't need.

Ate something I shouldn't.

Joined another meme community.

At least I found $WHY. 😂`,

  `$WHY isn't for everyone.

It's for people who have ever said:

“This might be a bad idea…”

…and did it anyway. 😂`,

  `SCIENTIFIC STUDY:

Researchers have discovered that every bad decision eventually leads to one question:

WHY? 🤷🏾‍♂️`,

  `Relationship advice:

“Don't text them.”

You: “Okay.”

11:47 PM:

“Hey…”

WHY? 😂`,

  `Your bank account after one unnecessary purchase:

“We need to talk.”

You:

“WHY?” 😂`,

  `Business idea: Terrible.

Financial plan: Questionable.

Decision-making: Could be better.

Perfect conditions for $WHY. 🤷🏾‍♂️`,

  `If bad decisions built character…

we'd all be superheroes by now. 😂🤷🏾‍♂️

$WHY`,

  `Monday:

“I'm going to make better decisions this week.”

Tuesday:

“$WHY?” 😂`
];

// 🌙 8 PM — EVENING / COMMUNITY POSTS

const EVENING_POSTS = [
  `Important announcement:

We have absolutely no idea what we're doing.

But we're doing it together.

Welcome to $WHY. 😂`,

  `$WHY CHECK-IN:

Have you made a questionable decision today?

A) Yes
B) Absolutely
C) WHY ARE YOU ASKING? 😂`,

  `$WHY isn't for everyone.

It's for the people who understand the joke.

If that's you…

Welcome home. 🤷🏾‍♂️`,

  `DAILY REMINDER:

Nobody forced you to join $WHY.

You chose this.

WHY? 🤷🏾‍♂️😂`,

  `If you understand $WHY…

You're one of us.

If you don't…

WHY ARE YOU STILL HERE? 😂`,

  `$WHY COMMUNITY RULE #1:

Don't pretend you always make good decisions.

Rule #2:

See Rule #1. 😂`,

  `Tell us your most questionable decision.

No judgment.

This is the $WHY community. 😂👇🏾`,

  `WHO TOLD YOU TO BUY THAT?

Nobody.

That's the problem. 😂`,

  `COMMUNITY ROLL CALL:

If you're here because you saw the name $WHY…

Welcome.

If you're here because you bought it…

WHY? 😂🤷🏾‍♂️`
];

// ===============================
// ALL POSTS
// ===============================

const ALL_POSTS = [
  ...MORNING_POSTS,
  ...AFTERNOON_POSTS,
  ...EVENING_POSTS
];

// ===============================
// RANDOM POST HELPER
// ===============================

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// ===============================
// ADMIN CHECK
// ===============================

function isAdmin(ctx) {
  const userId = ctx.from?.id?.toString();

  return userId && ADMIN_USER_IDS.includes(userId);
}

// ===============================
// PUBLISH POST
// ===============================

async function publishPost(post) {
  if (postingPaused) {
    console.log('Posting is currently paused.');
    return false;
  }

  try {
    await bot.telegram.sendMessage(GROUP_CHAT_ID, post);

    console.log('✅ Post published successfully.');

    return true;
  } catch (error) {
    console.error('❌ Failed to publish post:', error.message);

    return false;
  }
}

// ===============================
// PUBLISH RANDOM POST
// ===============================

async function publishRandomPost(postList) {
  if (postingPaused) {
    console.log('⏸️ Automatic posting is paused.');
    return false;
  }

  const post = randomFrom(postList);

  return await publishPost(post);
}

// ===============================
// START COMMAND
// ===============================

bot.start(async (ctx) => {
  await ctx.reply(
    `🤷🏾‍♂️ WHY DID YOU JOIN?

Welcome to the official $WHY community!

🟡 THE OFFICIAL CURRENCY OF BAD DECISIONS.

You made the decision.
You knew it was questionable.
You did it anyway.

WHY? 😂

🔥 Memes
🔥 Chaos
🔥 Community

Let's make some bad decisions together.`
  );
});

// ===============================
// HELP COMMAND
// ===============================

bot.command('help', async (ctx) => {
  await ctx.reply(
    `🤷🏾‍♂️ $WHY COMMUNITY BOT

Available commands:

/start — Welcome message
/help — Show this help
/status — Bot status
/stats — Community statistics (Admin)
/chatid — Show group chat ID
/schedule — Show posting schedule

ADMIN COMMANDS:

/post <message> — Post a custom message
/now — Post a random $WHY message immediately
/pinwelcome — Send and pin the welcome message
/pause — Pause automatic posting
/resume — Resume automatic posting

🟡 THE OFFICIAL CURRENCY OF BAD DECISIONS.`
  );
});

// ===============================
// CHAT ID COMMAND
// ===============================

bot.command('chatid', async (ctx) => {
  await ctx.reply(
    `🆔 Chat ID:

${ctx.chat.id}`
  );
});

// ===============================
// STATUS COMMAND
// ===============================

bot.command('status', async (ctx) => {
  const status = postingPaused
    ? '⏸️ Automatic posting: PAUSED'
    : '🟢 Automatic posting: ACTIVE';

  await ctx.reply(
    `🤖 $WHY BOT STATUS

${status}

📚 Post library: ${ALL_POSTS.length} posts

🌅 Morning: ${MORNING_POSTS.length}
😂 Afternoon: ${AFTERNOON_POSTS.length}
🌙 Evening: ${EVENING_POSTS.length}

🟢 Joins recorded: ${memberStats.joins}
🔴 Leaves recorded: ${memberStats.leaves}

🟡 $WHY — The Official Currency of Bad Decisions.`
  );
});

// ===============================
// COMMUNITY STATISTICS
// ADMIN ONLY
// ===============================

bot.command('stats', async (ctx) => {
  if (!isAdmin(ctx)) {
    return ctx.reply('❌ Admin only.');
  }

  try {
    // Get the actual current Telegram group member count.
    const currentMembers =
      await bot.telegram.getChatMemberCount(GROUP_CHAT_ID);

    const netMovement =
      memberStats.joins - memberStats.leaves;

    await ctx.reply(
      `📊 $WHY COMMUNITY STATS

👥 Current members: ${currentMembers}

🟢 Joins recorded: ${memberStats.joins}
🔴 Leaves recorded: ${memberStats.leaves}

📈 Net movement since bot start: ${
        netMovement >= 0 ? '+' : ''
      }${netMovement}

🤫 Leave notifications: HIDDEN
🛡️ Statistics: ADMIN ONLY

⚠️ Join/leave counters reset if the bot restarts.`
    );
  } catch (error) {
    console.error('Stats error:', error.message);

    await ctx.reply(
      `❌ Could not retrieve the current member count.

Recorded joins: ${memberStats.joins}
Recorded leaves: ${memberStats.leaves}`
    );
  }
});

// ===============================
// SCHEDULE COMMAND
// ===============================

bot.command('schedule', async (ctx) => {
  await ctx.reply(
    `🗓️ $WHY POSTING SCHEDULE

🌅 9:00 AM
Morning / Brand
${MORNING_POSTS.length} possible posts

😂 2:00 PM
Funny / Meme
${AFTERNOON_POSTS.length} possible posts

🌙 8:00 PM
Evening / Community
${EVENING_POSTS.length} possible posts

Timezone:
🇳🇬 Africa/Lagos

Every scheduled post is randomly selected from its category.

🤷🏾‍♂️ WHY?`
  );
});

// ===============================
// ADMIN: CUSTOM POST
// ===============================

bot.command('post', async (ctx) => {
  if (!isAdmin(ctx)) {
    return ctx.reply('❌ Admin only.');
  }

  const message = ctx.message.text
    .replace('/post', '')
    .trim();

  if (!message) {
    return ctx.reply(
      `Usage:

/post Your message here`
    );
  }

  const success = await publishPost(
    `WHY Community Bot:

${message}`
  );

  if (success) {
    await ctx.reply(
      '✅ Posted to the $WHY community.'
    );
  } else {
    await ctx.reply('❌ Failed to post.');
  }
});

// ===============================
// ADMIN: POST RANDOM MESSAGE NOW
// ===============================

bot.command('now', async (ctx) => {
  if (!isAdmin(ctx)) {
    return ctx.reply('❌ Admin only.');
  }

  const success = await publishPost(
    randomFrom(ALL_POSTS)
  );

  if (success) {
    await ctx.reply(
      '✅ Random $WHY post published.'
    );
  } else {
    await ctx.reply(
      '❌ Failed to publish the post.'
    );
  }
});

// ===============================
// ADMIN: PIN WELCOME
// ===============================

bot.command('pinwelcome', async (ctx) => {
  if (!isAdmin(ctx)) {
    return ctx.reply('❌ Admin only.');
  }

  try {
    const message =
      await bot.telegram.sendMessage(
        GROUP_CHAT_ID,
        `🤷🏾‍♂️ WHY DID YOU JOIN?

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

Welcome to $WHY.`
      );

    await bot.telegram.pinChatMessage(
      GROUP_CHAT_ID,
      message.message_id,
      {
        disable_notification: false
      }
    );

    await ctx.reply(
      '📌 Welcome message posted and pinned.'
    );
  } catch (error) {
    console.error('Pin error:', error);

    await ctx.reply(
      `❌ Could not pin the welcome message.

Make sure the bot is an admin in the group and has permission to pin messages.`
    );
  }
});

// ===============================
// ADMIN: PAUSE
// ===============================

bot.command('pause', async (ctx) => {
  if (!isAdmin(ctx)) {
    return ctx.reply('❌ Admin only.');
  }

  postingPaused = true;

  await ctx.reply(
    '⏸️ Automatic $WHY posting is now PAUSED.'
  );
});

// ===============================
// ADMIN: RESUME
// ===============================

bot.command('resume', async (ctx) => {
  if (!isAdmin(ctx)) {
    return ctx.reply('❌ Admin only.');
  }

  postingPaused = false;

  await ctx.reply(
    '▶️ Automatic $WHY posting is now ACTIVE.'
  );
});

// ===============================
// NEW MEMBER WELCOME + JOIN STATS
// ===============================

bot.on('new_chat_members', async (ctx) => {
  try {
    const newMembers =
      ctx.message.new_chat_members || [];

    // Record every new member.
    memberStats.joins += newMembers.length;

    for (const member of newMembers) {
      const firstName =
        member.first_name || 'Friend';

      await ctx.reply(
        `🤷🏾‍♂️ WHY DID YOU JOIN, ${firstName.toUpperCase()}?

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

Welcome to $WHY.`
      );
    }

    console.log(
      `🟢 ${newMembers.length} new member(s) joined.`
    );
  } catch (error) {
    console.error(
      'Welcome/statistics error:',
      error.message
    );
  }
});

// ===============================
// HIDE MEMBER LEAVE MESSAGES
// ===============================

// Telegram sends a service message when someone leaves.
// Delete it immediately so the departure is not displayed publicly.

bot.on('left_chat_member', async (ctx) => {
  try {
    // Record the departure.
    memberStats.leaves += 1;

    // Delete the Telegram service message.
    await ctx.deleteMessage();

    console.log(
      '🫥 Member departure recorded and hidden.'
    );
  } catch (error) {
    console.error(
      '❌ Could not delete member leave message:',
      error.message
    );
  }
});

// ===============================
// AUTOMATIC POSTING
// ===============================

// 9:00 AM — Morning / Brand

cron.schedule(
  '0 9 * * *',
  async () => {
    console.log(
      '🌅 9 AM $WHY post running...'
    );

    await publishRandomPost(
      MORNING_POSTS
    );
  },
  {
    timezone: 'Africa/Lagos'
  }
);

// 2:00 PM — Funny / Meme

cron.schedule(
  '0 14 * * *',
  async () => {
    console.log(
      '😂 2 PM $WHY post running...'
    );

    await publishRandomPost(
      AFTERNOON_POSTS
    );
  },
  {
    timezone: 'Africa/Lagos'
  }
);

// 8:00 PM — Evening / Community

cron.schedule(
  '0 20 * * *',
  async () => {
    console.log(
      '🌙 8 PM $WHY post running...'
    );

    await publishRandomPost(
      EVENING_POSTS
    );
  },
  {
    timezone: 'Africa/Lagos'
  }
);

// ===============================
// HEALTH CHECK SERVER
// ===============================

const PORT =
  process.env.PORT || 3000;

const server = http.createServer(
  async (req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, {
        'Content-Type':
          'application/json'
      });

      res.end(
        JSON.stringify({
          status: 'ok',
          bot: 'WHYTheCoinBot',
          project: '$WHY',
          postingPaused,
          totalPosts: ALL_POSTS.length,
          joinsRecorded: memberStats.joins,
          leavesRecorded: memberStats.leaves
        })
      );

      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/plain'
    });

    res.end(
      '$WHY Bot is alive 🤷🏾‍♂️'
    );
  }
);

server.listen(
  PORT,
  '0.0.0.0',
  () => {
    console.log(
      `🌐 Health server running on port ${PORT}`
    );
  }
);

// ===============================
// LAUNCH BOT
// ===============================

bot.launch()
  .then(() => {
    console.log(
      '🤖 $WHY Community Bot is running!'
    );

    console.log(
      `📚 Total posts loaded: ${ALL_POSTS.length}`
    );

    console.log(
      '🌅 Morning posts:',
      MORNING_POSTS.length
    );

    console.log(
      '😂 Afternoon posts:',
      AFTERNOON_POSTS.length
    );

    console.log(
      '🌙 Evening posts:',
      EVENING_POSTS.length
    );

    console.log(
      '🕐 Timezone: Africa/Lagos'
    );

    console.log(
      '🤫 Silent leave tracking: ACTIVE'
    );

    console.log(
      '📊 Member statistics: ACTIVE'
    );
  })
  .catch((error) => {
    console.error(
      '❌ Bot failed to launch:',
      error
    );
  });

// ===============================
// GRACEFUL SHUTDOWN
// ===============================

process.once(
  'SIGINT',
  () => {
    console.log(
      '🛑 Stopping bot...'
    );

    bot.stop('SIGINT');
  }
);

process.once(
  'SIGTERM',
  () => {
    console.log(
      '🛑 Stopping bot...'
    );

    bot.stop('SIGTERM');
  }
);
