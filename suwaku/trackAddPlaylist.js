const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'trackAddPlaylist',
    async execute(player, playlistData, client) {
        console.log(`[Suwaku] Playlist added: ${playlistData.name} with ${playlistData.trackCount} tracks (${player.guildId})`);

        const textChannel = client.channels.cache.get(player.textChannelId);
        if (textChannel) {
            const embed = new EmbedBuilder()
                .setTitle('Playlist Added')
                .setDescription(`**${playlistData.name}**`)
                .setColor('#4CAF50')
                .addFields(
                    { name: 'Tracks', value: `${playlistData.trackCount}`, inline: true },
                    { name: 'Duration', value: playlistData.duration || 'Unknown', inline: true }
                )
                .setTimestamp();

            textChannel.send({ embeds: [embed] });
        }
    }
};
