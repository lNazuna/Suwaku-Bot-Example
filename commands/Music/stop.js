const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop the playback and clear the queue'),

    async execute(interaction) {
        try {
            const suwaku = interaction.client.suwaku || global.suwaku;
            if (!suwaku) {
                return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle('Error')
                        .setDescription('Music system not available!')
                        .setColor('#FF0000')
                        .setTimestamp()
                        .setFooter({ text: `Requested by ${interaction.user.username}` })],
                    ephemeral: true
                });
            }

            const player = suwaku.getPlayer(interaction.guildId);

            if (!player) {
                return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle('Error')
                        .setDescription('No music is currently playing!')
                        .setColor('#FF0000')
                        .setTimestamp()
                        .setFooter({ text: `Requested by ${interaction.user.username}` })],
                    ephemeral: true
                });
            }

            if (player.nowPlayingMessageId) {
                try {
                    const channel = interaction.client.channels.cache.get(player.nowPlayingChannelId || player.textChannelId);
                    if (channel) {
                        const msg = await channel.messages.fetch(player.nowPlayingMessageId).catch(() => null);
                        if (msg) await msg.delete().catch(() => {});
                    }
                } catch {}
                player.nowPlayingMessageId = null;
            }

            if (player.progressInterval) {
                clearInterval(player.progressInterval);
                player.progressInterval = null;
            }

            await player.stop();
            await player.destroy();

            await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setTitle('Playback Stopped')
                    .setDescription('The playback has been stopped and the queue has been cleared.')
                    .setColor('#8A2BE2')
                    .setTimestamp()
                    .setFooter({ text: `Requested by ${interaction.user.username}` })]
            });

        } catch (error) {
            console.error('Stop command error:', error);
            await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setTitle('Error')
                    .setDescription(`Could not stop: ${error.message}`)
                    .setColor('#FF0000')
                    .setTimestamp()
                    .setFooter({ text: `Requested by ${interaction.user.username}` })],
                ephemeral: true
            });
        }
    }
};
