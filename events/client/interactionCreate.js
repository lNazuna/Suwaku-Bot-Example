const { EmbedBuilder, MessageFlags, Collection } = require("discord.js");
const chalk = require("chalk");
const { OWNER_ID, LOGS } = require('../../config');
const { handlePlayerControls } = require('../../functions/handlePlayerControls');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (interaction.isButton()) {
            try {
                const handled = await handlePlayerControls(interaction, client);
                if (handled) return;
            } catch (error) {
                console.error(chalk.red('Button error:'), error);
            }
            return;
        }

        if (interaction.isStringSelectMenu()) {
            try {
                const handled = await handlePlayerControls(interaction, client);
                if (handled) return;
            } catch (error) {
                console.error(chalk.red('Menu error:'), error);
            }
            return;
        }

        if (interaction.isAutocomplete()) {
            const command = client.commands.get(interaction.commandName);
            if (!command || !command.autocomplete) return;

            try {
                await command.autocomplete(interaction, client);
            } catch (error) {
                console.error(chalk.red(`Autocomplete error: ${interaction.commandName}`), error);
            }
            return;
        }

        if (!interaction.isCommand()) return;

        const command = client.commands.get(interaction.commandName);
        if (!command) {
            console.log(chalk.yellow(`Command "${interaction.commandName}" not found.`));
            return;
        }

        if (command.ownerOnly && interaction.user.id !== OWNER_ID) {
            return interaction.reply({
                embeds: [new EmbedBuilder().setColor('Blue').setDescription('`❌` | This command is owner-only.')],
                flags: MessageFlags.Ephemeral
            });
        }

        if (command.userPermissions) {
            const missing = command.userPermissions.filter(p => !interaction.member.permissions.has(p));
            if (missing.length) {
                return interaction.reply({
                    embeds: [new EmbedBuilder().setColor('Blue').setDescription(`\`❌\` | Missing permissions: \`${missing.join(", ")}\``)],
                    flags: MessageFlags.Ephemeral
                });
            }
        }

        if (command.botPermissions) {
            const missing = command.botPermissions.filter(p => !interaction.guild.members.me.permissions.has(p));
            if (missing.length) {
                return interaction.reply({
                    embeds: [new EmbedBuilder().setColor('Blue').setDescription(`\`❌\` | I need permissions: \`${missing.join(", ")}\``)],
                    flags: MessageFlags.Ephemeral
                });
            }
        }

        if (!client.cooldowns) client.cooldowns = new Collection();
        const now = Date.now();
        const cooldownAmount = (command.cooldown || 3) * 1000;

        if (!client.cooldowns.has(command.data.name)) {
            client.cooldowns.set(command.data.name, new Collection());
        }

        const timestamps = client.cooldowns.get(command.data.name);
        const userCooldown = timestamps.get(interaction.user.id);

        if (userCooldown) {
            const expirationTime = userCooldown + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return interaction.reply({
                    embeds: [new EmbedBuilder().setColor('Blue').setDescription(`\`❌\` | Wait **${timeLeft.toFixed(1)}s** before reusing.`)],
                    flags: MessageFlags.Ephemeral
                });
            }
        }

        timestamps.set(interaction.user.id, now);
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

        try {
            await command.execute(interaction, client);

            if (LOGS.COMMANDS) {
                const logsChannel = client.channels.cache.get(LOGS.COMMANDS);
                if (logsChannel) {
                    await logsChannel.send({
                        embeds: [new EmbedBuilder()
                            .setColor('#0099ff')
                            .setTitle('Command Executed')
                            .addFields(
                                { name: 'User', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                                { name: 'Command', value: `/${command.data.name}`, inline: true },
                                { name: 'Server', value: `${interaction.guild.name} (${interaction.guild.id})`, inline: true }
                            )
                            .setTimestamp()]
                    });
                }
            }
        } catch (error) {
            console.error(chalk.red(`Error: ${command.data.name}`), error);
            await interaction.reply({ content: 'Error executing command!', flags: MessageFlags.Ephemeral });
        }
    }
};
