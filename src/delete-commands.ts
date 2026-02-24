import { REST, Routes } from 'discord.js';
import { config } from './config';

const rest = new REST({ version: '10' }).setToken(config.DISCORD_TOKEN);

(async () => {
    try {
        const clearGlobal = process.argv.includes('--global');

        if (clearGlobal) {
            console.log('Started deleting all GLOBAL application (/) commands...');
            await rest.put(
                Routes.applicationCommands(config.CLIENT_ID),
                { body: [] },
            );
            console.log('Successfully deleted all global commands.');
        } else {
            console.log(`Started deleting all GUILD application (/) commands for guild ${config.GUILD_ID}...`);
            await rest.put(
                Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID),
                { body: [] },
            );
            console.log('Successfully deleted all guild commands.');
        }
    } catch (error) {
        console.error(error);
    }
})();
