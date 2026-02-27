import 'dotenv/config';

export const config = {
    DISCORD_TOKEN: process.env.DISCORD_TOKEN,
    CLIENT_ID: process.env.CLIENT_ID || '',
    GUILD_ID: process.env.GUILD_ID || '',
    CONVOY_CHANNEL_ID: process.env.CONVOY_CHANNEL_ID || '',

    // Ticket setup Configuration (Admins should set these up)
    TICKET_CATEGORY_SLOT_BOOKING: process.env.TICKET_CATEGORY_SLOT_BOOKING || '',
    TICKET_CATEGORY_EVENT_INVITE: process.env.TICKET_CATEGORY_EVENT_INVITE || '',
    TICKET_LOG_CHANNEL: process.env.TICKET_LOG_CHANNEL || '',

    // Roles map for mentions when ticket opens
    ROLE_EVENT_TEAM: process.env.ROLE_EVENT_TEAM || '',
    ROLE_MANAGEMENT_TEAM: process.env.ROLE_MANAGEMENT_TEAM || '',
    ROLE_HR_TEAM: process.env.ROLE_HR_TEAM || '',
};
