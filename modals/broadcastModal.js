module.exports = {
  customIds: [
    'broadcast-all-modal',
    'broadcast-online-modal',
    'broadcast-offline-modal',
    'broadcast-specific-modal',
    'broadcast-role-modal',
  ],

  async execute(interaction) {
    try {
      const customId = interaction.customId.replace('-modal', '');

      let message = interaction.fields.getTextInputValue('broadcast-message') || '';
      message = message.replace(/@everyone|@here/gi, match => `\`${match}\``);

      await interaction.deferReply({ ephemeral: true });

      const guild = interaction.guild;
      await guild.members.fetch();

      let targetUsers = new Map();

      switch (customId) {
        case 'broadcast-all':
          targetUsers = guild.members.cache.filter(m => !m.user.bot);
          break;

        case 'broadcast-online':
          targetUsers = guild.members.cache.filter(
            m => !m.user.bot && ['online', 'idle', 'dnd'].includes(m.presence?.status)
          );
          break;

        case 'broadcast-offline':
          targetUsers = guild.members.cache.filter(
            m => !m.user.bot && (!m.presence || m.presence.status === 'offline')
          );
          break;

        case 'broadcast-specific': {
          const targetUserInput = interaction.fields.getTextInputValue('target-user');
          let targetUser = null;

          if (targetUserInput.startsWith('<@') && targetUserInput.endsWith('>')) {
            const userId = targetUserInput.slice(2, -1).replace('!', '');
            targetUser = guild.members.cache.get(userId);
          } else if (/^\d+$/.test(targetUserInput)) {
            targetUser = guild.members.cache.get(targetUserInput);
          } else {
            targetUser = guild.members.cache.find(m =>
              m.user.username.toLowerCase().includes(targetUserInput.toLowerCase()) ||
              m.displayName.toLowerCase().includes(targetUserInput.toLowerCase())
            );
          }

          if (!targetUser || targetUser.user.bot) {
            return await interaction.followUp({
              content: '❌ **خطأ:** لم يتم العثور على المستخدم أو أن المستخدم هو بوت.',
              ephemeral: true
            });
          }

          targetUsers = new Map([[targetUser.id, targetUser]]);
          break;
        }

        case 'broadcast-role': {
          await interaction.followUp({
            content: '🏷️ أرسل الآن **ID الرتبة** التي تريد إرسال الرسالة لأعضائها خلال 30 ثانية.',
            ephemeral: true
          });

          const filter = m => m.author.id === interaction.user.id;
          const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000 }).catch(() => null);

          if (!collected || !collected.first()) {
            return await interaction.followUp({
              content: '⏰ انتهى الوقت ولم يتم إرسال الـ ID.',
              ephemeral: true
            });
          }

          const roleId = collected.first().content.trim();
          const role = guild.roles.cache.get(roleId);

          if (!role) {
            return await interaction.followUp({
              content: '❌ **خطأ:** لم يتم العثور على رتبة بهذا الـ ID.',
              ephemeral: true
            });
          }

          targetUsers = guild.members.cache.filter(m => m.roles.cache.has(role.id) && !m.user.bot);
          break;
        }

        default:
          return await interaction.followUp({
            content: '❌ **خطأ:** نوع الإرسال غير معروف.',
            ephemeral: true
          });
      }

      if (!targetUsers || targetUsers.size === 0) {
        return await interaction.followUp({
          content: '❌ **خطأ:** لا يوجد أعضاء مطابقين للشروط المحددة.',
          ephemeral: true
        });
      }

      const userArray = Array.from(targetUsers.values());
      await interaction.followUp({
        content: `⏳ **انتظر قليلًا... جاري الإرسال إلى ${userArray.length} عضو.**`,
        ephemeral: true
      });

      const maxConcurrent = 5;
      const baseDelay = 1500;
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < userArray.length; i += maxConcurrent) {
        const batch = userArray.slice(i, i + maxConcurrent);
        const promises = batch.map(async (member, index) => {
          try {
            const delay = (Math.random() * 700) + (index * 400);
            await new Promise(r => setTimeout(r, delay));
            // امنع أي منشنات عند الإرسال ونفذ الإرسال ككائن لتمرير allowedMentions
            await member.send({ content: message, allowedMentions: { users: [], roles: [], parse: [] } });
            successCount++;
          } catch (error) {
            console.error(`فشل إرسال الرسالة إلى ${member.user?.tag || member.id}:`, error);
            failCount++;
          }
        });

        await Promise.all(promises);

        if (i + maxConcurrent < userArray.length) {
          await new Promise(r => setTimeout(r, baseDelay + Math.random() * 1000));
        }
      }

      await interaction.followUp({
        content: `✅ تم الإرسال بنجاح إلى **${successCount}** | ❌ فشل مع **${failCount}** | 📊 الإجمالي: ${successCount + failCount}`,
        ephemeral: true
      });

    } catch (error) {
      console.error('🚨 خطأ في broadcastModal:', error);
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.deferReply({ ephemeral: true });
        }
        await interaction.followUp({
          content: '❌ **خطأ:** حدث خطأ أثناء إرسال الرسائل.',
          ephemeral: true
        });
      } catch {}
    }
  }
};
