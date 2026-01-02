const { createCanvas, loadImage } = require('@napi-rs/canvas');
const axios = require('axios');

const LRCLIB_URL = 'https://lrclib.net/api';
const TRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single';

async function getSyncedLyrics(trackName, artistName) {
    try {
        const params = new URLSearchParams({
            track_name: trackName,
            artist_name: artistName,
        });

        const res = await axios.get(`${LRCLIB_URL}/get?${params.toString()}`, {
            headers: { 'User-Agent': 'SuwakuBot/1.0.0' },
            timeout: 10000
        });

        if (res.data?.syncedLyrics) {
            return parseLRC(res.data.syncedLyrics);
        } else if (res.data?.plainLyrics) {
            return parsePlainLyrics(res.data.plainLyrics);
        }
        return [];
    } catch (err) {
        console.error('LRCLIB Error:', err.message);
        return [];
    }
}

function parseLRC(lrc) {
    const lines = lrc.split('\n');
    const lyrics = [];
    const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

    for (const line of lines) {
        const match = line.match(regex);
        if (match) {
            const mins = parseInt(match[1], 10);
            const secs = parseInt(match[2], 10);
            const ms = parseInt(match[3].padEnd(3, '0'), 10);
            const startTime = mins * 60 + secs + ms / 1000;
            const text = line.replace(regex, '').trim();

            if (text) {
                lyrics.push({ original: text, translation: '', startTime, endTime: 0 });
            }
        }
    }

    for (let i = 0; i < lyrics.length - 1; i++) {
        lyrics[i].endTime = lyrics[i + 1].startTime;
    }
    if (lyrics.length > 0) {
        lyrics[lyrics.length - 1].endTime = lyrics[lyrics.length - 1].startTime + 10;
    }

    return lyrics;
}

function parsePlainLyrics(plain) {
    const lines = plain.split('\n').filter(l => l.trim());
    return lines.map((line, i) => ({
        original: line.trim(),
        translation: '',
        startTime: i * 4,
        endTime: (i + 1) * 4
    }));
}

async function translateText(text, lang = 'pt') {
    try {
        const res = await axios.get(TRANSLATE_URL, {
            params: { client: 'gtx', sl: 'auto', tl: lang, dt: 't', q: text },
            timeout: 5000
        });
        if (res.data?.[0]) {
            return res.data[0].map(x => x[0]).join('');
        }
        return text;
    } catch {
        return text;
    }
}

async function translateLyrics(lyrics, lang = 'pt') {
    const result = [];
    for (const lyric of lyrics) {
        try {
            const translation = await translateText(lyric.original, lang);
            result.push({ ...lyric, translation });
            await new Promise(r => setTimeout(r, 100));
        } catch {
            result.push({ ...lyric, translation: '' });
        }
    }
    return result;
}

async function getLyricsWithTranslations(trackName, artistName, lang = 'pt') {
    const lyrics = await getSyncedLyrics(trackName, artistName);
    if (lyrics.length === 0) {
        return [{ original: 'No lyrics available', translation: 'Letras não disponíveis', startTime: 0, endTime: 999 }];
    }
    return await translateLyrics(lyrics, lang);
}

function getCurrentLyricIndex(lyrics, time) {
    for (let i = lyrics.length - 1; i >= 0; i--) {
        if (lyrics[i].startTime <= time) return i;
    }
    return 0;
}

function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

