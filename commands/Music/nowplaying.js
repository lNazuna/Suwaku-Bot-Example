const { SlashCommandBuilder, AttachmentBuilder, MessageFlags } = require('discord.js');
const { generateSuwakuCard, getLyricsWithTranslations, getCurrentLyricIndex, formatTime } = require('../../functions/suwakuCard');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Show the currently playing song with lyrics')
        .addStringOption(option =>
            option.setName('language')
                .setDescription('Language for lyrics translation')
                .setRequired(false)
                .addChoices(
                    { name: 'Portuguese', value: 'pt' },
                    { name: 'English', value: 'en' },
                    { name: 'Spanish', value: 'es' },
                    { name: 'French', value: 'fr' },
                    { name: 'German', value: 'de' },
                    { name: 'Japanese', value: 'ja' },
                    { name: 'Korean', value: 'ko' }
                )
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

        const track = player.currentTrack || player.queue?.current;
        if (!track) {
            return interaction.reply({ content: '❌ No song is currently playing!', flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply();

        try {
            const lang = interaction.options.getString('language') || 'pt';
            const songName = track.title || 'Unknown';
            const artistName = track.author || 'Unknown';
            const albumArt = track.thumbnail || track.artworkUrl || null;
            const duration = track.duration || 0;
            const position = player.position || 0;

            const progress = duration > 0 ? (position / duration) * 100 : 0;
            const currentSecs = Math.floor(position / 1000);
            const totalSecs = Math.floor(duration / 1000);

            let lyrics = [];
            let lyricIdx = 0;

            try {
                lyrics = await getLyricsWithTranslations(songName, artistName, lang);
                lyricIdx = getCurrentLyricIndex(lyrics, currentSecs);
            } catch (e) {
                console.error('[NowPlaying] Lyrics error:', e.message);
                lyrics = [{ original: 'No lyrics available', translation: 'Letras não disponíveis', startTime: 0, endTime: 999 }];
            }

            const buffer = await generateSuwakuCard({
                songName,
                artistName,
                albumArt,
                isExplicit: false,
                progress,
                currentTime: formatTime(currentSecs),
                totalTime: formatTime(totalSecs),
                lyrics,
                currentLyricIndex: lyricIdx
            });

            const attachment = new AttachmentBuilder(buffer, { name: 'nowplaying.png' });
            await interaction.editReply({ files: [attachment] });

        } catch (err) {
            console.error('[NowPlaying] Error:', err);
            await interaction.editReply({ content: '❌ Could not generate now playing card' });
        }
    }
};
