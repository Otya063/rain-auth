import type { Action, Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { TURNSTILE_SECRET_KEY } from '$env/static/private';
import { PostgresManager, getUserData, sendDirectMessages, convFormDataToObj, convHrpToHr, getWpnTypeByDec, validateToken, setSession, getSession, clearSession } from '$lib/utils/server';
import type { SwitchCharacterData, LinkedCharacterData } from '$lib/types';
import bcrypt from 'bcryptjs';

const SESSION_NAME = 'switchCharacter';
const SWITCH_CHARACTER_TTL_SECONDS = 60 * 10;

export const load: PageServerLoad = async ({ url, cookies, locals: { LL, locale, tokenData } }) => {
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
    const { charId: linkedCharId, userId: linkedUserId } = await new PostgresManager('get', 'discordData', { discordId }).execute();
    if (!linkedCharId || !linkedUserId) {
        throw error(400, { message: '', message1: LL.error['oauth'].message1(), message2: [LL.error['resetPassword'].noLinkedUser()], message3: LL.error['linkDiscordFirst']() });
    }

    const linkedCharacter = await new PostgresManager('get', 'characterById', { charId: linkedCharId }).execute();
    if (!linkedCharacter) {
        throw error(400, { message: '', message1: LL.error['oauth'].message1(), message2: [LL.error['oauth'].failedGetUser()], message3: LL.error['startOverMsg3']() });
    }

    const currentLinkedCharacterData: LinkedCharacterData = {
        id: 0,
        name: linkedCharacter.name,
        hr: convHrpToHr(linkedCharacter.hrp),
        gr: linkedCharacter.gr,
        weapon: getWpnTypeByDec(linkedCharacter.weapon_type, locale),
    };

    tokenData = null;

    const salt = await bcrypt.genSalt(12);
    const plainVerificationCode = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16)))).substring(0, 16);
    const hashedVerificationCode = await bcrypt.hash(plainVerificationCode, salt);
    const createdDM = await sendDirectMessages(discordId, plainVerificationCode, 10, 'switch-character', LL);
    if (!createdDM) {
        throw error(400, {
            message: '',
            message1: LL.error['oauth'].message1(),
            message2: [LL.error['resetPassword'].failedSendDM()],
            message3: LL.error['resetPassword'].failedSendDMMsg3(),
        });
    }

    await setSession(cookies, SESSION_NAME, { discordId, userId: linkedUserId, currentCharId: linkedCharId, hashedVerificationCode }, SWITCH_CHARACTER_TTL_SECONDS);

    return { discordId, discordUsername, currentLinkedCharacterData };
};

const switchCharacter: Action = async ({ locals: { LL, locale }, request, cookies }) => {
    const data = await request.formData();
    const { stage } = convFormDataToObj(data);

    // セッションの検証（未開始・改竄・期限切れをまとめて弾く）
    const session = await getSession<SwitchCharacterData>(cookies, SESSION_NAME);
    if (Number(stage) > 1 && !session) {
        throw error(401, { message: '', message1: LL.error['switchCharacter'].failedSwitchMsg1(), message2: [LL.error['sessionExpired']()], message3: LL.error['startOverMsg3']() });
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

            const characters = await new PostgresManager('get', 'charactersByUserId', { userId: session!.userId }).execute();
            const characterData = characters
                .filter((c) => c.id !== session!.currentCharId)
                .map((c) => ({ id: c.id, name: c.name, hr: convHrpToHr(c.hrp), gr: c.gr, weapon: getWpnTypeByDec(c.weapon_type, locale) }));

            return { currentStage: 2, nextStage: 3, characterData };
        }

        case 3: {
            const { discordId, userId } = session!;

            const { character_data } = convFormDataToObj(data);
            const charData = String(character_data).split('-');
            const charId = Number(charData[0]);
            const charName = charData[1];

            // 所有キャラクターかどうかはDBで引き直して確認する（stage2の結果を持ち回らない）
            const characters = await new PostgresManager('get', 'charactersByUserId', { userId }).execute();
            const filteredChar = characters.find((c) => c.id === charId);
            if (!filteredChar) {
                throw error(400, {
                    message: '',
                    message1: LL.error['switchCharacter'].failedSwitchMsg1(),
                    message2: [LL.error['linkDiscord'].noCharacter({ name: charName })],
                    message3: LL.error['startOverMsg3'](),
                });
            }

            const { success: charIdUpdated, message: updateMsg } = await new PostgresManager('update', 'discordCharId', { discordId, charId }).execute();
            if (!charIdUpdated) {
                throw error(400, { message: '', message1: LL.error['switchCharacter'].failedSwitchMsg1(), message2: [updateMsg || LL.error['noUserData']()], message3: LL.error['startOverMsg3']() });
            }

            clearSession(cookies, SESSION_NAME);

            return { currentStage: 3, nextStage: 4 };
        }

        default: {
            return { error: true, unauthOps: true };
        }
    }
};

export const actions: Actions = { switchCharacter };
