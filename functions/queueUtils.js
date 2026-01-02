const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const TRACKS_PER_PAGE = 5;

function formatDuration(ms) {
    if (!ms) return '0:00';
    const secs = Math.floor((ms / 1000) % 60);
    const mins = Math.floor((ms / (1000 * 60)) % 60);
    const hrs = Math.floor(ms / (1000 * 60 * 60));
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getTotalDuration(tracks) {
    return tracks.reduce((acc, track) => acc + (track.duration || 0), 0);
}

function buildQueueEmbed(player, page, totalPages) {
    const queue = player.queue;
    const current = player.currentTrack || queue?.current;
    const tracks = queue?.tracks || [];

    const start = page * TRACKS_PER_PAGE;
    const end = start + TRACKS_PER_PAGE;
    const pageTracks = tracks.slice(start, end);

    const embed = new EmbedBuilder()
        .setTitle('🎵 Music Queue')
        .setColor('#8A2BE2')
        .setTimestamp();

    if (current) {
        const position = player.position || 0;
        const duration = current.duration || 0;
        const progress = duration > 0 ? Math.floor((position / duration) * 15) : 0;
        const bar = '▬'.repeat(progress) + '🔘' + '▬'.repeat(15 - progress);

        embed.addFields({
            name: '▶️ Now Playing',
            value: `**[${current.title}](${current.url})**\n` +
                   `${current.author || 'Unknown'}\n` +
                   `${bar}\n` +
                   `\`${formatDuration(position)}\` / \`${formatDuration(duration)}\``,
            inline: false
        });
    }

    if (pageTracks.length > 0) {
        const queueList = pageTracks.map((track, i) => {
            const pos = start + i + 1;
            const title = track.title.length > 40 ? track.title.substring(0, 40) + '...' : track.title;
            const author = track.author?.length > 20 ? track.author.substring(0, 20) + '...' : (track.author || '?');
            return `\`${pos}.\` **${title}**\n╰ ${author} • \`${formatDuration(track.duration)}\` • <@${track.requester?.user?.id || track.requester?.id || '0'}>`;
        }).join('\n\n');

        embed.addFields({
            name: `📋 Up Next (${tracks.length} songs)`,
            value: queueList || 'Empty',
            inline: false
        });
    } else if (!current) {
        embed.setDescription('📭 Queue is empty! Use `/play` to add songs.');
    }

    const loopMode = player.loop || 'off';
    const loopEmoji = loopMode === 'track' ? '🔂' : loopMode === 'queue' ? '🔁' : '➡️';
    const totalDuration = getTotalDuration(tracks);
    const vol = player.volume ?? 80;

    embed.setFooter({
        text: `Page ${page + 1}/${totalPages || 1} • ${tracks.length} songs • ${formatDuration(totalDuration)} total • ${loopEmoji} ${loopMode} • 🔊 ${vol}%`
    });

    return embed;
}

function buildQueueButtons(page, totalPages, disabled = false) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('queue_first')
            .setEmoji('⏮️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled || page === 0),
        new ButtonBuilder()
            .setCustomId('queue_prev')
            .setEmoji('◀️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled || page === 0),
        new ButtonBuilder()
            .setCustomId('queue_page')
            .setLabel(`${page + 1}/${totalPages}`)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId('queue_next')
            .setEmoji('▶️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled || page >= totalPages - 1),
        new ButtonBuilder()
            .setCustomId('queue_last')
            .setEmoji('⏭️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled || page >= totalPages - 1)
    );
}

module.exports = {
    TRACKS_PER_PAGE,
    formatDuration,
    getTotalDuration,
    buildQueueEmbed,
    buildQueueButtons
};
