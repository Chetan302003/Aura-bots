import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel } from 'discord.js';
import { config } from '../config';

export default {
    data: new SlashCommandBuilder()
        .setName('convoy')
        .setDescription('Create a convoy event by fetching details from TruckersMP')
        .addStringOption(option =>
            option.setName('event')
                .setDescription('TruckersMP Event ID or URL')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Custom message or block text to post inside the embed')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('slot_image')
                .setDescription('Image Link for the Slot/Parking')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('slot_location')
                .setDescription('Slot number or location (e.g. Slot Partners FLE)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('notes')
                .setDescription('Any additional notes')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('ping_roles')
                .setDescription('Roles to ping (e.g. @Aura Member)')
                .setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });

        const eventInput = interaction.options.getString('event', true);
        const messageText = interaction.options.getString('message');
        const slotImage = interaction.options.getString('slot_image');
        const slotLocation = interaction.options.getString('slot_location');
        const notes = interaction.options.getString('notes');
        const pingRoles = interaction.options.getString('ping_roles');

        const channelId = config.CONVOY_CHANNEL_ID;
        const channel = interaction.client.channels.cache.get(channelId) as TextChannel;

        if (!channel) {
            return interaction.followUp({ content: `Could not find the convoy channel (${channelId}).` });
        }

        // Extract Event ID
        const match = eventInput.match(/\d+/);
        if (!match) {
            return interaction.followUp({ content: 'Invalid Event ID or URL.' });
        }
        const eventId = match[0];

        try {
            const res = await fetch(`https://api.truckersmp.com/v2/events/${eventId}`);
            const data = await res.json() as any;

            if (data.error || !data.response) {
                return interaction.followUp({ content: 'Event not found on TruckersMP.' });
            }

            const ev = data.response;

            // Convert TruckersMP UTC strings (e.g. "2026-02-27 12:00:00") to unix seconds
            const meetupUnix = Math.floor(new Date(ev.meetup_at.replace(' ', 'T') + 'Z').getTime() / 1000);
            const startUnix = Math.floor(new Date(ev.start_at.replace(' ', 'T') + 'Z').getTime() / 1000);

            let description =
                `📅 **Date:** <t:${startUnix}:F>\n` +
                `🎮 **Game:** ${ev.game || 'Euro Truck Simulator 2'}\n` +
                `🎲 **Server:** ${ev.server?.name || 'TBD'}\n` +
                `🕚 **Meeting Time:** <t:${meetupUnix}:R>\n` +
                `🕣 **Departure Time:** <t:${startUnix}:R>\n` +
                `📌 **Starting City:** ${ev.departure?.city || 'TBD'} ${slotLocation ? `(${slotLocation})` : ''}\n` +
                `🏁 **Destination City:** ${ev.arrive?.city || 'TBD'}\n` +
                `🚛 **DLC Required:** ${ev.dlcs?.length > 0 ? ev.dlcs.join(', ') : 'None'}\n\n` +
                `📄 **Notes:** ${notes || 'None'}\n\n` +
                `**Mark Your Presence:**\nhttps://truckersmp.com${ev.url}`;

            if (messageText) {
                description += `\n\n**Message to Post:**\n\`\`\`\n${messageText}\n\`\`\``;
            }

            const embed = new EmbedBuilder()
                .setTitle(ev.name)
                .setURL(`https://truckersmp.com${ev.url}`)
                .setColor('#2ECC71')
                .setThumbnail(ev.banner || null)
                .setDescription(description)
                .addFields(
                    { name: '🟢 Attending (0)', value: 'None', inline: true },
                    { name: '🟡 Tentative (0)', value: 'None', inline: true },
                    { name: '🔴 Not Attending (0)', value: 'None', inline: true }
                )
                .setFooter({ text: `Hosted by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

            if (slotImage) {
                embed.setImage(slotImage);
            }

            const row = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('convoy_attending')
                        .setLabel('Attending')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('convoy_tentative')
                        .setLabel('Tentative')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('convoy_not_attending')
                        .setLabel('Not Attending')
                        .setStyle(ButtonStyle.Danger),
                );

            await channel.send({
                content: pingRoles ? pingRoles : undefined,
                embeds: [embed],
                components: [row]
            });
            await interaction.followUp({ content: 'Convoy details posted successfully!' });

        } catch (error) {
            console.error(error);
            await interaction.followUp({ content: 'An error occurred while fetching the event data.' });
        }
    },
};
