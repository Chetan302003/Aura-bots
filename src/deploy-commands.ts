import { REST, Routes } from 'discord.js';
import { config } from './config';
import fs from 'fs';
import path from 'path';

const commands: any[] = [];
// Grab all the command files from the commands directory you created earlier
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath).default;
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(config.DISCORD_TOKEN);

// and deploy your commands!
(async () => {
    try {
        const isGlobal = process.argv.includes('--global');
        const isClear = process.argv.includes('--clear');

        if (isGlobal) {
            console.log(`${isClear ? 'Clearing' : 'Refreshing'} ${isClear ? '' : commands.length} application (/) commands GLOBALLY.`);
            const data: any = await rest.put(
                Routes.applicationCommands(config.CLIENT_ID),
                { body: isClear ? [] : commands },
            );
            console.log(`Successfully ${isClear ? 'cleared' : 'reloaded'} global application (/) commands.`);
        } else {
            console.log(`${isClear ? 'Clearing' : 'Refreshing'} ${isClear ? '' : commands.length} application (/) commands to GUILD ${config.GUILD_ID}.`);
            const data: any = await rest.put(
                Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID),
                { body: isClear ? [] : commands },
            );
            console.log(`Successfully ${isClear ? 'cleared' : 'reloaded'} local application (/) commands.`);
        }
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
    }
})();
