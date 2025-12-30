const { EmbedBuilder } = require('discord.js');
const { formatDuration } = require('../functions/formatDuration');

module.exports = {
    name: 'trackAdd',
    async execute(player, track, client) {
        const trackTitle = track.title || 'Unknown';
        const trackAuthor = track.author || 'Unknown';
        console.log(`[Suwaku] Track added: ${trackTitle} - ${trackAuthor} (${player.guildId})`);

        if (!client.channels.cache || !player.textChannelId) return;

        const textChannel = client.channels.cache.get(player.textChannelId);
        if (!textChannel) return;

        const queue = player.queue;

        let position = 1;

        if (!queue || !queue.current) {
            position = 1;
        } else if (Array.isArray(queue.tracks)) {
            const trackIndex = queue.tracks.findIndex(t => t.id === track.id);
            if (trackIndex !== -1) {
                position = trackIndex + 2;
            } else {
                position = queue.tracks.length + 1;
            }
        }

        if (position >= 1) {
            const duration = track.duration ? formatDuration(track.duration) : 'Unknown';

            const embed = new EmbedBuilder()
                .setTitle('Added to Queue')
                .setDescription(`**${track.title || 'Unknown'}**\nby ${track.author || 'Unknown'}`)
                .setColor('#4CAF50')
                .setThumbnail(track.thumbnail || track.artworkUrl || null)
                .addFields(
                    { name: 'Position', value: `#${position}`, inline: true },
                    { name: 'Duration', value: duration, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: `Requested by ${track.requester.user.username || 'Unknown'}` });

            textChannel.send({ embeds: [embed] });
        }
    }
};
