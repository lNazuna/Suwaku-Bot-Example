const chalk = require('chalk');

module.exports = {
    name: 'nodeDisconnect',
    async execute(node, data, client) {
        console.warn(chalk.yellow.bold('WARNING: ') + `[Suwaku] Node ${node.identifier} disconnected`);

        if (data) {
            console.warn(chalk.yellow.bold('WARNING: ') + `[Suwaku] Disconnect reason: ${data.reason || 'Unknown'}`);
        }
    }
};
