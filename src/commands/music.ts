import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { useMainPlayer } from 'discord-player';

export default {
    data: new SlashCommandBuilder()
        .setName('music')
        .setDescription('24/7 Music System')
        .addSubcommand(subcommand =>
            subcommand.setName('play')
                .setDescription('Start playing music (Hindi/English mix loop)')
                .addStringOption(option =>
                    option.setName('query')
                        .setDescription('A song or playlist URL (defaults to a predefined Hindi/English mix)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('stop')
                .setDescription('Stop music and disconnect')
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        const player = useMainPlayer();
        const subcommand = interaction.options.getSubcommand();
        const member = interaction.member as GuildMember;
        const voiceChannel = member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({ content: 'You must be in a voice channel!', ephemeral: true });
        }

        const botHasPermission = voiceChannel.permissionsFor(interaction.client.user!)?.has('Connect');
        if (!botHasPermission) {
            return interaction.reply({ content: 'I do not have permission to join your voice channel!', ephemeral: true });
        }

        if (subcommand === 'play') {
            await interaction.deferReply();
            let query = interaction.options.getString('query');

            // Default 24/7 playlist if no query is provided (Example Lofi hip hop radio - beats to relax/study to)
            if (!query) {
                query = 'https://www.youtube.com/watch?v=jfKfPfyJRdk'; // Fallback / default stream
            }

            try {
                const { track } = await player.play(voiceChannel, query, {
                    nodeOptions: {
                        metadata: interaction,
                        volume: 50,
                        leaveOnEmpty: false,
                        leaveOnEnd: false,
                        leaveOnStop: true,
                        repeatMode: 2 // QueueRepeat
                    }
                });

                return interaction.followUp(`🎶 Now playing: **${track.title}** (24/7 Loop enabled)`);
            } catch (e) {
                console.error(e);
                return interaction.followUp(`❌ Error playing music. Something went wrong!`);
            }
        }

        if (subcommand === 'stop') {
            const queue = player.nodes.get(interaction.guildId!);
            if (!queue || !queue.isPlaying()) {
                return interaction.reply({ content: 'I am not playing anything!', ephemeral: true });
            }
            queue.delete();
            return interaction.reply('🛑 Music stopped and disconnected.');
        }
    },
};
