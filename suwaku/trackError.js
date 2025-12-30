const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'trackError',
    async execute(player, track, error, client) {
        const trackTitle = track.title || 'Unknown';
        console.error(`[Suwaku] Track error: ${trackTitle} - ${error.message || 'Unknown error'} (${player.guildId})`);

        if (!client.channels.cache || !player.textChannelId) return;

        const textChannel = client.channels.cache.get(player.textChannelId);
        if (textChannel) {
            const embed = new EmbedBuilder()
                .setTitle('Playback Error')
                .setDescription(`Failed to play **${trackTitle}**.\nSkipping to the next track.`)
                .setColor('#FF0000')
                .setTimestamp()
                .setFooter({ text: `Requested by ${track.requester.username || 'Unknown'}` });

            textChannel.send({ embeds: [embed] });
        }
    }
};
