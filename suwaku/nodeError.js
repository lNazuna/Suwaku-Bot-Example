const chalk = require('chalk');

module.exports = {
    name: 'nodeError',
    async execute(node, error, client) {
        console.error(chalk.red.bold('ERROR: ') + `[Suwaku] Node "${node.identifier}" error: ${error.message || 'Unknown error'}`);

        if (error.stack) {
            console.error(error.stack);
        }
    }
};
