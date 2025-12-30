const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

async function loadSuwaku(client) {
    console.log(chalk.blue.bold('INFO: ') + "INITIATING SUWAKU");

    const suwakuPath = path.join(__dirname, '..', 'suwaku');

    if (!fs.existsSync(suwakuPath)) {
        fs.mkdirSync(suwakuPath, { recursive: true });
    }

    const suwakuFiles = fs.readdirSync(suwakuPath).filter(file => file.endsWith('.js'));

    for (const file of suwakuFiles) {
        try {
            const filePath = path.join(suwakuPath, file);
            const event = require(filePath);

            if (event.name && typeof event.name !== 'string') {
                console.log(chalk.red.bold('ERROR: ') + `Couldn't load the suwaku event ${file}, error: Property name should be string.`);
                continue;
            }

            event.name = event.name || file.replace('.js', '');

            const suwaku = client.suwaku || global.suwaku;
            if (suwaku && typeof event.execute === 'function') {
                suwaku.on(event.name, (...args) => event.execute(...args, client));
            }

            console.log(chalk.blue.bold('INFO: ') + `[SUWAKU] Loaded ${event.name}`);
        } catch (err) {
            console.log(chalk.red.bold('ERROR: ') + `Couldn't load the suwaku event ${file}`);
            console.error(err);
            continue;
        }
    }
}

module.exports = { loadSuwaku };
