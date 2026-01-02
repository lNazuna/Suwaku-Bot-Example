const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skipto')
        .setDescription('Skip to a specific position in the queue')
        .addIntegerOption(option =>
            option.setName('position')
                .setDescription('Position to skip to')
                .setRequired(true)
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

        const position = interaction.options.getInteger('position');
        const queueSize = player.queue?.size || player.queue?.tracks?.length || 0;

        if (queueSize === 0) {
            return interaction.reply({ content: '❌ Queue is empty!', flags: MessageFlags.Ephemeral });
        }

        if (position > queueSize) {
            return interaction.reply({ content: `❌ Position out of range! Queue has ${queueSize} songs.`, flags: MessageFlags.Ephemeral });
        }

        await player.jumpTo(position - 1);
        return interaction.reply(`⏭️ Skipped to position **#${position}**`);
    }
};
