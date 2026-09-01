import type { PageServerLoad } from './$types';
import { error, type Action, type Actions, fail } from '@sveltejs/kit';
import { TURNSTILE_SECRET_KEY } from '$env/static/private';
import { PostgresManager, getUserData, grantRegisteredRole, sendDirectMessages, convFormDataToObj, convHrpToHr, getWpnTypeByDec, validateToken, setSession, getSession, clearSession } from '$lib/utils/server';
import type { LinkDiscordData } from '$lib/types';
import bcrypt from 'bcryptjs';

const SESSION_NAME = 'linkDiscord';
const LINK_DISCORD_TTL_SECONDS = 60 * 10;

export const load: PageServerLoad = async ({ url, cookies, locals: { LL, tokenData } }) => {
    const code = url.searchParams.get('code');
    if (!code) {
        throw error(401, { message: '', message1: LL.error['oauth'].message1(), message2: [LL.error['oauth'].noDataForAuth()], message3: LL.error['oauth'].noDataForAuthMsg3() });
    }

    if (!tokenData) {
        throw error(401, { message: '', message1: LL.error['oauth'].message1(), message2: [LL.error['oauth'].failedGetToken()], message3: LL.error['startOverMsg3']() });
    }

    const userData = await getUserData(tokenData.access_token);
    if (!userData) {
        throw error(400, { message: '', message1: LL.error['oauth'].message1(), message2: [LL.error['oauth'].failedGetUser()], message3: LL.error['startOverMsg3']() });
    }

    const discordId = userData.id;
    const discordUsername = userData.username;
    const discordAvatar = userData.avatar;
    const { charId: linkedCharId, userId: linkedUserId } = await new PostgresManager('get', 'discordData', { discordId }).execute();
    if (linkedCharId || linkedUserId) {
        throw error(400, { message: '', message1: LL.error['oauth'].message1(), message2: [LL.error['linkDiscord'].existLinkedUser()], message3: LL.error['startOverMsg3']() });
    }

    tokenData = null;

    const salt = await bcrypt.genSalt(12);
    const plainVerificationCode = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16)))).substring(0, 16);
    const hashedVerificationCode = await bcrypt.hash(plainVerificationCode, salt);
    const createdDM = await sendDirectMessages(discordId, plainVerificationCode, 10, 'link-discord', LL);
    if (!createdDM) {
        throw error(400, {
            message: '',
            message1: LL.error['oauth'].message1(),
            message2: [LL.error['resetPassword'].failedSendDM()],
            message3: LL.error['resetPassword'].failedSendDMMsg3(),
        });
    }

    await setSession(cookies, SESSION_NAME, { discordId, discordUsername, discordAvatar, hashedVerificationCode }, LINK_DISCORD_TTL_SECONDS);

    return { discordId, discordUsername };
};

