import type { PageServerLoad } from './$types';
import type { characters, discord, discord_register, users } from '@prisma/client/edge';
import { error, type Action, type Actions, fail, type NumericRange } from '@sveltejs/kit';
import { TURNSTILE_SECRET_KEY } from '$env/static/private';
import ServerData, { db } from '$lib/database';
import { getGuildMember, getUserData, addRoleToUser, sendDirectMessages } from '$lib/discord';
import type { LinkDiscordGetData, RainApiPostResponseData, LinkedCharacterData } from '$lib/types';
import { convFormDataToObj, convHrpToHr, getWpnTypeByDec, validateToken } from '$lib/utils';
import bcrypt from 'bcryptjs';
import _ from 'lodash';
import { DateTime } from 'luxon';

const startTime = DateTime.local();
let hashedVerificationCode: string;
let userKey: string;
let ttl: number;

export const load: PageServerLoad = async ({ url, locals: { LL, tokenData } }) => {
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
    if (discordData || discordRegisterData) {
        throw error(400, { message: '', message1: LL.error['oauth'].message1(), message2: [LL.error['linkDiscord'].existLinkedUser()], message3: LL.error['startOverMsg3']() });
    }

    tokenData = null;
    let resStatus: number;
    let resStatusText: string;
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
        resStatus = res.status;
        resStatusText = res.statusText;
        userKey = resJson.user_key;
        ttl = resJson.expire_ttl;
    } catch (err) {
        if (err instanceof Error) {
            throw error(400, { message: '', message1: LL.error['failedApiMsg1'](), message2: [err.message], message3: LL.error['startOverMsg3']() });
        } else if (typeof err === 'string') {
            throw error(400, { message: '', message1: LL.error['failedApiMsg1'](), message2: [err], message3: LL.error['startOverMsg3']() });
        } else {
            throw error(400, { message: '', message1: LL.error['failedApiMsg1'](), message2: [''], message3: LL.error['startOverMsg3']() });
        }
    }

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
    const createdDM = await sendDirectMessages(userData.id, plainVerificationCode, 10, 'link-discord', LL);
    if (!createdDM) {
        throw error(400, {
            message: '',
            message1: LL.error['oauth'].message1(),
            message2: [LL.error['resetPassword'].failedSendDM()],
            message3: LL.error['resetPassword'].failedSendDMMsg3(),
        });
    }

    return { discordId, discordUsername };
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

            return { currentStage: 2, nextStage: 3 };
        }

        case 3: {
            const { username, password } = convFormDataToObj(data);

            // username validations
            if (typeof username !== 'string' || !username) {
                return fail(400, { error: true, invalidUsername: true, errorUsername: true });
            }

            // check if the user exists
            const user: users | null = await ServerData.getUserByUsername(String(username));
            if (!user) {
                return fail(400, { error: true, noUser: true, errorUsername: true });
            }

            // password validations
            if (typeof password !== 'string' || !password) {
                return fail(400, { error: true, invalidPassword: true, errorPassword: true });
            }
            const correctPass = await bcrypt.compare(String(password), user.password);
            if (!correctPass) {
                return fail(400, { error: true, incPassword: true, errorPassword: true });
            }

            // check if the user account is linked
            const linkedUser: discord_register | null = await ServerData.getLinkedUserByUserId(user.id);
            if (linkedUser) {
                return fail(400, { error: true, userLinked: true, errorUsername: true, errorPassword: true });
            }

            const stage3Time = DateTime.local();
            const diffSecondsTime = String(stage3Time.diff(startTime, 'seconds').toObject().seconds);
            const restSecondsTime = ttl - Number(diffSecondsTime.substring(0, diffSecondsTime.indexOf('.')));
            if (Math.sign(restSecondsTime) === -1 || Math.sign(restSecondsTime) === 0) {
                throw error(401, { message: '', message1: LL.error['linkDiscord'].failedLinkMsg1(), message2: [LL.error['sessionExpired']()], message3: LL.error['startOverMsg3']() });
            }

            let resStatus: number;
            let resStatusText: string;
            try {
                const res = await fetch(`https://api.rain-server.com/link-discord/${userKey}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ rest_expire_ttl: restSecondsTime, user_id: user.id }),
                    headers: {
                        'Content-Type': 'application/json',
                        'Origin': url.origin,
                    },
                });
                resStatus = res.status;
                resStatusText = res.statusText;
            } catch (err) {
                if (err instanceof Error) {
                    throw error(400, { message: '', message1: LL.error['failedApiMsg1'](), message2: [err.message], message3: LL.error['startOverMsg3']() });
                } else if (typeof err === 'string') {
                    throw error(400, { message: '', message1: LL.error['failedApiMsg1'](), message2: [err], message3: LL.error['startOverMsg3']() });
                } else {
                    throw error(400, { message: '', message1: LL.error['failedApiMsg1'](), message2: [''], message3: LL.error['startOverMsg3']() });
                }
            }

            if (resStatus !== 204) {
                throw error(resStatus as NumericRange<400, 599>, {
                    message: '',
                    message1: LL.error['failedApiMsg1'](),
                    message2:
                        resStatusText === 'PARAMS_UNDEFINED'
                            ? [LL.error['paramsUndefined']()]
                            : resStatusText === 'NO_REQUIRED_DATA'
                            ? [LL.error['passedInvalidData']()]
                            : resStatusText === 'TIMEOUT'
                            ? [LL.error['sessionExpired']()]
                            : resStatusText === 'NO_DATA'
                            ? [LL.error['noPreRegData'](), LL.error['sessionExpired']()]
                            : resStatusText === 'UNEXPECTED'
                            ? [LL.error['unexpectedErr']()]
                            : [resStatusText],
                    message3: LL.error['startOverMsg3'](),
                });
            }

            const charData: characters[] = await ServerData.getCharactersByUserId(user.id);
            let characterData: LinkedCharacterData[] = [];
            charData.forEach((character) => {
                characterData.push({ id: character.id, name: character.name, hr: convHrpToHr(character.hrp), gr: character.gr, weapon: getWpnTypeByDec(character.weapon_type, locale) });
            });

            return { currentStage: 3, nextStage: 4, characterData };
        }

        case 4: {
            const { character_data } = convFormDataToObj(data);
            const charData: string[] = String(character_data).split('-');
            const charId: number = Number(charData[0]);
            const charName: string = charData[1];
            const charInfo: string = charData[2];

            let fetchData: LinkDiscordGetData;
            let resStatus: number;
            let resStatusText: string;
            try {
                const res = await fetch(`https://api.rain-server.com/link-discord/${userKey}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Origin': url.origin,
                    },
                });
                fetchData = await res.json();
                resStatus = res.status;
                resStatusText = res.statusText;
            } catch (err) {
                if (err instanceof Error) {
                    throw error(400, { message: '', message1: LL.error['failedApiMsg1'](), message2: [err.message], message3: LL.error['startOverMsg3']() });
                } else if (typeof err === 'string') {
                    throw error(400, { message: '', message1: LL.error['failedApiMsg1'](), message2: [err], message3: LL.error['startOverMsg3']() });
                } else {
                    throw error(400, { message: '', message1: LL.error['failedApiMsg1'](), message2: [''], message3: LL.error['startOverMsg3']() });
                }
            }

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

            //const guildMemberData = await getGuildMember('937230168223789066', fetchData.discord_access_token); prod
            const guildMemberData = await getGuildMember('1177982376945668146', fetchData.discord_access_token);
            if (!guildMemberData) {
                throw error(400, { message: '', message1: LL.error['linkDiscord'].failedLinkMsg1(), message2: [LL.error['linkDiscord'].notJoinedDiscord()], message3: LL.error['startOverMsg3']() });
            }

            // prod: 1017643913667936318
            if (!guildMemberData!.roles.includes('1181583278956892222')) {
                //const registeredRoleStatus: number = await addRoleToUser('937230168223789066', fetchData.discord_id, '1017643913667936318'); prod
                const registeredRoleStatus: number = await addRoleToUser('1177982376945668146', fetchData.discord_id, '1181583278956892222');
                if (registeredRoleStatus !== 204) {
                    throw error(400, {
                        message: '',
                        message1: LL.error['linkDiscord'].failedLinkMsg1(),
                        message2: [LL.error['linkDiscord'].failedAddRole()],
                        message3: LL.error['linkDiscord'].failedAddRoleMsg3(),
                    });
                }
            }

            const character: characters[] = await ServerData.getCharactersByUserId(fetchData.user_id!);
            const filteredChar: characters | undefined = _.find(character, (data) => data.id === charId);
            if (!filteredChar) {
                throw error(400, {
                    message: '',
                    message1: LL.error['linkDiscord'].failedLinkMsg1(),
                    message2: [LL.error['linkDiscord'].noCharacter({ name: charName })],
                    message3: LL.error['startOverMsg3'](),
                });
            }

            try {
                await db.discord.create({
                    data: {
                        char_id: charId,
                        discord_id: String(fetchData.discord_id),
                    },
                });

                await db.discord_register.create({
                    data: {
                        user_id: fetchData.user_id!,
                        discord_id: String(fetchData.discord_id),
                    },
                });

                return { currentStage: 4, nextStage: 5, discordUsername: fetchData.discord_username, discordAvatar: fetchData.discord_avatar, selectedCharName: charName, selectedCharInfo: charInfo };
            } catch (err) {
                if (err instanceof Error) {
                    throw error(400, { message: '', message1: LL.error['linkDiscord'].failedLinkMsg1(), message2: [err.message], message3: LL.error['startOverMsg3']() });
                } else if (typeof err === 'string') {
                    throw error(400, { message: '', message1: LL.error['linkDiscord'].failedLinkMsg1(), message2: [err], message3: LL.error['startOverMsg3']() });
                } else {
                    throw error(400, { message: '', message1: LL.error['linkDiscord'].failedLinkMsg1(), message2: [''], message3: LL.error['startOverMsg3']() });
                }
            }
        }

        default: {
            return { error: true, unauthOps: true };
        }
    }
};

export const actions: Actions = { linkDiscord };
