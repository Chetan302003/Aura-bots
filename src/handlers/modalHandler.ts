import { ModalSubmitInteraction, TextChannel, AttachmentBuilder } from 'discord.js';
import { config } from '../config';

export async function handleModalInteraction(interaction: ModalSubmitInteraction) {
    if (interaction.customId === 'ticket_close_modal') {
        const member = interaction.member as import('discord.js').GuildMember;
        const hasRole = member.roles.cache.has(config.ROLE_EVENT_TEAM) || member.roles.cache.has(config.ROLE_MANAGEMENT_TEAM);

        if (!hasRole) {
            return interaction.reply({ content: 'Only the Event Team or Management Team can close tickets.', ephemeral: true });
        }

        const reason = interaction.fields.getTextInputValue('close_reason');
        const channel = interaction.channel as TextChannel;
        if (!channel) return;

        await interaction.reply({ content: 'Closing ticket and generating transcript...', ephemeral: false });

        try {
            const messages = await channel.messages.fetch({ limit: 100 });
            const htmlContent = `Reason for closing: ${reason}\n\n` + messages.map(m => `[${m.createdAt.toISOString()}] ${m.author.tag}: ${m.content}`).join('\n');
            const buffer = Buffer.from(htmlContent, 'utf-8');
            const attachment = new AttachmentBuilder(buffer, { name: `${channel.name}-transcript.txt` });

            if (config.TICKET_LOG_CHANNEL) {
                const logChannel = interaction.guild?.channels.cache.get(config.TICKET_LOG_CHANNEL) as TextChannel;
                if (logChannel) {
                    await logChannel.send({
                        content: `Ticket closed by ${interaction.user.tag}\nChannel: ${channel.name}\nReason: **${reason}**`,
                        files: [attachment]
                    });
                }
            }

            try {
                // Determine the original user from the channel name if possible, 
                // but since it's tricky, we'll just attempt to DM the person interacting (who closed it).
                // Or broadcast in channel before deletion. But the old logic DMs the closer.
                await interaction.user.send({
                    content: `Your ticket from ${interaction.guild?.name} has been closed.\n**Reason:** ${reason}\nHere is your transcript:`,
                    files: [attachment]
                });
            } catch (dmError) {
                console.log('Could not DM user the transcript.');
            }

            setTimeout(async () => {
                await channel.delete().catch(() => { });
            }, 5000);

        } catch (error) {
            console.error('Error closing ticket:', error);
            return interaction.followUp({ content: 'An error occurred while closing the ticket.', ephemeral: true });
        }
    }
}