const linkDiscord: Action = async ({ locals: { LL, locale }, request, cookies }) => {
    const data = await request.formData();
    const { stage } = convFormDataToObj(data);

    // セッションの検証（未開始・改竄・期限切れをまとめて弾く）
    const session = await getSession<LinkDiscordData>(cookies, SESSION_NAME);
    if (Number(stage) > 1 && !session) {
        throw error(401, { message: '', message1: LL.error['linkDiscord'].failedLinkMsg1(), message2: [LL.error['sessionExpired']()], message3: LL.error['startOverMsg3']() });
    }

    switch (Number(stage)) {
        case 1: {
            return { currentStage: 1, nextStage: 2 };
        }

        case 2: {
            const { verification_code } = convFormDataToObj(data);
            const correctCode = await bcrypt.compare(String(verification_code), session!.hashedVerificationCode);

            // コードの検証
            if (!correctCode) {
                return fail(400, { error: true, codeNotMatch: true, errorCode: true });
            }

            // turnstileキャプチャの検証
            const token = data.get('cf-turnstile-response');
            const { validateSuccess, validateError } = await validateToken(String(token), TURNSTILE_SECRET_KEY);
            if (!validateSuccess) {
                return fail(400, { error: true, errorCaptcha: true, errorCaptchaMsg: `${validateError}. Please try again.` || LL.error['invalidCaptcha']() });
            }

            return { currentStage: 2, nextStage: 3 };
        }

        case 3: {
            const { username, password } = convFormDataToObj(data);

            // ユーザー名のバリデーション
            if (typeof username !== 'string' || !username) {
                return fail(400, { error: true, invalidUsername: true, errorUsername: true });
            }

            // ユーザーの存在確認
            const user = await new PostgresManager('get', 'userByUsername', { username }).execute();
            if (!user) {
                return fail(400, { error: true, noUser: true, errorUsername: true });
            }

            // パスワードのバリデーション
            if (typeof password !== 'string' || !password) {
                return fail(400, { error: true, invalidPassword: true, errorPassword: true });
            }
            const correctPass = await bcrypt.compare(password, user.password);
            if (!correctPass) {
                return fail(400, { error: true, incPassword: true, errorPassword: true });
            }

            // アカウントが連携済みか確認
            const discordExist = await new PostgresManager('get', 'chkDiscordExist', { userId: user.id }).execute();
            if (discordExist) {
                return fail(400, { error: true, userLinked: true, errorUsername: true, errorPassword: true });
            }

            await setSession(cookies, SESSION_NAME, { ...session, userId: user.id }, LINK_DISCORD_TTL_SECONDS);

            const charData = await new PostgresManager('get', 'charactersByUserId', { userId: user.id }).execute();
            const characterData = charData.map((character) => ({
                id: character.id,
                name: character.name,
                hr: convHrpToHr(character.hrp),
                gr: character.gr,
                weapon: getWpnTypeByDec(character.weapon_type, locale),
            }));

            return { currentStage: 3, nextStage: 4, characterData };
        }

        case 4: {
            const { discordId, discordUsername, discordAvatar, userId } = session!;
            if (!userId) {
                return fail(400, { error: true, unauthOps: true });
            }

            const { character_data } = convFormDataToObj(data);
            const charData: string[] = String(character_data).split('-');
            const charId = Number(charData[0]);
            const charName = charData[1];
            const charInfo = charData[2];

            const roleResult = await grantRegisteredRole(discordId);
            if (roleResult === 'notJoined') {
                throw error(400, { message: '', message1: LL.error['linkDiscord'].failedLinkMsg1(), message2: [LL.error['linkDiscord'].notJoinedDiscord()], message3: LL.error['startOverMsg3']() });
            }
            if (roleResult === 'failed') {
                throw error(400, {
                    message: '',
                    message1: LL.error['linkDiscord'].failedLinkMsg1(),
                    message2: [LL.error['linkDiscord'].failedAddRole()],
                    message3: LL.error['linkDiscord'].failedAddRoleMsg3(),
                });
            }

            const character = await new PostgresManager('get', 'charactersByUserId', { userId }).execute();
            const filteredChar = character.find((c) => c.id === charId);
            if (!filteredChar) {
                throw error(400, {
                    message: '',
                    message1: LL.error['linkDiscord'].failedLinkMsg1(),
                    message2: [LL.error['linkDiscord'].noCharacter({ name: charName })],
                    message3: LL.error['startOverMsg3'](),
                });
            }

            const { success: discordLinked, message: discordLinkMsg } = await new PostgresManager('create', 'discordLink', { charId, userId, discordId }).execute();
            if (!discordLinked) {
                throw error(400, { message: '', message1: LL.error['linkDiscord'].failedLinkMsg1(), message2: [discordLinkMsg], message3: LL.error['startOverMsg3']() });
            }

            clearSession(cookies, SESSION_NAME);

            return { currentStage: 4, nextStage: 5, discordUsername, discordAvatar, selectedCharName: charName, selectedCharInfo: charInfo };
        }

        default: {
            return { error: true, unauthOps: true };
        }
    }
};

export const actions: Actions = { linkDiscord };
