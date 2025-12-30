const chalk = require('chalk');

module.exports = {
    name: 'error',
    async execute(error, client) {
        if (!error) {
            console.error(chalk.red.bold('ERROR: ') + '[Suwaku] Unknown error (no error object provided)');
            return;
        }

        console.error(chalk.red.bold('ERROR: ') + `[Suwaku] ${error.message || error}`);

        if (error.stack) {
            console.error(error.stack);
        }
    }
};
