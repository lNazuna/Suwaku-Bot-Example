const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { formatDuration } = require('../../functions/formatDuration');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Search for a song')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Song name to search')
                .setRequired(true)
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

            await interaction.deferReply();

            const query = interaction.options.getString('query');
            const searchResults = await suwaku.search(query, { requester: interaction.user });

            if (!searchResults || !searchResults.tracks || searchResults.tracks.length === 0) {
                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setTitle('No Results')
                        .setDescription(`No results found for "${query}".`)
                        .setColor('#FFA500')
                        .setTimestamp()
                        .setFooter({ text: `Requested by ${interaction.user.username}` })]
                });
            }

            const results = searchResults.tracks.slice(0, 10);
            const resultsList = results.map((track, index) =>
                `**${index + 1}.** ${track.title} - ${track.author} | ${track.duration ? formatDuration(track.duration) : 'Unknown'}`
            ).join('\n');

            await interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setTitle('Search Results')
                    .setDescription(`Results for "${query}":\n\n${resultsList}\n\nUse \`/play ${query}\` to play the first result.`)
                    .setColor('#8A2BE2')
                    .setTimestamp()
                    .setFooter({ text: `Requested by ${interaction.user.username}` })]
            });

        } catch (error) {
            console.error('Search command error:', error);
            await interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setTitle('Error')
                    .setDescription(`Could not perform search: ${error.message}`)
                    .setColor('#FF0000')
                    .setTimestamp()
                    .setFooter({ text: `Requested by ${interaction.user.username}` })]
            });
        }
    }
};
