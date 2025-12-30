const { Bloom, initializeFonts } = require('musicard');
const { formatDuration } = require('./formatDuration');

let fontsInitialized = false;

async function initFonts() {
    if (!fontsInitialized) {
        await initializeFonts();
        fontsInitialized = true;
    }
}

async function generateCard(track, currentPosition) {
    const trackTitle = track.title || 'Unknown';
    const trackAuthor = track.author || 'Unknown';
    const totalDuration = track.duration || 0;
    const progress = totalDuration > 0 ? Math.min(100, Math.floor((currentPosition / totalDuration) * 100)) : 0;

    const cardBuffer = await Bloom({
        trackName: trackTitle,
        artistName: trackAuthor,
        albumArt: track.thumbnail || track.artworkUrl || '',
        isExplicit: true,
        timeAdjust: {
            timeStart: formatDuration(currentPosition),
            timeEnd: formatDuration(totalDuration),
        },
        progressBar: progress,
        volumeBar: 80
    });

    return cardBuffer;
}

module.exports = { generateCard, initFonts };
