const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('filter')
        .setDescription('Apply an audio filter')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Filter type')
                .setRequired(true)
                .addChoices(
                    { name: 'Nightcore', value: 'nightcore' },
                    { name: 'Vaporwave', value: 'vaporwave' },
                    { name: 'Bass Boost', value: 'bassboost' },
                    { name: '8D', value: '8d' },
                    { name: 'Karaoke', value: 'karaoke' },
                    { name: 'Clear Filters', value: 'clear' }
                )
        ),

    async execute(interaction) {
        const suwaku = interaction.client.suwaku || global.suwaku;
        if (!suwaku) {
            return interaction.reply({ content: '❌ Music system not available!', flags: MessageFlags.Ephemeral });
        }

        const player = suwaku.getPlayer(interaction.guild.id);
        if (!player) {
            return interaction.reply({ content: '❌ No active player!', flags: MessageFlags.Ephemeral });
        }

        const filterType = interaction.options.getString('type');

        if (filterType === 'clear') {
            await player.filters.clearFilters();
            return interaction.reply('🎚️ Filters cleared!');
        }

        await interaction.deferReply();

        try {
            await player.filters.applyPreset(filterType);
            await interaction.editReply(`🎚️ Filter **${filterType}** applied!`);
        } catch (err) {
            await interaction.editReply(`❌ Error applying filter: ${err.message}`);
        }
    }
};
