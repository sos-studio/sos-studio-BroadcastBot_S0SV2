const fs = require("fs");
const path = require("path");
const { Client, Collection, GatewayIntentBits, Partials, Events, REST, Routes } = require("discord.js");
const config = require("./config.json");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildPresences
  ],
  partials: [Partials.Channel],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.existsSync(commandsPath) ? fs.readdirSync(commandsPath).filter(file => file.endsWith(".js")) : [];
const commandsData = [];

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
    commandsData.push(command.data.toJSON());
  } else {
    console.warn(`⚠️ تخطي الملف ${file} لأنه لا يحتوي على data أو execute`);
  }
}

client.once(Events.ClientReady, async c => {
  console.log(`
                 Made by S0S Studio
             https://discord.gg/7hy5uXt45a
  ⚡Bot is starting... ${client.user.tag}
  🤖Bot is online ${client.user.tag}`);

  if (!config.clientId) {
    console.warn("⚠️ clientId not found in config.json. Skipping slash command registration.");
    console.log("📝 To register commands, add 'clientId' to config.json with your bot's application ID.");
    return;
  }

  const rest = new REST({ version: "10" }).setToken(config.token);

  try {
    console.log("🔄 جاري تحديث أوامر الـSlash...");
    await rest.put(
      Routes.applicationCommands(config.clientId),
      { body: commandsData }
    );
    console.log(`✅ تم تسجيل ${commandsData.length} أمر بنجاح!`);
  } catch (error) {
    console.error("❌ خطأ أثناء تسجيل الأوامر:", error.message);
  }
});

const modalsPath = path.join(__dirname, "modals");
client.modals = [];
client.buttonHandler = null;

try {
  const btn = require(path.join(modalsPath, "broadcastButtons.js"));
  if (btn && typeof btn.execute === "function") {
    client.buttonHandler = btn;
    console.log("🔹 تم تحميل معالج الأزرار: broadcastButtons.js");
  }
} catch (e) {
}

if (fs.existsSync(modalsPath)) {
  const modalFiles = fs.readdirSync(modalsPath).filter(file => file.endsWith(".js"));
  for (const file of modalFiles) {
    const filePath = path.join(modalsPath, file);
    const modal = require(filePath);
    if (modal.customIds && modal.execute) {
      client.modals.push(modal);
      console.log(`🔹 تم تحميل مودال: ${file}`);
    }
  }
}

client.on(Events.InteractionCreate, async interaction => {
  try {
    if (interaction.isChatInputCommand && interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (error) {
        console.error("❌ خطأ أثناء تنفيذ الأمر:", error);
        const replyOptions = { content: "❌ حدث خطأ أثناء تنفيذ هذا الأمر.", ephemeral: true };
        if (interaction.replied || interaction.deferred) await interaction.followUp(replyOptions);
        else await interaction.reply(replyOptions);
      }
      return;
    }

    if (interaction.isButton && interaction.isButton()) {
      if (client.buttonHandler) {
        try {
          await client.buttonHandler.execute(interaction);
        } catch (err) {
          console.error("❌ خطأ أثناء معالجة الزر:", err);
        }
      }
      return;
    }

    if (interaction.isModalSubmit && interaction.isModalSubmit()) {
      const modalHandler = client.modals.find(m => m.customIds.some(id => interaction.customId.startsWith(id)));
      if (!modalHandler) return;
      try {
        await modalHandler.execute(interaction);
      } catch (error) {
        console.error("❌ خطأ أثناء معالجة المودال:", error);
        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: "حدث خطأ أثناء معالجة النموذج.", ephemeral: true });
          } else {
            await interaction.reply({ content: "حدث خطأ أثناء معالجة النموذج.", ephemeral: true });
          }
        } catch {}
      }
      return;
    }
  } catch (err) {
    console.error('❌ خطأ عام أثناء معالجة التفاعل:', err);
  }
});

client.login(config.token);
