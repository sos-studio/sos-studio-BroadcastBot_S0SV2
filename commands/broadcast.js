const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("broadcast")
    .setDescription("📢 إرسال رسالة جماعية للأعضاء")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle("📢 نظام البرودكاست")
      .setDescription("اختر نوع الإرسال من الأزرار أدناه:")
      .setFooter({ text: "Broadcast System", iconURL: interaction.guild.iconURL() })
      .setTimestamp();

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("broadcast-all")
        .setLabel("إرسال للجميع")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("broadcast-online")
        .setLabel("إرسال للمتصلين فقط")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("broadcast-offline")
        .setLabel("إرسال للغير متصلين فقط")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("broadcast-specific")
        .setLabel("إرسال لشخص محدد")
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId("broadcast-role")
        .setLabel("إرسال لرتبة محددة")
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [buttons], ephemeral: true });
  }
};
