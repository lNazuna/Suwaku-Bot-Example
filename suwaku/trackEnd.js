module.exports = {
    name: 'trackEnd',
    async execute(player, track, client) {
        const trackTitle = track.title || 'Unknown';
        const trackAuthor = track.author || 'Unknown';
        console.log(`[Suwaku] Track ended: ${trackTitle} - ${trackAuthor} (${player.guildId})`);

        if (player.progressInterval) {
            clearInterval(player.progressInterval);
            player.progressInterval = null;
        }

        const channelId = player.nowPlayingChannelId || player.textChannelId;
        if (!client?.channels?.cache || !channelId) return;

        const textChannel = client.channels.cache.get(channelId);

        if (player.nowPlayingMessageId && textChannel) {
            try {
                const message = await textChannel.messages.fetch(player.nowPlayingMessageId).catch(() => null);
                if (message) await message.delete().catch(() => {});
            } catch {}
            player.nowPlayingMessageId = null;
        }
    }
};
