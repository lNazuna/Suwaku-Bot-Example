const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause the current song'),

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

            if (player.paused) {
                return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle('Already Paused')
                        .setDescription('The playback is already paused.')
                        .setColor('#FFA500')
                        .setTimestamp()
                        .setFooter({ text: `Requested by ${interaction.user.username}` })]
                });
            }

            player.pause();

            await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setTitle('Music Paused')
                    .setDescription('The playback has been paused. Use `/resume` to continue.')
                    .setColor('#8A2BE2')
                    .setTimestamp()
                    .setFooter({ text: `Requested by ${interaction.user.username}` })]
            });

        } catch (error) {
            console.error('Pause command error:', error);
            await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setTitle('Error')
                    .setDescription(`Could not pause: ${error.message}`)
                    .setColor('#FF0000')
                    .setTimestamp()
                    .setFooter({ text: `Requested by ${interaction.user.username}` })],
                ephemeral: true
            });
        }
    }
};
