import { Client, GatewayIntentBits, Collection } from 'discord.js';
import * as dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import { config } from './config';
import { ClientWithCommands } from './types';
import fs from 'fs';
import path from 'path';
import http from 'http';

// --- DUMMY HTTP SERVER FOR RENDER STARTUP HEALTH CHECKS ---
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Aura Bot is online!');
});
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 10000;
server.listen(port, "0.0.0.0", () => {
    console.log(`[READY] Render Health-Check Server listening on 0.0.0.0:${port}`);
});
// ---------------------------------------------------------

// Initialize the Discord Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions
    ]
}) as ClientWithCommands;

import { Player } from 'discord-player';
import { DefaultExtractors } from '@discord-player/extractor';

const player = new Player(client);

player.extractors.loadMulti(DefaultExtractors).then(() => {
    console.log('Extractors loaded successfully');
}).catch(e => console.error('Failed to load extractors:', e));

// Create player event listeners to handle automated Next/Previous and queue progressions
player.events.on('playerStart', async (queue, track) => {
    try {
        const metadata = queue.metadata as any;
        const channel = metadata?.channel || queue.channel;

        if (channel && channel.isTextBased()) {
            const { generatePanelEmbed, generatePanelComponents } = require('./commands/panel');

            // Delete previous panel if it exists
            if (metadata.currentPanel) {
                await metadata.currentPanel.delete().catch(() => { });
            }

            const currentTitle = track.title || 'Unknown Audio';
            const nextTitle = queue.history.nextTrack?.title || 'None';

            const embed = generatePanelEmbed(currentTitle, nextTitle);
            const components = generatePanelComponents();

            const pnl = await channel.send({ embeds: [embed], components: components });
            metadata.currentPanel = pnl;
        }
    } catch (e) {
        console.error('Error sending playerStart panel:', e);
    }
});

client.commands = new Collection();


// Load Commands
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath).default;
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// Load Events
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath).default;
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    }
}
// --- START DUMMY HTTP SERVER FOR RENDER HEALTH CHECKS ---
// I am start this only AFTER Discord authenticates successfully,
// so Render does not kill the boot process early.

// Log in to Discord
console.log("Attempting to connect to Discord...");

client.on('debug', console.log);

client.login(config.DISCORD_TOKEN).then(() => {
    console.log(`[READY] Successfully authenticated with Discord!`);
    console.log("Token exists?", !!config.DISCORD_TOKEN);

    // -----------------------------------------------------------

}).catch(err => {
    console.error('[ERROR] Failed to login to Discord.', err);
});
