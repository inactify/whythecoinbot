require("dotenv").config();

const { Telegraf } = require("telegraf");
const cron = require("node-cron");

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

const GROUP_CHAT_ID = process.env.GROUP_CHAT_ID;

if (!BOT_TOKEN) {
  console.error("BOT_TOKEN is missing.");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

function isAdmin(ctx) {
  return ADMIN_USER_IDS.includes(String(ctx.from?.id));
}

function adminOnly(handler) {
  return async (ctx) => {
    if (!isAdmin(ctx)) {
      return ctx.reply("⛔ This command is for $WHY admins only.");
    }

    try {
      await handler(ctx);
    } catch (error) {
      console.error(error);
      await ctx.reply("❌ Something went wrong. Check the bot logs.");
    }
  };
}

// START
bot.start(async (ctx) => {
  await ctx.reply(
    "🤷🏾‍♂️ WHY?\n\n" +
    "Welcome to the official $WHY bot.\n\n" +
    "THE OFFICIAL CURRENCY OF BAD DECISIONS.\n\n" +
    "Memes • Chaos • Community"
  );
});

// HELP
bot.help(async (ctx) => {
  await ctx.reply(
    "🤖 $WHY BOT\n\n" +
    "/start — Start the bot\n" +
    "/status — Bot status\n\n" +
    "ADMIN COMMANDS\n" +
    "/post <message> — Post to the community\n" +
    "/pinwelcome — Post and pin the welcome message\n" +
    "/pause — Pause scheduled posting\n" +
    "/resume — Resume scheduled posting"
  );
});

// STATUS
bot.command(
  "status",
  adminOnly(async (ctx) => {
    await ctx.reply(
      "🟢 $WHY BOT IS ONLINE\n\n" +
      "Welcome system: ACTIVE\n" +
      "Admin controls: ACTIVE\n" +
      "Scheduled posting: READY"
    );
  })
);

// POST
bot.command(
  "post",
  adminOnly(async (ctx) => {
    if (!GROUP_CHAT_ID) {
      return ctx.reply("❌ GROUP_CHAT_ID is not configured.");
    }

    const text = ctx.message.text.replace(/^\/post\s*/i, "").trim();

    if (!text) {
      return ctx.reply("Usage:\n/post Your message here");
    }

    await bot.telegram.sendMessage(GROUP_CHAT_ID, text);

    await ctx.reply("✅ Posted to the $WHY community.");
  })
);

// WELCOME MESSAGE
const WELCOME_MESSAGE =
  "🤷🏾‍♂️ WHY DID YOU JOIN?\n\n" +
  "Welcome to the official $WHY community!\n\n" +
  "🟡 THE OFFICIAL CURRENCY OF BAD DECISIONS.\n\n" +
  "You made the decision.\n" +
  "You knew it was questionable.\n" +
  "You did it anyway.\n\n" +
  "WHY? 😂\n\n" +
  "🔥 Memes\n" +
  "🔥 Chaos\n" +
  "🔥 Community\n\n" +
  "🚫 No scams\n" +
  "🚫 No fake contract addresses\n" +
  "🚫 No fake profit promises\n\n" +
  "Welcome to $WHY.";

bot.command(
  "pinwelcome",
  adminOnly(async (ctx) => {
    if (!GROUP_CHAT_ID) {
      return ctx.reply("❌ GROUP_CHAT_ID is not configured.");
    }

    const message = await bot.telegram.sendMessage(
      GROUP_CHAT_ID,
      WELCOME_MESSAGE
    );

    await bot.telegram.pinChatMessage(
      GROUP_CHAT_ID,
      message.message_id,
      { disable_notification: true }
    );

    await ctx.reply("📌 Welcome message posted and pinned.");
  })
);

// AUTO WELCOME NEW MEMBERS
bot.on("new_chat_members", async (ctx) => {
  try {
    const members = ctx.message.new_chat_members || [];

    for (const member of members) {
      // Don't welcome the bot itself.
      if (member.is_bot && member.id === ctx.botInfo.id) {
        continue;
      }

      const name = member.first_name || "friend";

      await ctx.reply(
        `🤷🏾‍♂️ WHY DID YOU DO IT, ${name}?\n\n` +
        `Welcome to the $WHY community! 🟡\n\n` +
        `THE OFFICIAL CURRENCY OF BAD DECISIONS.\n\n` +
        `You made the decision.\n` +
        `You knew it was questionable.\n` +
        `You did it anyway.\n\n` +
        `WHY? 😂\n\n` +
        `Have fun. Make memes. Make questionable decisions.`
      );
    }
  } catch (error) {
    console.error("Welcome error:", error);
  }
});

// PAUSE / RESUME
let schedulingPaused = false;

bot.command(
  "pause",
  adminOnly(async (ctx) => {
    schedulingPaused = true;
    await ctx.reply("⏸ Scheduled posting has been paused.");
  })
);

bot.command(
  "resume",
  adminOnly(async (ctx) => {
    schedulingPaused = false;
    await ctx.reply("▶️ Scheduled posting has been resumed.");
  })
);

// EXAMPLE DAILY SCHEDULE
// This is intentionally disabled until we configure your actual posting schedule.
cron.schedule("0 12 * * *", async () => {
  if (schedulingPaused || !GROUP_CHAT_ID) return;

  console.log("Scheduled posting system checked.");
});

// ERROR HANDLING
bot.catch((error) => {
  console.error("Telegram bot error:", error);
});

// START BOT
bot.launch();

console.log("🤷🏾‍♂️ $WHY BOT IS RUNNING...");
