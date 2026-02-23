import { Client, Events } from 'discord.js';
client.on("ready", () => {
    console.log("🔥 BOT SUCCESSFULLY CONNECTED TO DISCORD");
});
client.login(process.env.DISCORD_TOKEN as string);
export default {
    name: Events.ClientReady,
    once: true,
    execute(client: Client) {
        console.log(`[READY] Logged in as ${client.user?.tag}`);
    }
};
