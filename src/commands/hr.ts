import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, GuildMember, PermissionFlagsBits } from 'discord.js';
import { config } from '../config';

export default {
    data: new SlashCommandBuilder()
        .setName('hr')
        .setDescription('HR and Management actions')
        .addSubcommand(subcommand =>
            subcommand
                .setName('accept')
                .setDescription('Accept an applicant')
                .addUserOption(option => option.setName('user').setDescription('The user to accept').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reject')
                .setDescription('Reject an applicant')
                .addUserOption(option => option.setName('user').setDescription('The user to reject').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('questions')
                .setDescription('Send questions to an applicant')
                .addUserOption(option => option.setName('user').setDescription('The user to question').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('under-review')
                .setDescription('Notify an applicant their application is under review')
                .addUserOption(option => option.setName('user').setDescription('The user to notify').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('rules')
                .setDescription('Display HR rules and policies')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('server-rules')
                .setDescription('Display server rules')
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        // Permissions check mapping
        const member = interaction.member as GuildMember;
        const hasHR = config.ROLE_HR_TEAM ? member.roles.cache.has(config.ROLE_HR_TEAM) : false;
        const hasManagement = config.ROLE_MANAGEMENT_TEAM ? member.roles.cache.has(config.ROLE_MANAGEMENT_TEAM) : false;

        // Ensure the person using this is an HR, Management, or Administrator
        if (!hasHR && !hasManagement && !member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '❌ You require the HR or Management role to use this command.', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();
        const targetUser = interaction.options.getUser('user');
        const embed = new EmbedBuilder();
        const hrSignature = `\n\n**— ${member.displayName} | ${member.roles.highest.name}**`;

        // Setting a generic title and letting the description house the template, per instructions
        switch (subcommand) {
            case 'accept':
                embed.setTitle('✅ Application Accepted')
                    .setDescription(`Hello ${targetUser} 👋\n\nWe are pleased to inform you that your application to join **Aura VTC** has been **accepted**! 🎉\n\nWelcome to the team! 🚛✨\n\nPlease proceed with the following next steps:\n\n• Apply the **Aura tag** in-game.\n• Please keep looking at [🚛│public-events](https://discord.com/channels/1279389491433570388/1314294049146011699) for upcoming events.\n• Visit [💻│aura-essentials](https://discord.com/channels/1279389491433570388/1303663633913483284) to download our profile. If you don’t know how to set it up, just ping us — we’ll gladly help you.\n• Join [🗪│aura-lounge](https://discord.com/channels/1279389491433570388/1296440846857539656) to chat and interact with other VTC members.\n• Make sure you follow all server rules and VTC policies at all times.\n\nIf you have any questions, feel free to contact the Human Resource Team.\n\nOnce again, welcome to Aura — we’re excited to drive with you! 🚛${hrSignature}`)
                    .setColor('#57F287');
                await interaction.reply({ content: targetUser ? `${targetUser}` : '', embeds: [embed] });
                break;

            case 'reject':
                embed.setTitle('❌ Application Rejected')
                    .setDescription(`Hello ${targetUser} 👋\n\nThank you for your interest in joining **Aura VTC**.\n\nAfter carefully reviewing your application, we regret to inform you that you have **not been selected** at this time.\n\nThis decision may be due to:\n• Not meeting one or more of our requirements\n• Incomplete information\n• Ban history or activity concerns\n\nYou are welcome to reapply in the future once you meet all requirements.\n\nWe appreciate your time and wish you safe trucking ahead! 🚛${hrSignature}`)
                    .setColor('#ED4245');
                await interaction.reply({ content: targetUser ? `${targetUser}` : '', embeds: [embed] });
                break;

            case 'questions':
                embed.setTitle('❓ HR Questions')
                    .setDescription(`Hello ${targetUser} 👋\n\nThank you for applying to **Aura VTC**.\n\nBefore we proceed further, the HR Team has a few questions for you:\n\n1. Have you read 📑│server-rules 📜│policies-and-rules and the requirements on our TruckersMP VTC Page?\n2. Are you able to communicate in English via Voice Channel or Chat Channel without the use of any translator?\n3. Do you have any active bans on TruckersMP?\n4. What is your play-time in Euro Truck Simulator 2 and/or American Truck Simulator?\n5. Where are you from and what is your playing time per day? (e.g., 08:00 UTC to 16:00 UTC)\n\nOnce you answer these questions, we will proceed to the next step.\n\nWe look forward to your response.${hrSignature}`)
                    .setColor('#FEE75C');
                await interaction.reply({ content: targetUser ? `${targetUser}` : '', embeds: [embed] });
                break;

            case 'under-review':
                embed.setTitle('⏳ Under Review')
                    .setDescription(`Hello ${targetUser} 👋\n\nYour application to join **Aura VTC** is currently **under review** by our Human Resource Team.\n\nWe kindly ask for your patience while we carefully evaluate your responses and eligibility.\n\nYou will be notified once a final decision has been made.\n\nThank you for your interest in Aura! 🚛${hrSignature}`)
                    .setColor('#5865F2');
                await interaction.reply({ content: targetUser ? `${targetUser}` : '', embeds: [embed] });
                break;

            case 'rules':
                embed.setTitle('📜 Aura VTC – Policies & Requirements')
                    .setDescription(`**Requirements:**\n\n• Must comply with TruckersMP rules.\n• Must be at least 16 years old.\n• Must follow Aura VTC & Discord rules at all times.\n• Minimum 15 gaming hours in ETS2 and/or ATS (combined allowed).\n• No more than 2 active bans. Most recent ban must be at least 60 days old.\n• Must communicate in basic English via voice or chat.\n\n---\n\n**VTC Rules:**\n\n• The Aura tag must be applied at all times (unless HR-approved exception).\n• Heavy save edits are restricted during events.\n• Minimum 1,000 KM or 2 events per month (1 private & 1 public).\n• Aura paintjob is mandatory during official events.\n• Being in another VTC while in Aura is strictly prohibited.\n• Any TruckersMP ban must be reported to HR within 48 hours.\n\nFailure to meet monthly requirements without informing HR may result in removal.${hrSignature}`)
                    .setColor('#EB459E');
                await interaction.reply({ embeds: [embed] });
                break;

            case 'server-rules':
                embed.setTitle('� Aura Discord Server Rules')
                    .setDescription(`**1) General Rules**\n• Be respectful and kind to all members.\n• No hate speech, discrimination, or harassment.\n• No spamming or flooding channels.\n• Keep content appropriate for all ages.\n• Follow Discord Community Guidelines & Terms of Service.\n\n**2) Content Guidelines**\n• Keep discussions related to server topics.\n• No political, explicit, violent, or illegal content.\n• No copyrighted or pirated material.\n• No self-promotion or advertising.\n\n**3) Voice Chat Guidelines**\n• No disruptive background noise.\n• No loud music or unwanted soundboards.\n• No offensive language.\n• Do not record/stream without consent.\n• Follow staff instructions at all times.\n\n**4) Moderation**\n• Aura Management has full authority to enforce rules.\n• Violations may result in warnings, mutes, or bans.\n• Rules may be updated when necessary.\n\nLet’s keep Aura a respectful and enjoyable community for everyone! 🚛✨${hrSignature}`)
                    .setColor('#99AAB5');
                await interaction.reply({ embeds: [embed] });
                break;
        }
    },
};
