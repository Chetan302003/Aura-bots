import { Events, Interaction } from 'discord.js';
import { ClientWithCommands } from '../types';
import { handleButtonInteraction } from '../handlers/buttonHandler';

export default {
    name: Events.InteractionCreate,
    async execute(interaction: Interaction, client: ClientWithCommands) {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
        } else if (interaction.isButton()) {
            try {
                await handleButtonInteraction(interaction);
            } catch (error) {
                console.error('Button Interaction Error:', error);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: 'An error occurred while processing this button.', ephemeral: true });
                }
            }
        } else if (interaction.isModalSubmit()) {
            try {
                const { handleModalInteraction } = await import('../handlers/modalHandler');
                await handleModalInteraction(interaction);
            } catch (error) {
                console.error('Modal Interaction Error:', error);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: 'An error occurred while processing this modal.', ephemeral: true });
                }
            }
        }
    }
};
