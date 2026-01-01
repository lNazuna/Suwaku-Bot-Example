const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resume the paused song'),

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

            if (!player.paused) {
                return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle('Already Playing')
                        .setDescription('The music is already playing.')
                        .setColor('#FFA500')
                        .setTimestamp()
                        .setFooter({ text: `Requested by ${interaction.user.username}` })]
                });
            }

            player.resume();

            await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setTitle('Music Resumed')
                    .setDescription('The playback has been resumed.')
                    .setColor('#8A2BE2')
                    .setTimestamp()
                    .setFooter({ text: `Requested by ${interaction.user.username}` })]
            });

        } catch (error) {
            console.error('Resume command error:', error);
            await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setTitle('Error')
                    .setDescription(`Could not resume: ${error.message}`)
                    .setColor('#FF0000')
                    .setTimestamp()
                    .setFooter({ text: `Requested by ${interaction.user.username}` })],
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
