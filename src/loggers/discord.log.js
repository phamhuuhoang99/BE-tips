const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on("ready", () => {
  console.log(`Logged is as ${client.user.tag}`);
});

const token =
  "MTEzODEwMDY3NjAyMzU1NDA5OQ.GYNEMw.k6eJ23XjLs62FQWxNPwGVxKPzuq_r2JEjoMQ2k";

client.login(token);

client.on("messageCreate", (msg) => {
  if (msg.author.bot) return;
  if (msg.content === "hello") {
    msg.reply("What's up");
  }
});
