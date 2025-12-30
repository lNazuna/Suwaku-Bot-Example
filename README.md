# Suwaku Bot Example

<p align="center">
  <img src="https://i.imgur.com/ILu6IsH.png" alt="Suwaku Bot Logo">
</p>

Discord music bot using [Suwaku](https://www.npmjs.com/package/suwaku) (Lavalink client) with music cards via [musicard](https://www.npmjs.com/package/musicard).

## What it does

- Plays music from YouTube, SoundCloud, Spotify, etc
- Shows a music card with album art and progress bar
- Player controls (buttons or menu, configurable)
- Queue, shuffle, loop, filters, the usual stuff

## Setup

You'll need Node.js 16.9+, Java 17+ and a Lavalink v4 server running.

```bash
npm install
```

Copy `config.js.example` to `config.js` and add your bot token + lavalink info.

Start Lavalink first, then:

```bash
npm start
```

## Commands

- `/play <song>` - play something
- `/search <query>` - search tracks
- `/pause` `/resume` - toggle playback
- `/skip` - next track
- `/stop` - stop and clear queue
- `/volume <0-100>` - change volume
- `/ping` - latency check

## Player Controls

The now playing message has controls to pause/resume, skip, stop, change volume, etc.

You can switch between buttons and menu in `config.js`:

```javascript
PLAYER_CONTROLS: {
  ENABLED: true,
  TYPE: 'menu', // or 'buttons'
  CONTROLS: ['pause_resume', 'skip', 'stop', 'volume_down', 'volume_up', 'shuffle', 'loop']
}
```

## Structure

```
index.js          - entry point
config.js         - settings
commands/         - slash commands
events/           - discord events
functions/        - helpers (formatDuration, generateCard, playerControls, etc)
suwaku/           - player events (trackStart, trackEnd, etc)
schemas/          - mongodb stuff (optional)
```

## Troubleshooting

**"Music system not available"** - Lavalink probably isn't running or didn't connect. Check your config.

**Node won't connect** - Double check host/port/password in config matches your Lavalink application.yml

## Credits

- [Suwaku](https://github.com/shindozk/suwaku) by ShindoZk
- [musicard](https://github.com/kunalkandepatil/musicard) for the cards
- Based on Yukufy Bot by [lNazuna](https://github.com/lNazuna)

MIT License
