const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");

module.exports = {
  name: "broadcastButtons",

  async execute(interaction) {
    if (!interaction.isButton()) return;

    const id = interaction.customId;
    const modals = {
      "broadcast-all": "إرسال للجميع",
      "broadcast-online": "إرسال للمتصلين فقط",
      "broadcast-offline": "إرسال للغير متصلين",
      "broadcast-specific": "إرسال لشخص محدد",
      "broadcast-role": "إرسال لرتبة محددة"
    };

    if (!modals[id]) return;

    const modal = new ModalBuilder()
      .setCustomId(`${id}-modal`)
      .setTitle(modals[id]);

    const messageInput = new TextInputBuilder()
      .setCustomId("broadcast-message")
      .setLabel("اكتب الرسالة التي تريد إرسالها:")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const messageRow = new ActionRowBuilder().addComponents(messageInput);
    modal.addComponents(messageRow);

    if (id === "broadcast-specific") {
      const userInput = new TextInputBuilder()
        .setCustomId("target-user")
        .setLabel("اكتب اسم أو آيدي المستخدم:")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(userInput));
    }

    if (id === "broadcast-role") {
      const roleInput = new TextInputBuilder()
        .setCustomId("target-role")
        .setLabel("اكتب آيدي الرتبة:")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(roleInput));
    }

    await interaction.showModal(modal);
  },
};
