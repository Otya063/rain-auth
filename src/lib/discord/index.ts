import type { Token, User, Channel, Message, GuildMember } from '$lib/types';
import type { TranslationFunctions } from '$i18n/i18n-types';
import { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_CALLBACK_URI, DISCORD_BOT_TOKEN } from '$env/static/private';

/* Get Token Data for Authorization
====================================================*/
export const getToken = async (code: string, type: string): Promise<Token | null> => {
    const body = new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: `${DISCORD_CALLBACK_URI}/?reqType=${type}`,
    });

    const res = await fetch('https://discord.com/api/v10/oauth2/token', {
        method: 'POST',
        body: body,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return res.ok ? await res.json() : null;
};

/* Get User Data in Discord Oauth
====================================================*/
export const getUserData = async (accessToken: string): Promise<User | null> => {
    const res = await fetch('https://discord.com/api/users/@me', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    return res.ok ? await res.json() : null;
};

/* Send Direct Message to Specified User
====================================================*/
export const sendDirectMessages = async (userId: string, verificationCode: string, time: number, type: string, LL: TranslationFunctions): Promise<Message | null> => {
    const body = JSON.stringify({
        recipient_id: userId,
    });
    const res = await fetch('https://discordapp.com/api/users/@me/channels', {
        method: 'POST',
        headers: { 'Authorization': `Bot ${DISCORD_BOT_TOKEN}`, 'Content-Type': 'application/json' },
        body: body,
    });

    if (!res.ok) {
        return null;
    }

    const channelData: Channel = await res.json();
    let contentMsg: string;

    switch (type) {
        case 'reset-password': {
            contentMsg = LL.resetPassword['verifCodeDesc']({ site: LL.resetPassword['title'](), time });

            break;
        }

        case 'link-discord': {
            contentMsg = LL.resetPassword['verifCodeDesc']({ site: LL.linkDiscord['title'](), time });

            break;
        }

        case 'register': {
            contentMsg = LL.resetPassword['verifCodeDesc']({ site: LL.register['metaTitle'](), time });

            break;
        }

        case 'switch-character': {
            contentMsg = LL.resetPassword['verifCodeDesc']({ site: LL.switchCharacter['metaTitle'](), time });

            break;
        }

        default: {
            contentMsg = 'Invalid Input';
        }
    }

    const body1 = JSON.stringify({
        content: contentMsg + '```' + verificationCode + '```',
    });
    const res1 = await fetch(`https://discordapp.com/api/channels/${channelData.id}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bot ${DISCORD_BOT_TOKEN}`, 'Content-Type': 'application/json' },
        body: body1,
    });

    return res1.ok ? await res1.json() : null;
};

/* Get Member Info (Me) for a Guild With a Specified ID
====================================================*/
export const getGuildMember = async (guildId: string, accessToken: string): Promise<GuildMember | null> => {
    const res = await fetch(`https://discordapp.com/api/users/@me/guilds/${guildId}/member`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    return res.ok ? await res.json() : null;
};

/* Add Role to a Specified User
====================================================*/
export const addRoleToUser = async (guildId: string, userId: string, roleId: string): Promise<number> => {
    const res = await fetch(`https://discordapp.com/api/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bot ${DISCORD_BOT_TOKEN}` },
    });

    return res.ok ? res.status : 400;
};
