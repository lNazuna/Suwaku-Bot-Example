require('dotenv').config();
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { Client, Collection, GatewayIntentBits, Partials, REST, Routes } = require('discord.js');
const { TOKEN, GUILD_ID, LAVALINK } = require('./config');
const { antiCrash } = require('./functions/antiCrash');
const { loadSuwaku } = require('./functions/loadSuwaku');
const { SuwakuClient } = require('suwaku');
antiCrash();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User,
    Partials.GuildMember
  ]
});

const suwaku = new SuwakuClient(client, {
  nodes: LAVALINK.NODES,
  defaultVolume: LAVALINK.DEFAULT_VOLUME,
  autoLeave: LAVALINK.AUTO_LEAVE,
  autoLeaveDelay: LAVALINK.AUTO_LEAVE_DELAY,
  enableSearchCache: LAVALINK.ENABLE_SEARCH_CACHE,
  searchCacheSize: LAVALINK.SEARCH_CACHE_SIZE,
  searchCacheTTL: LAVALINK.SEARCH_CACHE_TTL,
  searchEngine: LAVALINK.SEARCH_ENGINE,
  retryOnStuck: LAVALINK.RETRY_ON_STUCK,
  loadBalancer: LAVALINK.LOAD_BALANCER,
  enableHealthMonitor: LAVALINK.ENABLE_HEALTH_MONITOR,
  healthCheckInterval: LAVALINK.HEALTH_CHECK_INTERVAL,
  historySize: LAVALINK.HISTORY_SIZE,
  enableFilters: LAVALINK.ENABLE_FILTERS
});

global.suwaku = suwaku;
client.suwaku = suwaku;
loadSuwaku(client);

client.commands = new Collection();
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);

const log = (message, type = 'INFO') => {
    const colors = {
        INFO: chalk.blue.bold('INFO:'),
        SUCCESS: chalk.green.bold('SUCCESS:'),
        ERROR: chalk.red.bold('ERROR:'),
        WARNING: chalk.yellow.bold('WARNING:')
    };
    console.log(colors[type] + ' ' + message);
};

for (const folder of commandFolders) {
  const folderPath = path.join(commandsPath, folder);
  const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(folderPath, file);
    const command = require(filePath);
    if (!command.data || !command.data.name || typeof command.data.name !== 'string') {
        log(`The command file "${file}" is missing a valid name property.`, 'ERROR');
        continue;
    }
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  }
}

const eventsPath = path.join(__dirname, 'events');
const eventFolders = fs.readdirSync(eventsPath);

for (const folder of eventFolders) {
  const folderPath = path.join(eventsPath, folder);
  const eventFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
  for (const file of eventFiles) {
    const filePath = path.join(folderPath, file);
    const event = require(filePath);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
    console.log(chalk.green.bold('SUCCESS: ') + `Loaded event: ${chalk.cyan.bold(event.name)} from ${chalk.yellow(file)}`);
  }
}

const schemasPath = path.join(__dirname, 'schemas');
const schemaFiles = fs.readdirSync(schemasPath).filter(file => file.endsWith('.js'));
for (const file of schemaFiles) {
  const filePath = path.join(schemasPath, file);
  require(filePath);
  console.log(chalk.green.bold('SUCCESS: ') + `Loaded schema from ${chalk.yellow(file)}`);
}

client.once('clientReady', async () => {
  console.log(chalk.green.bold('SUCCESS: ') + `Bot ${client.user.tag} logged in successfully!`);

  await suwaku.init();
  console.log(chalk.green.bold('SUCCESS: ') + 'Suwaku initialized and connected to Lavalink!');

  const CLIENT_ID = client.user.id;
  const rest = new REST({ version: '10' }).setToken(TOKEN);

  if (GUILD_ID) {
    const guildId = GUILD_ID;
    try {
      const guild = await client.guilds.fetch(guildId);
      console.log(chalk.green.bold('SUCCESS: ') + `Registering commands for guild ${guild.name} (${guildId})`);
      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, guildId),
        { body: commands }
      );
      console.log(chalk.green.bold('SUCCESS: ') + 'Successfully registered application commands for single guild.');
    } catch (error) {
      console.error(error);
    }
  } else {
    try {
      console.log(chalk.green.bold('SUCCESS: ') + 'Registering global commands');
      await rest.put(
        Routes.applicationCommands(CLIENT_ID),
        { body: commands }
      );
      console.log(chalk.green.bold('SUCCESS: ') + 'Successfully registered global application commands.');
    } catch (error) {
      console.error(error);
    }
  }
});

client.login(TOKEN);
