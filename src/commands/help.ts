import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { ClientWithCommands } from '../types';

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('List all available bot commands'),
    async execute(interaction: ChatInputCommandInteraction, client: ClientWithCommands) {
        const embed = new EmbedBuilder()
            .setTitle('Aura Bot Commands')
            .setColor('#2F3136')
            .setDescription('Here is a list of all available commands:');

        client.commands.forEach((cmd) => {
            embed.addFields({ name: `/${cmd.data.name}`, value: cmd.data.description || 'No description provided.', inline: false });
        });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
