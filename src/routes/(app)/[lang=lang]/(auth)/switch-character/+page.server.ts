import type { PageServerLoad } from './$types';
import type { discord, discord_register } from '@prisma/client/edge';
import { error, type Action, type Actions, fail, type NumericRange } from '@sveltejs/kit';
import { TURNSTILE_SECRET_KEY } from '$env/static/private';
import ServerData, { db } from '$lib/database';
import { getUserData, sendDirectMessages } from '$lib/discord';
import type { LinkDiscordGetData, RainApiPostResponseData, LinkedCharacterData } from '$lib/types';
import { convFormDataToObj, convHrpToHr, getWpnTypeByDec, validateToken } from '$lib/utils';
import bcrypt from 'bcryptjs';
import _ from 'lodash';

let currentUserId: number;
let currentCharId: number;
let currentCharData: { id: number; name: string | null; hrp: number | null; gr: number | null; weapon_type: number | null }[];
let hashedVerificationCode: string;
let userKey: string;

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

    const discordAccessToken = tokenData.access_token;
    const discordId = userData.id;
    const discordUsername = userData.username;
    const discordAvatar = userData.avatar;
    const discordData: discord | null = await ServerData.getLinkedCharactersByDiscordId(discordId);
    const discordRegisterData: discord_register | null = await ServerData.getLinkedUserByDiscordId(discordId);
    if (!discordData || !discordRegisterData) {
        throw error(400, { message: '', message1: LL.error['oauth'].message1(), message2: [LL.error['resetPassword'].noLinkedUser()], message3: LL.error['startOverMsg3']() });
    }

    const linkedCharacter = (await db.characters.findFirst({
        where: {
            id: discordData.char_id,
        },
        select: {
            name: true,
            hrp: true,
            gr: true,
            weapon_type: true,
        },
    }))!;
    const currentlinkedCharacterData: LinkedCharacterData = {
        id: 0,
        name: linkedCharacter.name,
        hr: convHrpToHr(linkedCharacter.hrp),
        gr: linkedCharacter.gr,
        weapon: getWpnTypeByDec(linkedCharacter.weapon_type, locale),
    };

    currentUserId = discordRegisterData.user_id;
    currentCharId = discordData.char_id;
    tokenData = null;

    const { resStatus, resStatusText } = await (async () => {
        try {
            const res = await fetch(`https://api.rain-server.com/link-discord`, {
                method: 'POST',
                body: JSON.stringify({ discord_access_token: discordAccessToken, discord_id: discordId, discord_username: discordUsername, discord_avatar: discordAvatar }),
                headers: {
                    'Content-Type': 'application/json',
                    'Origin': url.origin,
                },
            });
            const resJson: RainApiPostResponseData = await res.json();
            const resStatus = res.status;
            const resStatusText = res.statusText;

            userKey = resJson.user_key;

            return { resStatus, resStatusText };
        } catch (err) {
            if (err instanceof Error) {
                throw error(400, { message: '', message1: LL.error['failedApiMsg1'](), message2: [err.message], message3: LL.error['startOverMsg3']() });
            } else if (typeof err === 'string') {
                throw error(400, { message: '', message1: LL.error['failedApiMsg1'](), message2: [err], message3: LL.error['startOverMsg3']() });
            } else {
                throw error(400, { message: '', message1: LL.error['failedApiMsg1'](), message2: undefined, message3: LL.error['startOverMsg3']() });
            }
        }
    })();

    if (resStatus !== 201) {
        throw error(resStatus as NumericRange<400, 599>, {
            message: '',
            message1: LL.error['failedApiMsg1'](),
            message2: resStatusText === 'NO_REQUIRED_DATA' ? [LL.error['passedInvalidData']()] : resStatusText === 'UNEXPECTED' ? [LL.error['unexpectedErr']()] : [resStatusText],
            message3: LL.error['startOverMsg3'](),
        });
    }

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

    return { discordId, discordUsername, currentlinkedCharacterData };
};

