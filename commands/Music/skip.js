const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip to the next song'),

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
                    flags: MessageFlags.Ephemeral
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
                    flags: MessageFlags.Ephemeral
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

            await player.skip();

            await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setTitle('Song Skipped')
                    .setDescription('Skipping to the next song in queue.')
                    .setColor('#8A2BE2')
                    .setTimestamp()
                    .setFooter({ text: `Requested by ${interaction.user.username}` })]
            });

        } catch (error) {
            console.error('Skip command error:', error);
            await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setTitle('Error')
                    .setDescription(`Could not skip: ${error.message}`)
                    .setColor('#FF0000')
                    .setTimestamp()
                    .setFooter({ text: `Requested by ${interaction.user.username}` })],
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