async function loadImg(src) {
    try {
        if (Buffer.isBuffer(src)) {
            return await loadImage(src);
        } else if (typeof src === 'string' && src.startsWith('http')) {
            const res = await axios.get(src, { responseType: 'arraybuffer', timeout: 10000 });
            return await loadImage(Buffer.from(res.data));
        } else if (src) {
            return await loadImage(src);
        }
    } catch (e) {
        console.error('Error loading image:', e.message);
    }
    return null;
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function truncate(ctx, text, max) {
    if (ctx.measureText(text).width <= max) return text;
    let t = text;
    while (ctx.measureText(t + '...').width > max && t.length > 0) {
        t = t.slice(0, -1);
    }
    return t + '...';
}

function getVisibleLyrics(lyrics, idx, count = 5) {
    if (lyrics.length === 0) {
        return [{ original: 'No lyrics available', translation: '', isCurrent: true }];
    }

    const result = [];
    const half = Math.floor(count / 2);
    let start = idx - half;

    if (start < 0) start = 0;
    if (start + count > lyrics.length) {
        start = Math.max(0, lyrics.length - count);
    }

    for (let i = start; i < Math.min(start + count, lyrics.length); i++) {
        result.push({ ...lyrics[i], isCurrent: i === idx });
    }

    return result;
}

async function generateSuwakuCard(opts = {}) {
    const {
        songName = 'Unknown',
        artistName = 'Unknown',
        albumArt = null,
        isExplicit = false,
        progress = 0,
        currentTime = '0:00',
        totalTime = '0:00',
        lyrics = [],
        currentLyricIndex = 0
    } = opts;

    const w = 680, h = 340, radius = 18;
    const canvas = createCanvas(w, h);
    const ctx = canvas.getContext('2d');

    const albumImg = await loadImg(albumArt);

    ctx.save();
    roundRect(ctx, 0, 0, w, h, radius);
    ctx.clip();

    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, w, h);

    if (albumImg) {
        const blur = createCanvas(w, h);
        const bctx = blur.getContext('2d');
        const size = h * 1.8;
        bctx.drawImage(albumImg, 120, -80, size, size);

        ctx.globalAlpha = 0.55;
        for (let i = 0; i < 30; i++) {
            const ox = (Math.random() - 0.5) * 25;
            const oy = (Math.random() - 0.5) * 25;
            ctx.drawImage(blur, ox, oy);
        }
        ctx.globalAlpha = 1;
    }

    const dark = ctx.createLinearGradient(0, 0, w, 0);
    dark.addColorStop(0, 'rgba(18, 18, 18, 1)');
    dark.addColorStop(0.25, 'rgba(18, 18, 18, 0.9)');
    dark.addColorStop(0.5, 'rgba(18, 18, 18, 0.5)');
    dark.addColorStop(0.75, 'rgba(18, 18, 18, 0.2)');
    dark.addColorStop(1, 'rgba(18, 18, 18, 0.1)');
    ctx.fillStyle = dark;
    ctx.fillRect(0, 0, w, h);

    const warm = ctx.createRadialGradient(w * 0.7, h * 0.5, 0, w * 0.7, h * 0.5, 450);
    warm.addColorStop(0, 'rgba(255, 140, 50, 0.35)');
    warm.addColorStop(0.3, 'rgba(255, 110, 40, 0.25)');
    warm.addColorStop(0.6, 'rgba(255, 90, 30, 0.15)');
    warm.addColorStop(1, 'rgba(200, 80, 20, 0.05)');
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, w, h);

    const artSize = 150, artX = 30, artY = 45, artR = 12;

    if (albumImg) {
        ctx.save();
        roundRect(ctx, artX, artY, artSize, artSize, artR);
        ctx.clip();
        ctx.drawImage(albumImg, artX, artY, artSize, artSize);
        ctx.restore();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        roundRect(ctx, artX, artY, artSize, artSize, artR);
        ctx.stroke();
    } else {
        ctx.fillStyle = '#2a2a2a';
        roundRect(ctx, artX, artY, artSize, artSize, artR);
        ctx.fill();
    }

    const infoY = artY + artSize + 18;

    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#FFFFFF';
    const song = truncate(ctx, songName, artSize - 30);
    ctx.fillText(song, artX, infoY);

    if (isExplicit) {
        const sw = ctx.measureText(song).width;
        ctx.fillStyle = 'rgba(180, 180, 180, 0.9)';
        roundRect(ctx, artX + sw + 6, infoY - 11, 18, 14, 3);
        ctx.fill();
        ctx.font = 'bold 9px Arial';
        ctx.fillStyle = '#000';
        ctx.fillText('E', artX + sw + 11, infoY - 1);
    }

    ctx.font = '13px Arial';
    ctx.fillStyle = 'rgba(180, 180, 180, 0.9)';
    ctx.fillText(truncate(ctx, artistName, artSize), artX, infoY + 18);

    const lyricsX = 210, lyricsY = 40, lineH = 48;
    const lyricsW = w - lyricsX - 30;
    const visible = getVisibleLyrics(lyrics, currentLyricIndex, 5);

    visible.forEach((lyric, i) => {
        const y = lyricsY + (i * lineH);

        if (lyric.isCurrent) {
            ctx.font = 'bold 18px Arial';
            ctx.fillStyle = '#FFFFFF';
        } else {
            ctx.font = '15px Arial';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        }

        ctx.fillText(truncate(ctx, lyric.original, lyricsW), lyricsX, y);

        if (lyric.translation) {
            ctx.font = lyric.isCurrent ? '12px Arial' : '11px Arial';
            ctx.fillStyle = lyric.isCurrent ? 'rgba(255, 180, 100, 0.85)' : 'rgba(255, 180, 100, 0.35)';
            ctx.fillText(truncate(ctx, lyric.translation, lyricsW), lyricsX, y + 17);
        }
    });

    const progY = h - 42, progX = 30, progW = w - 60, progH = 3;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    roundRect(ctx, progX, progY, progW, progH, 1.5);
    ctx.fill();

    const fill = Math.max(0, (progress / 100) * progW);
    if (fill > 0) {
        ctx.fillStyle = '#FFFFFF';
        roundRect(ctx, progX, progY, fill, progH, 1.5);
        ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(progX + fill, progY + 1.5, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(currentTime, progX, progY + 20);

    const endText = '-' + totalTime;
    ctx.fillText(endText, progX + progW - ctx.measureText(endText).width, progY + 20);

    ctx.restore();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    roundRect(ctx, 0.5, 0.5, w - 1, h - 1, radius);
    ctx.stroke();

    return canvas.toBuffer('image/png');
}

module.exports = {
    generateSuwakuCard,
    getLyricsWithTranslations,
    getCurrentLyricIndex,
    formatTime
};