const linkDiscord: Action = async ({ url, locals: { LL, locale }, request }) => {
    const data = await request.formData();
    const { stage } = convFormDataToObj(data);

    switch (Number(stage)) {
        case 1: {
            return { currentStage: 1, nextStage: 2 };
        }

        case 2: {
            const { verification_code } = convFormDataToObj(data);
            const correctCode: boolean = await bcrypt.compare(String(verification_code), hashedVerificationCode);

            // code validation
            if (!correctCode) {
                return fail(400, { error: true, codeNotMatch: true, errorCode: true });
            }

            // turnstile captcha validation
            const token = data.get('cf-turnstile-response');
            const { validateSuccess, validateError } = await validateToken(String(token), TURNSTILE_SECRET_KEY);
            if (!validateSuccess) {
                return fail(400, { error: true, errorCaptcha: true, errorCaptchaMsg: `${validateError}. Please try again.` || LL.error['invalidCaptcha']() });
            }

            currentCharData = await db.characters.findMany({
                where: {
                    user_id: currentUserId,
                },
                select: {
                    id: true,
                    name: true,
                    hrp: true,
                    gr: true,
                    weapon_type: true,
                },
            });
            const characterData = currentCharData
                .filter((c) => c.id !== currentCharId)
                .map(({ hrp: hr, weapon_type: weapon, ...rest }) => {
                    if (rest.id !== currentCharId) return { id: rest.id, name: rest.name, hr: convHrpToHr(hr), gr: rest.gr, weapon: getWpnTypeByDec(weapon, locale) };
                });

            return { currentStage: 2, nextStage: 3, characterData };
        }

        case 3: {
            const { character_data } = convFormDataToObj(data);
            const charData: string[] = String(character_data).split('-');
            const charId: number = Number(charData[0]);
            const charName: string = charData[1];

            const { fetchData, resStatus, resStatusText } = await (async () => {
                try {
                    const res = await fetch(`https://api.rain-server.com/link-discord/${userKey}`, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                            'Origin': url.origin,
                        },
                    });

                    const fetchData = (await res.json()) as LinkDiscordGetData;
                    const resStatus = res.status;
                    const resStatusText = res.statusText;

                    return { fetchData, resStatus, resStatusText };
                } catch (err) {
                    if (err instanceof Error) {
                        throw error(400, { message: '', message1: LL.error['failedApiMsg1'](), message2: [err.message], message3: LL.error['startOverMsg3']() });
                    } else if (typeof err === 'string') {
                        throw error(400, { message: '', message1: LL.error['failedApiMsg1'](), message2: [err], message3: LL.error['startOverMsg3']() });
                    } else {
                        throw error(400, { message: '', message1: LL.error['failedApiMsg1'](), message2: undefined, message3: LL.error['startOverMsg3']() });
                    }
                }
            })();

            if (resStatus !== 200) {
                throw error(resStatus as NumericRange<400, 599>, {
                    message: '',
                    message1: LL.error['failedApiMsg1'](),
                    message2:
                        resStatusText === 'PARAMS_UNDEFINED'
                            ? [LL.error['paramsUndefined']()]
                            : resStatusText === 'NO_DATA'
                            ? [LL.error['noPreRegData'](), LL.error['sessionExpired']()]
                            : resStatusText === 'UNEXPECTED'
                            ? [LL.error['unexpectedErr']()]
                            : [resStatusText],
                    message3: LL.error['startOverMsg3'](),
                });
            }

            const filteredChar = _.find(currentCharData, (data) => data.id === charId);
            if (!filteredChar) {
                throw error(400, {
                    message: '',
                    message1: LL.error['linkDiscord'].failedLinkMsg1(),
                    message2: [LL.error['linkDiscord'].noCharacter({ name: charName })],
                    message3: LL.error['startOverMsg3'](),
                });
            }

            try {
                await db.discord.update({
                    where: {
                        discord_id: fetchData.discord_id,
                    },
                    data: {
                        char_id: charId,
                    },
                });

                return { currentStage: 3, nextStage: 4 };
            } catch (err) {
                if (err instanceof Error) {
                    throw error(400, { message: '', message1: LL.error['linkDiscord'].failedLinkMsg1(), message2: [err.message], message3: LL.error['startOverMsg3']() });
                } else if (typeof err === 'string') {
                    throw error(400, { message: '', message1: LL.error['linkDiscord'].failedLinkMsg1(), message2: [err], message3: LL.error['startOverMsg3']() });
                } else {
                    throw error(400, { message: '', message1: LL.error['linkDiscord'].failedLinkMsg1(), message2: undefined, message3: LL.error['startOverMsg3']() });
                }
            }
        }

        default: {
            return { error: true, unauthOps: true };
        }
    }
};

export const actions: Actions = { linkDiscord };
