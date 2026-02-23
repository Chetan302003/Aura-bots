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
        )
        .addSubcommand(subcommand =>
            subcommand.setName('next')
                .setDescription('Skip to the next song')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('previous')
                .setDescription('Play the previous song')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('pause')
                .setDescription('Pause the music')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('resume')
                .setDescription('Resume the music')
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
            let isDefaultRadio = false;

            // Default 24/7 playlist if no query is provided (Example Lofi hip hop radio - beats to relax/study to)
            if (!query) {
                query = 'https://www.youtube.com/watch?v=jfKfPfyJRdk'; // Fallback / default stream
                isDefaultRadio = true;
            }

            // Intercept custom Apple Music Playlists (pl.u-) which are blocked by Apple Developer API
            if (query.includes('apple.com') && query.includes('pl.u-')) {
                await interaction.followUp(`⚠️ **Apple Music Custom Playlist Detected**\n\nApple Music actively blocks third-party bots from reading user-made \`pl.u-\` playlists due to their strict Developer API restrictions. (Only paid enterprise bots can bypass this).\n\n**Quick Fix:** Use a free site like [TuneMyMusic.com](https://www.tunemymusic.com) to instantly copy your Apple playlist to **Spotify** or **YouTube**, then paste that new link here!`);
                return;
            }

            try {
                // `player.play` automatically handles both starting new sessions AND enqueuing tracks
                // if a session is already active in that voice channel.
                const { track, queue } = await player.play(voiceChannel, query, {
                    nodeOptions: {
                        metadata: interaction,
                        volume: 50,
                        leaveOnEmpty: true,
                        leaveOnEmptyCooldown: 300000,
                        leaveOnEnd: true,
                        leaveOnEndCooldown: 300000,
                        leaveOnStop: true,
                        repeatMode: isDefaultRadio ? 2 : 0, // 2 = QueueRepeat, 0 = Off
                        selfDeaf: true
                    },
                    searchEngine: 'auto'
                });

                if (queue.isPlaying() && queue.currentTrack !== track) {
                    await interaction.followUp(`📝 Added to queue: **${track.title}**`);
                } else {
                    await interaction.followUp(`🎶 Preparing to play: **${track.title}**\n*(Control panel will appear shortly!)*`);
                }
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

        if (subcommand === 'next') {
            const queue = player.nodes.get(interaction.guildId!);
            if (!queue || !queue.isPlaying()) {
                await interaction.followUp({ content: 'I am not playing anything!' });
                return;
            }
            queue.node.skip();
            await interaction.followUp('⏭️ Skipped the current track.');
            return;
        }

        if (subcommand === 'previous') {
            const queue = player.nodes.get(interaction.guildId!);
            if (!queue || !queue.isPlaying()) {
                await interaction.followUp({ content: 'I am not playing anything!' });
                return;
            }

            if (!queue.history.previousTrack) {
                await interaction.followUp('⚠️ There is no previous track found! (If you just started playing or are using a single-song 24/7 loop, history is empty).');
            } else {
                await queue.history.previous();
                await interaction.followUp('⏮️ Playing the previous track.');
            }
            return;
        }

        if (subcommand === 'pause') {
            const queue = player.nodes.get(interaction.guildId!);
            if (!queue || !queue.isPlaying()) {
                await interaction.followUp({ content: 'I am not playing anything!' });
                return;
            }
            queue.node.setPaused(true);
            await interaction.followUp('⏸️ Paused the music.');
            return;
        }

        if (subcommand === 'resume') {
            const queue = player.nodes.get(interaction.guildId!);
            if (!queue || !queue.isPlaying()) {
                await interaction.followUp({ content: 'I am not playing anything!' });
                return;
            }
            queue.node.setPaused(false);
            await interaction.followUp('▶️ Resumed the music.');
            return;
        }
    },
};
