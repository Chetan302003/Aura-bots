import { ButtonInteraction, TextChannel, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField, AttachmentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { config } from '../config';
import { useMainPlayer } from 'discord-player';

export async function handleButtonInteraction(interaction: ButtonInteraction) {
    const customId = interaction.customId;

    // ----- TICKET SYSTEM -----
    if (customId === 'ticket_slot' || customId === 'ticket_invite') {
        const guild = interaction.guild;
        if (!guild) return;

        const isSlot = customId === 'ticket_slot';
        const categoryId = isSlot ? config.TICKET_CATEGORY_SLOT_BOOKING : config.TICKET_CATEGORY_EVENT_INVITE;
        const category = guild.channels.cache.get(categoryId);

        if (!categoryId) {
            return interaction.reply({ content: 'Ticket category not configured. Please contact an Admin.', ephemeral: true });
        }

        const typeLabel = isSlot ? 'Slot Booking' : 'Event Invitation';

        try {
            const ticketChannel = await guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                parent: categoryId,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionsBitField.Flags.ViewChannel],
                    },
                    {
                        id: interaction.user.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                    },
                    {
                        id: interaction.client.user.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                    }
                ]
            });

            const embed = new EmbedBuilder()
                .setTitle(`🎫 ${typeLabel} Ticket`)
                .setDescription(`Hello ${interaction.user}, welcome to your ticket!\nThe Event Team will be with you shortly. Please describe your inquiry.`)
                .setColor(isSlot ? '#5865F2' : '#2ECC71');

            const row = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('ticket_close')
                        .setLabel('Close Ticket')
                        .setEmoji('🔒')
                        .setStyle(ButtonStyle.Danger)
                );

            await ticketChannel.send({
                content: `<@${interaction.user.id}> | <@&${config.ROLE_EVENT_TEAM}>`,
                embeds: [embed],
                components: [row]
            });

            return interaction.reply({ content: `Your ticket has been created: ${ticketChannel}`, ephemeral: true });
        } catch (error) {
            console.error('Error creating ticket:', error);
            return interaction.reply({ content: 'Failed to create a ticket. Please try again later.', ephemeral: true });
        }
    }

    if (customId === 'ticket_close') {
        const member = interaction.member as import('discord.js').GuildMember;
        const hasRole = member.roles.cache.has(config.ROLE_EVENT_TEAM) || member.roles.cache.has(config.ROLE_MANAGEMENT_TEAM);

        if (!hasRole) {
            return interaction.reply({ content: 'Only the Event Team or Management Team can close tickets.', ephemeral: true });
        }

        const modal = new ModalBuilder()
            .setCustomId('ticket_close_modal')
            .setTitle('Close Ticket');

        const reasonInput = new TextInputBuilder()
            .setCustomId('close_reason')
            .setLabel("Why are you closing this ticket?")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput);
        modal.addComponents(actionRow);

        await interaction.showModal(modal);
        return;
    }

    // ----- CONVOY SYSTEM -----
    if (customId.startsWith('convoy_')) {
        const message = interaction.message;
        const embed = message.embeds[0];
        if (!embed) return interaction.reply({ content: 'Embed not found!', ephemeral: true });

        const newEmbed = EmbedBuilder.from(embed);
        const attendingField = newEmbed.data.fields?.find(f => f.name.includes('🟢'));
        const tentativeField = newEmbed.data.fields?.find(f => f.name.includes('🟡'));
        const notAttendingField = newEmbed.data.fields?.find(f => f.name.includes('🔴'));

        const userMention = `<@${interaction.user.id}>`;
        const parseList = (str: string) => str === 'None' ? [] : str.split('\n');

        let attendingList = parseList(attendingField?.value || 'None');
        let tentativeList = parseList(tentativeField?.value || 'None');
        let notAttendingList = parseList(notAttendingField?.value || 'None');

        // Remove user from all lists first
        attendingList = attendingList.filter(u => u !== userMention);
        tentativeList = tentativeList.filter(u => u !== userMention);
        notAttendingList = notAttendingList.filter(u => u !== userMention);

        // Add user to the appropriate list
        if (customId === 'convoy_attending') attendingList.push(userMention);
        if (customId === 'convoy_tentative') tentativeList.push(userMention);
        if (customId === 'convoy_not_attending') notAttendingList.push(userMention);

        // Re-assign lists to embed fields
        if (attendingField) {
            attendingField.name = `🟢 Attending (${attendingList.length})`;
            attendingField.value = attendingList.length > 0 ? attendingList.join('\n') : 'None';
        }
        if (tentativeField) {
            tentativeField.name = `🟡 Tentative (${tentativeList.length})`;
            tentativeField.value = tentativeList.length > 0 ? tentativeList.join('\n') : 'None';
        }
        if (notAttendingField) {
            notAttendingField.name = `🔴 Not Attending (${notAttendingList.length})`;
            notAttendingField.value = notAttendingList.length > 0 ? notAttendingList.join('\n') : 'None';
        }

        await message.edit({ embeds: [newEmbed] });
        await interaction.reply({ content: 'Your response has been recorded.', ephemeral: true });
    }

    // ----- MUSIC SYSTEM -----
    if (customId.startsWith('music_')) {
        const guildId = interaction.guildId;
        if (!guildId) return;

        const player = useMainPlayer();
        const queue = player.nodes.get(guildId);

        if (!queue || !queue.isPlaying()) {
            return interaction.reply({ content: 'There is no music currently playing!', ephemeral: true });
        }

        const memberVoice = (interaction.member as import('discord.js').GuildMember).voice.channel;
        if (!memberVoice || memberVoice.id !== queue.channel?.id) {
            return interaction.reply({ content: 'You must be in the same voice channel as me to control the music!', ephemeral: true });
        }

        let responseMessage = '';

        try {
            switch (customId) {
                case 'music_playpause':
                    queue.node.setPaused(!queue.node.isPaused());
                    responseMessage = queue.node.isPaused() ? '⏸️ Paused the music.' : '▶️ Resumed the music.';
                    break;
                case 'music_previous':
                    if (queue.history.tracks.data.length === 0) {
                        responseMessage = '⚠️ There is no previous track in the history!';
                    } else {
                        await queue.history.previous();
                        responseMessage = '⏮️ Playing the previous track.';
                    }
                    break;
                case 'music_skip':
                    queue.node.skip();
                    responseMessage = '⏭️ Skipped the current track.';
                    break;
                case 'music_stop':
                    queue.delete();
                    responseMessage = '⏹️ Stopped the music and cleared the queue.';
                    break;
                case 'music_loop':
                    const currentMode = queue.repeatMode;
                    const nextMode = currentMode === 0 ? 1 : (currentMode === 1 ? 2 : 0);
                    queue.setRepeatMode(nextMode as any);
                    const modeLabels = ['Off', 'Track', 'Queue'];
                    responseMessage = `🔁 Loop mode set to: **${modeLabels[nextMode]}**`;
                    break;
                case 'music_shuffle':
                    queue.tracks.shuffle();
                    responseMessage = '🔀 Shuffled the queue.';
                    break;
                case 'music_voldown':
                    const currentVolDown = queue.node.volume;
                    const newVolDown = Math.max(0, currentVolDown - 10);
                    queue.node.setVolume(newVolDown);
                    responseMessage = `🔉 Volume decreased to **${newVolDown}%**`;
                    break;
                case 'music_volup':
                    const currentVolUp = queue.node.volume;
                    const newVolUp = Math.min(100, currentVolUp + 10);
                    queue.node.setVolume(newVolUp);
                    responseMessage = `🔊 Volume increased to **${newVolUp}%**`;
                    break;
                default:
                    responseMessage = 'Unknown control.';
                    break;
            }
            await interaction.reply({ content: responseMessage, ephemeral: true });
        } catch (error) {
            console.error('Music Control Error:', error);
            await interaction.reply({ content: 'An error occurred while controlling the music.', ephemeral: true });
        }
    }
}
