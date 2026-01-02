const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { TRACKS_PER_PAGE, buildQueueEmbed, buildQueueButtons } = require('../../functions/queueUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Show the music queue')
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('Page number')
                .setMinValue(1)
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

        const tracks = player.queue?.tracks || [];
        const current = player.currentTrack || player.queue?.current;

        if (!current && tracks.length === 0) {
            return interaction.reply({ content: '📭 Queue is empty!', flags: MessageFlags.Ephemeral });
        }

        const totalPages = Math.max(1, Math.ceil(tracks.length / TRACKS_PER_PAGE));
        let page = (interaction.options.getInteger('page') || 1) - 1;
        page = Math.max(0, Math.min(page, totalPages - 1));

        const embed = buildQueueEmbed(player, page, totalPages);
        const buttons = buildQueueButtons(page, totalPages);

        const msg = await interaction.reply({
            embeds: [embed],
            components: totalPages > 1 ? [buttons] : [],
            fetchReply: true
        });

        if (totalPages <= 1) return;

        const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 120000
        });

        collector.on('collect', async i => {
            if (i.customId === 'queue_first') page = 0;
            else if (i.customId === 'queue_prev') page = Math.max(0, page - 1);
            else if (i.customId === 'queue_next') page = Math.min(totalPages - 1, page + 1);
            else if (i.customId === 'queue_last') page = totalPages - 1;

            const newEmbed = buildQueueEmbed(player, page, totalPages);
            const newButtons = buildQueueButtons(page, totalPages);

            await i.update({ embeds: [newEmbed], components: [newButtons] });
        });

        collector.on('end', async () => {
            const finalEmbed = buildQueueEmbed(player, page, totalPages);
            const disabledButtons = buildQueueButtons(page, totalPages, true);
            await msg.edit({ embeds: [finalEmbed], components: [disabledButtons] }).catch(() => {});
        });
    }
};
