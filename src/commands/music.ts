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
        await interaction.deferReply();

        const player = useMainPlayer();
        const subcommand = interaction.options.getSubcommand();
        const member = interaction.member as GuildMember;
        const voiceChannel = member.voice?.channel;

        if (!voiceChannel) {
            await interaction.followUp({ content: 'You must be in a voice channel!' });
            return;
        }

        const botHasPermission = voiceChannel.permissionsFor(interaction.client.user!)?.has('Connect');
        if (!botHasPermission) {
            await interaction.followUp({ content: 'I do not have permission to join your voice channel!' });
            return;
        }

        if (subcommand === 'play') {
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
                        repeatMode: 2, // QueueRepeat
                        selfDeaf: false
                    }
                });

                await interaction.followUp(`🎶 Now playing: **${track.title}** (24/7 Loop enabled)`);
            } catch (e: any) {
                console.error(e);
                if (e.message?.includes('No results found') || e.message?.includes('ERR_NO_RESULT')) {
                    await interaction.followUp(`❌ Could not find any tracks matching that link. Make sure the playlist is public and supported!`);
                } else {
                    await interaction.followUp(`❌ Error playing music. Something went wrong!`);
                }
            }
            return;
        }

        if (subcommand === 'stop') {
            const queue = player.nodes.get(interaction.guildId!);
            if (!queue || !queue.isPlaying()) {
                await interaction.followUp({ content: 'I am not playing anything!' });
                return;
            }
            queue.delete();
            await interaction.followUp('🛑 Music stopped and disconnected.');
            return;
        }
    },
};
