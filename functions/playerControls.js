const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const config = require('../config');

const CONTROLS = {
    pause_resume: {
        id: 'player_pause_resume',
        label: 'Pause',
        pausedLabel: 'Resume',
        emoji: '⏸️',
        pausedEmoji: '▶️',
        description: 'Pause or resume playback'
    },
    skip: {
        id: 'player_skip',
        label: 'Skip',
        emoji: '⏭️',
        description: 'Skip to next track'
    },
    stop: {
        id: 'player_stop',
        label: 'Stop',
        emoji: '⏹️',
        description: 'Stop playback and clear queue'
    },
    volume_down: {
        id: 'player_volume_down',
        label: '-10%',
        emoji: '🔉',
        description: 'Decrease volume by 10%'
    },
    volume_up: {
        id: 'player_volume_up',
        label: '+10%',
        emoji: '🔊',
        description: 'Increase volume by 10%'
    },
    shuffle: {
        id: 'player_shuffle',
        label: 'Shuffle',
        emoji: '🔀',
        description: 'Shuffle the queue'
    },
    loop: {
        id: 'player_loop',
        label: 'Loop',
        emoji: '🔁',
        description: 'Toggle loop mode'
    }
};

function createButtons(player) {
    const controlsConfig = config.PLAYER_CONTROLS.CONTROLS || ['pause_resume', 'skip', 'stop'];
    const rows = [];
    let currentRow = new ActionRowBuilder();
    let buttonCount = 0;

    for (const controlName of controlsConfig) {
        const control = CONTROLS[controlName];
        if (!control) continue;

        const isPaused = player.paused;
        const label = controlName === 'pause_resume' && isPaused ? control.pausedLabel : control.label;
        const emoji = controlName === 'pause_resume' && isPaused ? control.pausedEmoji : control.emoji;

        const button = new ButtonBuilder()
            .setCustomId(control.id)
            .setLabel(label)
            .setEmoji(emoji)
            .setStyle(controlName === 'stop' ? ButtonStyle.Danger : ButtonStyle.Secondary);

        currentRow.addComponents(button);
        buttonCount++;

        if (buttonCount === 5) {
            rows.push(currentRow);
            currentRow = new ActionRowBuilder();
            buttonCount = 0;
        }
    }

    if (buttonCount > 0) {
        rows.push(currentRow);
    }

    return rows;
}

function createMenu(player) {
    const controlsConfig = config.PLAYER_CONTROLS.CONTROLS || ['pause_resume', 'skip', 'stop'];
    const options = [];

    for (const controlName of controlsConfig) {
        const control = CONTROLS[controlName];
        if (!control) continue;

        const isPaused = player.paused;
        const label = controlName === 'pause_resume' && isPaused ? control.pausedLabel : control.label;
        const emoji = controlName === 'pause_resume' && isPaused ? control.pausedEmoji : control.emoji;

        options.push({
            label: label,
            description: control.description,
            value: control.id,
            emoji: emoji
        });
    }

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('player_controls_menu')
        .setPlaceholder('Select an action...')
        .addOptions(options);

    return [new ActionRowBuilder().addComponents(selectMenu)];
}

function createPlayerControls(player) {
    if (!config.PLAYER_CONTROLS.ENABLED) return [];

    const type = config.PLAYER_CONTROLS.TYPE || 'buttons';
    return type === 'menu' ? createMenu(player) : createButtons(player);
}

function getControlById(controlId) {
    for (const [name, control] of Object.entries(CONTROLS)) {
        if (control.id === controlId) {
            return { name, ...control };
        }
    }
    return null;
}

module.exports = { createPlayerControls, createButtons, createMenu, getControlById, CONTROLS };
