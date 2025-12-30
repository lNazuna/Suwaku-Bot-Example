const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Song name or URL')
                .setRequired(true)
                .setAutocomplete(true)
        ),

    async autocomplete(interaction, client) {
        const suwaku = client.suwaku || global.suwaku;
        if (!suwaku) return interaction.respond([]);

        const focusedValue = interaction.options.getFocused();
        const choices = await suwaku.autocomplete(focusedValue);
        return interaction.respond(choices || []);
    },

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

            let dots = '';
            const loadingMessage = await interaction.editReply('Loading song');

            const loadingInterval = setInterval(async () => {
                dots = dots.length >= 3 ? '' : dots + '.';
                try {
                    await loadingMessage.edit(`Loading song${dots}`);
                } catch {
                    clearInterval(loadingInterval);
                }
            }, 500);

            const query = interaction.options.getString('query');
            const voiceChannel = interaction.member.voice.channel;

            if (!voiceChannel) {
                clearInterval(loadingInterval);
                return interaction.editReply({
                    content: '',
                    embeds: [new EmbedBuilder()
                        .setTitle('Error')
                        .setDescription('You need to be in a voice channel!')
                        .setColor('#FF0000')
                        .setTimestamp()
                        .setFooter({ text: `Requested by ${interaction.user.username}` })]
                });
            }

            await suwaku.play({
                query,
                voiceChannel,
                textChannel: interaction.channel,
                member: interaction.member,
                requester: interaction.user
            });

            clearInterval(loadingInterval);
            await interaction.deleteReply();

        } catch (error) {
            console.error('Play command error:', error);

            const errorEmbed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription(`Could not play the song: ${error.message}`)
                .setColor('#FF0000')
                .setTimestamp()
                .setFooter({ text: `Requested by ${interaction.user.username}` });

            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: '', embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};
