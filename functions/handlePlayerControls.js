const { AttachmentBuilder } = require('discord.js');
const { createPlayerControls } = require('./playerControls');
const { generateCard, initFonts } = require('./generateCard');

async function handlePlayerControls(interaction, client) {
    const customId = interaction.customId;
    if (!customId.startsWith('player_')) return false;

    const suwaku = client.suwaku || global.suwaku;
    if (!suwaku) {
        await interaction.reply({ content: 'Music system not available!', ephemeral: true });
        return true;
    }

    const player = suwaku.getPlayer(interaction.guildId);
    if (!player) {
        await interaction.reply({ content: 'No music is currently playing!', ephemeral: true });
        return true;
    }

    const memberVoice = interaction.member.voice.channel;
    const botVoice = interaction.guild.members.me.voice.channel;

    if (!memberVoice || (botVoice && memberVoice.id !== botVoice.id)) {
        await interaction.reply({ content: 'You need to be in the same voice channel!', ephemeral: true });
        return true;
    }

    let actionId = customId;
    if (customId === 'player_controls_menu') {
        actionId = interaction.values[0];
    }

    try {
        let responseMessage = '';

        switch (actionId) {
            case 'player_pause_resume':
                if (player.paused) {
                    player.resume();
                    responseMessage = '▶️ Playback resumed';
                } else {
                    player.pause();
                    responseMessage = '⏸️ Playback paused';
                }
                break;

            case 'player_skip':
                if (player.nowPlayingMessageId) {
                    try {
                        const ch = client.channels.cache.get(player.nowPlayingChannelId || interaction.channelId);
                        if (ch) {
                            const m = await ch.messages.fetch(player.nowPlayingMessageId).catch(() => null);
                            if (m) await m.delete().catch(() => {});
                        }
                    } catch {}
                    player.nowPlayingMessageId = null;
                }
                if (player.progressInterval) {
                    clearInterval(player.progressInterval);
                    player.progressInterval = null;
                }
                await player.skip();
                responseMessage = '⏭️ Skipped to next track';
                break;

            case 'player_stop':
                if (player.nowPlayingMessageId) {
                    try {
                        const ch = client.channels.cache.get(player.nowPlayingChannelId || interaction.channelId);
                        if (ch) {
                            const m = await ch.messages.fetch(player.nowPlayingMessageId).catch(() => null);
                            if (m) await m.delete().catch(() => {});
                        }
                    } catch {}
                    player.nowPlayingMessageId = null;
                }
                if (player.progressInterval) {
                    clearInterval(player.progressInterval);
                    player.progressInterval = null;
                }
                await player.stop();
                await player.destroy();
                responseMessage = '⏹️ Playback stopped';
                break;

            case 'player_volume_down':
                const newVolDown = Math.max(0, (player.volume || 80) - 10);
                await player.setVolume(newVolDown);
                responseMessage = `🔉 Volume: ${newVolDown}%`;
                break;

            case 'player_volume_up':
                const newVolUp = Math.min(100, (player.volume || 80) + 10);
                await player.setVolume(newVolUp);
                responseMessage = `🔊 Volume: ${newVolUp}%`;
                break;

            case 'player_shuffle':
                if (player.queue && typeof player.queue.shuffle === 'function') {
                    player.queue.shuffle();
                    responseMessage = '🔀 Queue shuffled';
                } else {
                    responseMessage = '🔀 Shuffle not available';
                }
                break;

            case 'player_loop':
                const currentLoop = player.loop || 'none';
                let newLoop, loopEmoji;

                if (currentLoop === 'none') {
                    newLoop = 'track';
                    loopEmoji = '🔂';
                    responseMessage = `${loopEmoji} Looping current track`;
                } else if (currentLoop === 'track') {
                    newLoop = 'queue';
                    loopEmoji = '🔁';
                    responseMessage = `${loopEmoji} Looping queue`;
                } else {
                    newLoop = 'none';
                    loopEmoji = '➡️';
                    responseMessage = `${loopEmoji} Loop disabled`;
                }

                player.setLoop(newLoop);
                break;

            default:
                responseMessage = 'Unknown action';
        }

        if (actionId !== 'player_stop' && player.nowPlayingMessageId) {
            try {
                const channel = client.channels.cache.get(player.nowPlayingChannelId || interaction.channelId);
                if (channel) {
                    const msg = await channel.messages.fetch(player.nowPlayingMessageId).catch(() => null);
                    if (msg) {
                        const updatedControls = createPlayerControls(player);
                        try {
                            await initFonts();
                            const currentPosition = player.position || 0;
                            const cardBuffer = await generateCard(player.currentTrack, currentPosition);
                            const attachment = new AttachmentBuilder(cardBuffer, { name: 'nowplaying.png' });
                            await msg.edit({ files: [attachment], components: updatedControls });
                        } catch {
                            await msg.edit({ components: updatedControls });
                        }
                    }
                }
            } catch (error) {
                console.error('Error updating message:', error.message);
            }
        }

        await interaction.reply({ content: responseMessage, ephemeral: true });

    } catch (error) {
        console.error('Error handling control:', error);
        await interaction.reply({ content: `Error: ${error.message}`, ephemeral: true });
    }

    return true;
}

module.exports = { handlePlayerControls };
