const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'queueEnd',
    async execute(player, client) {
        console.log(`[Suwaku] Queue ended (${player.guildId})`);

        if (player.progressInterval) {
            clearInterval(player.progressInterval);
            player.progressInterval = null;
        }

        const channelId = player.nowPlayingChannelId || player.textChannelId;
        if (!client.channels.cache || !channelId) return;

        const textChannel = client.channels.cache.get(channelId);
        if (!textChannel) return;

        if (player.nowPlayingMessageId) {
            try {
                const msg = await textChannel.messages.fetch(player.nowPlayingMessageId).catch(() => null);
                if (msg) await msg.delete().catch(() => {});
            } catch {}
            player.nowPlayingMessageId = null;
        }

        const embed = new EmbedBuilder()
            .setTitle('Queue Ended')
            .setDescription('The queue has finished. Use `/play` to add more songs!')
            .setColor('#8A2BE2')
            .setTimestamp();

        textChannel.send({ embeds: [embed] });
    }
};
