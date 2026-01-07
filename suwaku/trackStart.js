const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { generateCard, initFonts } = require('../functions/generateCard');
const { formatDuration } = require('../functions/formatDuration');
const { createPlayerControls } = require('../functions/playerControls');

module.exports = {
    name: 'trackStart',
    async execute(player, track, client) {
        const trackTitle = track.title || 'Unknown';
        const trackAuthor = track.author || 'Unknown';
        console.log(`[Suwaku] Playing: ${trackTitle} - ${trackAuthor} (${player.guildId})`);

        if (!client.channels.cache || !player.textChannelId) return;

        const textChannel = client.channels.cache.get(player.textChannelId);
        if (!textChannel) return;

        if (player.progressInterval) {
            clearInterval(player.progressInterval);
            player.progressInterval = null;
        }

        if (player.nowPlayingMessageId) {
            try {
                const oldChannel = client.channels.cache.get(player.nowPlayingChannelId || player.textChannelId);
                if (oldChannel) {
                    const oldMsg = await oldChannel.messages.fetch(player.nowPlayingMessageId).catch(() => null);
                    if (oldMsg) await oldMsg.delete().catch(() => {});
                }
            } catch {}
            player.nowPlayingMessageId = null;
        }

        try {
            await initFonts();

            const cardBuffer = await generateCard(track, 0);
            const attachment = new AttachmentBuilder(cardBuffer, { name: 'nowplaying.png' });
            const controls = createPlayerControls(player);

            const message = await textChannel.send({
                files: [attachment],
                components: controls
            });

            player.nowPlayingMessageId = message.id;
            player.nowPlayingChannelId = textChannel.id;
            player.currentTrack = track;

            player.progressInterval = setInterval(async () => {
                try {
                    if (!player || !player.playing || player.paused) return;

                    const currentPosition = player.position || 0;
                    const channel = client.channels.cache.get(player.nowPlayingChannelId);

                    if (!channel) {
                        clearInterval(player.progressInterval);
                        return;
                    }

                    const updatedCard = await generateCard(player.currentTrack, currentPosition);
                    const newAttachment = new AttachmentBuilder(updatedCard, { name: 'nowplaying.png' });
                    const updatedControls = createPlayerControls(player);

                    const msg = await channel.messages.fetch(player.nowPlayingMessageId).catch(() => null);
                    if (msg) {
                        await msg.edit({ files: [newAttachment], components: updatedControls });
                    } else {
                        clearInterval(player.progressInterval);
                    }
                } catch (error) {
                    console.error('[Suwaku] Error updating card:', error.message);
                }
            }, 10000);

        } catch (error) {
            console.error('[Suwaku] Card error, using embed:', error.message);

            const duration = track.duration ? formatDuration(track.duration) : 'Unknown';
            const thumbnail = track.thumbnail || null;
            const controls = createPlayerControls(player);

            const embed = new EmbedBuilder()
                .setTitle('Now Playing')
                .setDescription(`**${trackTitle}**\nby ${trackAuthor}`)
                .setColor('#8A2BE2')
                .setThumbnail(thumbnail)
                .addFields(
                    { name: 'Duration', value: duration, inline: true },
                    { name: 'Requested by', value: track.requester.username || 'Unknown', inline: true }
                )
                .setTimestamp();

            const message = await textChannel.send({ embeds: [embed], components: controls });
            player.nowPlayingMessageId = message.id;
        }
    }
};
