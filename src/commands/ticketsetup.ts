import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ticketsetup')
        .setDescription('Setup the ticket panel in the current channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction: ChatInputCommandInteraction) {
        const embed = new EmbedBuilder()
            .setTitle('🎫 Event Team Support')
            .setDescription('Please select the type of ticket you wish to open:')
            .setColor('#5865F2');

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_slot')
                    .setLabel('Slot Booking')
                    .setEmoji('📅')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('ticket_invite')
                    .setLabel('Event Invitation')
                    .setEmoji('✉️')
                    .setStyle(ButtonStyle.Secondary),
            );

        const channel = interaction.channel as import('discord.js').TextChannel;
        if (channel) {
            await channel.send({ embeds: [embed], components: [row] });
        }
        await interaction.reply({ content: 'Ticket panel setup complete.', ephemeral: true });
    },
};
