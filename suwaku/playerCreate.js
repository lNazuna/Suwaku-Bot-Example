const chalk = require('chalk');

module.exports = {
    name: 'playerCreate',
    async execute(player, client) {
        console.log(chalk.blue.bold('INFO: ') + `[Suwaku] Player created for guild ${player.guildId}`);
    }
};
