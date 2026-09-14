require("dotenv").config();

const http = require("http");
const { Telegraf } = require("telegraf");
const cron = require("node-cron");

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

const GROUP_CHAT_ID = process.env.GROUP_CHAT_ID || "";

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN is missing.");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

let schedulingPaused = false;

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

/* =========================
   CONTENT
========================= */

const DAILY_POSTS = [
  "🤷🏾‍♂️ WHY OF THE DAY\n\nYou knew it was a bad idea.\n\nYou did it anyway.\n\nWHY? 😂\n\n🟡 $WHY — The Official Currency of Bad Decisions.",

  "😂 DAILY REMINDER\n\nGood decisions are responsible.\n\nBad decisions are memorable.\n\nChoose wisely.\n\nOr don't.\n\nWHY? 🤷🏾‍♂️\n\n🟡 $WHY",

  "🤔 BE HONEST...\n\nWhat's the dumbest thing you've ever spent money on?\n\nDon't lie. We won't judge. 😂\n\n🟡 $WHY",

  "🔥 $WHY PHILOSOPHY\n\nYou don't need a reason.\n\nYou just need a WHY.\n\n😂🤷🏾‍♂️\n\nTHE OFFICIAL CURRENCY OF BAD DECISIONS.",

  "🤷🏾‍♂️ QUICK QUESTION\n\nHave you ever said:\n\n\"This is probably a bad idea...\"\n\n…and then did it anyway?\n\nWelcome home. 😂\n\n$WHY"
];

function randomPost() {
  return DAILY_POSTS[Math.floor(Math.random() * DAILY_POSTS.length)];
}

/* =========================
   BASIC COMMANDS
========================= */

bot.start(async (ctx) => {
  await ctx.reply(
    "🤷🏾‍♂️ WHY?\n\n" +
    "Welcome to the official $WHY bot.\n\n" +
    "🟡 THE OFFICIAL CURRENCY OF BAD DECISIONS.\n\n" +
    "Memes • Chaos • Community"
  );
});

bot.help(async (ctx) => {
  await ctx.reply(
    "🤖 $WHY BOT\n\n" +
    "/start — Start the bot\n" +
    "/status — Bot status\n" +
    "/chatid — Show this chat ID\n\n" +
    "ADMIN COMMANDS\n" +
    "/post <message> — Post to community\n" +
    "/pinwelcome — Post and pin welcome\n" +
    "/pause — Pause scheduled posts\n" +
    "/resume — Resume scheduled posts\n" +
    "/now — Post a random WHY message"
  );
});

/* =========================
   CHAT ID
========================= */

bot.command(
  "chatid",
  adminOnly(async (ctx) => {
    await ctx.reply(`🆔 Chat ID:\n\n${ctx.chat.id}`);
  })
);

/* =========================
   STATUS
========================= */

bot.command(
  "status",
  adminOnly(async (ctx) => {
    await ctx.reply(
      "🟢 $WHY BOT IS ONLINE\n\n" +
      "Welcome system: ACTIVE\n" +
      "Admin controls: ACTIVE\n" +
      "Scheduled posting: " +
      (schedulingPaused ? "PAUSED" : "ACTIVE")
    );
  })
);

/* =========================
   MANUAL POST
========================= */

bot.command(
  "post",
  adminOnly(async (ctx) => {
    if (!GROUP_CHAT_ID) {
      return ctx.reply("❌ GROUP_CHAT_ID is not configured.");
    }

    const text = ctx.message.text
      .replace(/^\/post\s*/i, "")
      .trim();

    if (!text) {
      return ctx.reply("Usage:\n\n/post Your message here");
    }

    await bot.telegram.sendMessage(GROUP_CHAT_ID, text);

    await ctx.reply("✅ Posted to the $WHY community.");
  })
);

/* =========================
   RANDOM POST
========================= */

bot.command(
  "now",
  adminOnly(async (ctx) => {
    if (!GROUP_CHAT_ID) {
      return ctx.reply("❌ GROUP_CHAT_ID is not configured.");
    }

    await bot.telegram.sendMessage(
      GROUP_CHAT_ID,
      randomPost()
    );

    await ctx.reply("🔥 Random $WHY post published.");
  })
);

/* =========================
   WELCOME MESSAGE
========================= */

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

/* =========================
   PIN WELCOME
========================= */

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
      {
        disable_notification: true
      }
    );

    await ctx.reply("📌 Welcome message posted and pinned.");
  })
);

/* =========================
   NEW MEMBER WELCOME
========================= */

bot.on("new_chat_members", async (ctx) => {
  try {
    const members = ctx.message.new_chat_members || [];

    for (const member of members) {
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
        `🔥 Memes\n` +
        `🔥 Chaos\n` +
        `🔥 Community\n\n` +
        `Have fun. Make memes.`
      );
    }
  } catch (error) {
    console.error("Welcome error:", error);
  }
});

/* =========================
   PAUSE / RESUME
========================= */

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

/* =========================
   AUTOMATIC POSTS
========================= */

/*
   Times use the server timezone.
   For now:
   09:00
   14:00
   20:00
*/

cron.schedule("0 9 * * *", async () => {
  if (schedulingPaused || !GROUP_CHAT_ID) return;

  try {
    await bot.telegram.sendMessage(
      GROUP_CHAT_ID,
      randomPost()
    );

    console.log("☀️ Morning $WHY post published.");
  } catch (error) {
    console.error("Morning post error:", error);
  }
});

cron.schedule("0 14 * * *", async () => {
  if (schedulingPaused || !GROUP_CHAT_ID) return;

  try {
    await bot.telegram.sendMessage(
      GROUP_CHAT_ID,
      randomPost()
    );

    console.log("😂 Afternoon $WHY post published.");
  } catch (error) {
    console.error("Afternoon post error:", error);
  }
});

cron.schedule("0 20 * * *", async () => {
  if (schedulingPaused || !GROUP_CHAT_ID) return;

  try {
    await bot.telegram.sendMessage(
      GROUP_CHAT_ID,
      randomPost()
    );

    console.log("🌙 Evening $WHY post published.");
  } catch (error) {
    console.error("Evening post error:", error);
  }
});

/* =========================
   TELEGRAM ERRORS
========================= */

bot.catch((error) => {
  console.error("Telegram bot error:", error);
});

/* =========================
   RENDER HTTP SERVER
========================= */

const PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, {
      "Content-Type": "application/json"
    });

    res.end(
      JSON.stringify({
        status: "ok",
        bot: "$WHY",
        message: "WHYTheCoinBot is running"
      })
    );

    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/plain"
  });

  res.end("$WHY BOT IS ALIVE 🤷🏾‍♂️");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(
    `🌐 HTTP server listening on 0.0.0.0:${PORT}`
  );
});

/* =========================
   START BOT
========================= */

bot.launch();

console.log("🤷🏾‍♂️ $WHY BOT IS RUNNING...");

/* =========================
   SHUTDOWN
========================= */

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
