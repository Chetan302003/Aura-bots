import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('panel')
        .setDescription('Spawn the music control panel'),
    async execute(interaction: ChatInputCommandInteraction) {
        const embed = new EmbedBuilder()
            .setTitle('🎵 Music Control Panel')
            .setDescription('Use the buttons below to control the music playback in your server.')
            .setColor('#2b2d31')
            .setImage('https://i.imgur.com/8Qh1E3V.png') // generic music banner
            .setFooter({ text: 'Aura Music System' });

        const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('music_previous').setLabel('Previous').setEmoji('⏮️').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('music_playpause').setLabel('Play/Pause').setEmoji('⏯️').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('music_skip').setLabel('Skip').setEmoji('⏭️').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('music_stop').setLabel('Stop').setEmoji('⏹️').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('music_loop').setLabel('Loop').setEmoji('🔁').setStyle(ButtonStyle.Secondary),
        );

        const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('music_shuffle').setLabel('Shuffle').setEmoji('🔀').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('music_voldown').setLabel('Vol -10%').setEmoji('🔉').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('music_volup').setLabel('Vol +10%').setEmoji('🔊').setStyle(ButtonStyle.Secondary),
        );

        await interaction.reply({ embeds: [embed], components: [row1, row2] });
    },
};
