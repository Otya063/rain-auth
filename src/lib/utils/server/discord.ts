import type { Token, User, Channel, Message, GuildMember } from '$lib/types';
import type { TranslationFunctions } from '$i18n/i18n-types';
import { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_CALLBACK_URI, DISCORD_BOT_TOKEN } from '$env/static/private';

const GUILD_ID = '937230168223789066';
const REGISTERED_ROLE_ID = '1017643913667936318';

/* 認証用トークンデータの取得
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

/* Discord Oauthでのユーザーデータ取得
====================================================*/
export const getUserData = async (accessToken: string): Promise<User | null> => {
    const res = await fetch('https://discord.com/api/users/@me', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    return res.ok ? await res.json() : null;
};

/* 指定ユーザーへのダイレクトメッセージ送信
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

/* 「Registered」ロールの付与
   メンバー情報はBot権限で参照する（Bearer+/users/@me/guilds/{id}/memberはguilds.members.readスコープが必要なため）
====================================================*/
export const grantRegisteredRole = async (discordId: string): Promise<'ok' | 'notJoined' | 'failed'> => {
    const res = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}`, {
        headers: { 'Authorization': `Bot ${DISCORD_BOT_TOKEN}` },
    });

    if (res.status === 404) {
        return 'notJoined';
    }
    if (!res.ok) {
        console.error(`getGuildMember failed: status=${res.status} body=${await res.text()}`);

        return 'failed';
    }

    const member: GuildMember = await res.json();
    if (member.roles.includes(REGISTERED_ROLE_ID)) {
        return 'ok';
    }

    const addRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}/roles/${REGISTERED_ROLE_ID}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bot ${DISCORD_BOT_TOKEN}` },
    });

    if (!addRes.ok) {
        console.error(`addRoleToUser failed: status=${addRes.status} body=${await addRes.text()}`);

        return 'failed';
    }

    return 'ok';
};
