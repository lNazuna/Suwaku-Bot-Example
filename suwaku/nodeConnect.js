const chalk = require('chalk');

module.exports = {
    name: 'nodeConnect',
    async execute(node, client) {
        console.log(chalk.green.bold('SUCCESS: ') + `[Suwaku] Node "${node.identifier}" connected successfully!`);
    }
};
