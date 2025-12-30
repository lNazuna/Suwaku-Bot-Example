const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'trackStuck',
    async execute(player, track, threshold, client) {
        const trackTitle = track.title || 'Unknown';
        console.warn(`[Suwaku] Track stuck: ${trackTitle} (${threshold}ms) (${player.guildId})`);

        if (!client.channels.cache || !player.textChannelId) return;

        const textChannel = client.channels.cache.get(player.textChannelId);
        if (textChannel) {
            const embed = new EmbedBuilder()
                .setTitle('Track Stuck')
                .setDescription(`**${trackTitle}** got stuck. Attempting to skip...`)
                .setColor('#FFA500')
                .setTimestamp()
                .setFooter({ text: `Threshold: ${threshold || 0}ms` });

            textChannel.send({ embeds: [embed] });
        }
    }
};
