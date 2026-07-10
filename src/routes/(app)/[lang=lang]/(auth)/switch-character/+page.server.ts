import type { Action, Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { TURNSTILE_SECRET_KEY } from '$env/static/private';
import { PostgresManager, getUserData, sendDirectMessages, convFormDataToObj, convHrpToHr, getWpnTypeByDec, validateToken } from '$lib/utils/server';
import type { SwitchCharacterData, LinkedCharacterData, CharacterRow } from '$lib/types';
import bcrypt from 'bcryptjs';
import { DateTime } from 'luxon';

const SWITCH_CHARACTER_TTL_SECONDS = 60 * 10;

let switchCharacterData: SwitchCharacterData | undefined;
let switchCharacterStartTime: DateTime | undefined;
let hashedVerificationCode: string | undefined;
let availableCharacters: CharacterRow[] | undefined;

export const load: PageServerLoad = async ({ url, locals: { LL, locale, tokenData } }) => {
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

    switchCharacterData = { discordId, discordUsername, userId: linkedUserId, currentCharId: linkedCharId };
    switchCharacterStartTime = DateTime.local();

    const salt = await bcrypt.genSalt(12);
    const plainVerificationCode = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16)))).substring(0, 16);
    hashedVerificationCode = await bcrypt.hash(plainVerificationCode, salt);
    const createdDM = await sendDirectMessages(userData.id, plainVerificationCode, 10, 'switch-character', LL);
    if (!createdDM) {
        throw error(400, {
            message: '',
            message1: LL.error['oauth'].message1(),
            message2: [LL.error['resetPassword'].failedSendDM()],
            message3: LL.error['resetPassword'].failedSendDMMsg3(),
        });
    }

    return { discordId, discordUsername, currentLinkedCharacterData };
};

const switchCharacter: Action = async ({ locals: { LL, locale }, request }) => {
    const data = await request.formData();
    const { stage } = convFormDataToObj(data);

    switch (Number(stage)) {
        case 1: {
            return { currentStage: 1, nextStage: 2 };
        }

        case 2: {
            if (!switchCharacterData || !switchCharacterStartTime || !hashedVerificationCode) {
                return fail(400, { error: true, unauthOps: true });
            }

            const { verification_code } = convFormDataToObj(data);
            const correctCode = await bcrypt.compare(String(verification_code), hashedVerificationCode);

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

            // セッションの検証
            const elapsedSeconds = DateTime.local().diff(switchCharacterStartTime, 'seconds').seconds;
            if (elapsedSeconds > SWITCH_CHARACTER_TTL_SECONDS) {
                throw error(401, { message: '', message1: LL.error['switchCharacter'].failedSwitchMsg1(), message2: [LL.error['sessionExpired']()], message3: LL.error['startOverMsg3']() });
            }

            availableCharacters = await new PostgresManager('get', 'charactersByUserId', { userId: switchCharacterData.userId }).execute();
            const characterData = availableCharacters
                .filter((c) => c.id !== switchCharacterData!.currentCharId)
                .map((c) => ({ id: c.id, name: c.name, hr: convHrpToHr(c.hrp), gr: c.gr, weapon: getWpnTypeByDec(c.weapon_type, locale) }));

            return { currentStage: 2, nextStage: 3, characterData };
        }

        case 3: {
            if (!switchCharacterData || !availableCharacters) {
                return fail(400, { error: true, unauthOps: true });
            }

            const { character_data } = convFormDataToObj(data);
            const charData = String(character_data).split('-');
            const charId = Number(charData[0]);
            const charName = charData[1];

            const filteredChar = availableCharacters.find((c) => c.id === charId);
            if (!filteredChar) {
                throw error(400, {
                    message: '',
                    message1: LL.error['switchCharacter'].failedSwitchMsg1(),
                    message2: [LL.error['linkDiscord'].noCharacter({ name: charName })],
                    message3: LL.error['startOverMsg3'](),
                });
            }

            const { success: charIdUpdated, message: updateMsg } = await new PostgresManager('update', 'discordCharId', {
                discordId: switchCharacterData.discordId,
                charId,
            }).execute();
            if (!charIdUpdated) {
                throw error(400, { message: '', message1: LL.error['switchCharacter'].failedSwitchMsg1(), message2: [updateMsg || LL.error['noUserData']()], message3: LL.error['startOverMsg3']() });
            }

            switchCharacterData = undefined;
            switchCharacterStartTime = undefined;
            hashedVerificationCode = undefined;
            availableCharacters = undefined;

            return { currentStage: 3, nextStage: 4 };
        }

        default: {
            return { error: true, unauthOps: true };
        }
    }
};

export const actions: Actions = { switchCharacter };
