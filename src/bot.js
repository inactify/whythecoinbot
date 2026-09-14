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
    "/post <message> — Post to the community\n" +
    "/pinwelcome — Post and pin welcome\n" +
    "/pause — Pause scheduled posting\n" +
    "/resume — Resume scheduled posting"
  );
});

/* =========================
   CHAT ID
========================= */

bot.command(
  "chatid",
  adminOnly(async (ctx) => {
    await ctx.reply(
      `🆔 Chat ID:\n\n${ctx.chat.id}`
    );
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
      "Render server: ACTIVE"
    );
  })
);

/* =========================
   POST
========================= */

bot.command(
  "post",
  adminOnly(async (ctx) => {
    if (!GROUP_CHAT_ID) {
      return ctx.reply(
        "❌ GROUP_CHAT_ID is not configured yet.\n\n" +
        "Use /chatid inside the group to get the group ID."
      );
    }

    const text = ctx.message.text
      .replace(/^\/post\s*/i, "")
      .trim();

    if (!text) {
      return ctx.reply(
        "Usage:\n\n/post Your message here"
      );
    }

    await bot.telegram.sendMessage(GROUP_CHAT_ID, text);

    await ctx.reply(
      "✅ Posted to the $WHY community."
    );
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
      return ctx.reply(
        "❌ GROUP_CHAT_ID is not configured yet."
      );
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

    await ctx.reply(
      "📌 Welcome message posted and pinned."
    );
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

let schedulingPaused = false;

bot.command(
  "pause",
  adminOnly(async (ctx) => {
    schedulingPaused = true;

    await ctx.reply(
      "⏸ Scheduled posting has been paused."
    );
  })
);

bot.command(
  "resume",
  adminOnly(async (ctx) => {
    schedulingPaused = false;

    await ctx.reply(
      "▶️ Scheduled posting has been resumed."
    );
  })
);

/* =========================
   SCHEDULE SYSTEM
========================= */

cron.schedule("0 12 * * *", async () => {
  if (schedulingPaused) return;

  console.log("🕛 $WHY scheduled system checked.");
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

  res.end(
    "$WHY BOT IS ALIVE 🤷🏾‍♂️"
  );
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(
    `🌐 HTTP server listening on 0.0.0.0:${PORT}`
  );
});

/* =========================
   START TELEGRAM BOT
========================= */

bot.launch();

console.log("🤷🏾‍♂️ $WHY BOT IS RUNNING...");

/* =========================
   GRACEFUL SHUTDOWN
========================= */

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
