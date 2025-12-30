const { SlashCommandBuilder, EmbedBuilder, REST, Routes } = require('discord.js');
const { TOKEN } = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear-commands')
        .setDescription('Remove all registered commands (Owner only)')
        .addStringOption(option =>
            option.setName('scope')
                .setDescription('Where to clear commands')
                .setRequired(true)
                .addChoices(
                    { name: 'Guild (this server only)', value: 'guild' },
                    { name: 'Global (all servers)', value: 'global' },
                    { name: 'Both (guild + global)', value: 'both' }
                )
        ),
    ownerOnly: true,

    async execute(interaction, client) {
        await interaction.deferReply({ ephemeral: true });

        const scope = interaction.options.getString('scope');
        const rest = new REST({ version: '10' }).setToken(TOKEN);
        const clientId = client.user.id;
        const guildId = interaction.guildId;

        const results = [];

        try {
            // Clear guild commands
            if (scope === 'guild' || scope === 'both') {
                await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });
                results.push(`Guild commands cleared for **${interaction.guild.name}**`);
            }

            // Clear global commands
            if (scope === 'global' || scope === 'both') {
                await rest.put(Routes.applicationCommands(clientId), { body: [] });
                results.push('Global commands cleared');
            }

            const successEmbed = new EmbedBuilder()
                .setTitle('Commands Cleared')
                .setDescription(results.join('\n'))
                .setColor('#4CAF50')
                .setTimestamp()
                .setFooter({ text: `Requested by ${interaction.user.username}` });

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Clear commands error:', error);

            const errorEmbed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription(`Failed to clear commands: ${error.message}`)
                .setColor('#FF0000')
                .setTimestamp()
                .setFooter({ text: `Requested by ${interaction.user.username}` });

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
};
