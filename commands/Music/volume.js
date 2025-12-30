const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Adjust the playback volume')
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Volume level between 0 and 100')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(100)
        ),

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

            const level = interaction.options.getInteger('level');
            await player.setVolume(level);

            let volumeEmoji;
            if (level === 0) volumeEmoji = '🔇';
            else if (level <= 30) volumeEmoji = '🔈';
            else if (level <= 70) volumeEmoji = '🔉';
            else volumeEmoji = '🔊';

            await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setTitle(`${volumeEmoji} Volume Adjusted`)
                    .setDescription(`Volume has been set to **${level}%**.`)
                    .setColor('#8A2BE2')
                    .setTimestamp()
                    .setFooter({ text: `Requested by ${interaction.user.username}` })]
            });

        } catch (error) {
            console.error('Volume command error:', error);
            await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setTitle('Error')
                    .setDescription(`Could not adjust volume: ${error.message}`)
                    .setColor('#FF0000')
                    .setTimestamp()
                    .setFooter({ text: `Requested by ${interaction.user.username}` })],
                ephemeral: true
            });
        }
    }
};
