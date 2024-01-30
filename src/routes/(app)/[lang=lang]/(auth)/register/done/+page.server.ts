import type { PageServerLoad } from '../$types';
import type { discord, discord_register } from '@prisma/client/edge';
import { error, type Action, fail, type Actions, type NumericRange } from '@sveltejs/kit';
import { COOKIES_DOMAIN, TURNSTILE_SECRET_KEY } from '$env/static/private';
import ServerData, { db } from '$lib/database';
import { getGuildMember, getUserData, addRoleToUser, sendDirectMessages } from '$lib/discord';
import type { PreRegisterGetData, RainApiPostResponseData } from '$lib/types';
import { convFormDataToObj, validateToken } from '$lib/utils';
import bcrypt from 'bcryptjs';

let hashedVerificationCode: string;
let userKey: string;

export const load: PageServerLoad = async ({ url, cookies, locals: { LL, tokenData } }) => {
    const code = url.searchParams.get('code');
    const username = cookies.get('username');
    const hashedPassword = cookies.get('hashedPassword');
    if (!code || !username || !hashedPassword) {
        throw error(401, { message: '', message1: LL.error['oauth'].message1(), message2: [LL.error['oauth'].noDataForAuth()], message3: LL.error['oauth'].noDataForAuthMsg3() });
    }

    cookies.delete('username', {
        domain: COOKIES_DOMAIN,
        path: '/',
        secure: true,
        httpOnly: true,
    });
    cookies.delete('hashedPassword', {
        domain: COOKIES_DOMAIN,
        path: '/',
        secure: true,
        httpOnly: true,
    });

    if (!tokenData) {
        throw error(401, { message: '', message1: LL.error['oauth'].message1(), message2: [LL.error['oauth'].failedGetToken()], message3: LL.error['startOverMsg3']() });
    }

    const userData = await getUserData(tokenData.access_token);
    if (!userData) {
        throw error(400, { message: '', message1: LL.error['oauth'].message1(), message2: [LL.error['oauth'].failedGetUser()], message3: LL.error['startOverMsg3']() });
    }

    const discordAccessToken = tokenData.access_token;
    const discordId = userData.id;
    const discordData: discord | null = await ServerData.getLinkedCharactersByDiscordId(discordId);
    const discordRegisterData: discord_register | null = await ServerData.getLinkedUserByDiscordId(discordId);
    if (discordData || discordRegisterData) {
        throw error(400, { message: '', message1: LL.error['linkDiscord'].failedLinkMsg1(), message2: [LL.error['linkDiscord'].existLinkedUser()], message3: LL.error['startOverMsg3']() });
    }

    tokenData = null;
    let resStatus: number;
    let resStatusText: string;
    try {
        const res = await fetch(`https://api.rain-server.com/preregister`, {
            method: 'POST',
            body: JSON.stringify({ discord_access_token: discordAccessToken, discord_id: discordId, username, hashed_password: hashedPassword }),
            headers: {
                'Content-Type': 'application/json',
                'Origin': url.origin,
            },
        });
        const resJson: RainApiPostResponseData = await res.json();
        resStatus = res.status;
        resStatusText = res.statusText;
        userKey = resJson.user_key;
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
    const createdDM = await sendDirectMessages(userData.id, plainVerificationCode, 5, 'register', LL);
    if (!createdDM) {
        throw error(400, {
            message: '',
            message1: LL.error['oauth'].message1(),
            message2: [LL.error['resetPassword'].failedSendDM()],
            message3: LL.error['resetPassword'].failedSendDMMsg3(),
        });
    }
};

const register: Action = async ({ url, request, locals: { LL } }) => {
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

            let fetchData: PreRegisterGetData;
            let resStatus: number;
            let resStatusText: string;
            try {
                const res = await fetch(`https://api.rain-server.com/preregister/${userKey}`, {
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

            try {
                // create user account
                const createdUser = await db.users.create({
                    data: {
                        username: fetchData.username,
                        password: fetchData.hashed_password,
                    },
                });

                const userId = createdUser.id;

                const lastLoginTime = Math.floor(Date.now() / 1000);

                // create first character
                const createdChar = await db.characters.create({
                    data: {
                        user_id: userId,
                        is_female: false,
                        is_new_character: true,
                        last_login: lastLoginTime,
                    },
                });

                const charId = createdChar.id;

                // link discord
                await db.discord.create({
                    data: {
                        char_id: charId,
                        discord_id: fetchData.discord_id,
                    },
                });
                await db.discord_register.create({
                    data: {
                        user_id: userId,
                        discord_id: fetchData.discord_id,
                    },
                });

                return { currentStage: 2, nextStage: 3 };
            } catch (err) {
                if (err instanceof Error) {
                    throw error(400, { message: '', message1: LL.error['register'].failedRegisterMsg1(), message2: [err.message], message3: LL.error['startOverMsg3']() });
                } else if (typeof err === 'string') {
                    throw error(400, { message: '', message1: LL.error['register'].failedRegisterMsg1(), message2: [err], message3: LL.error['startOverMsg3']() });
                } else {
                    throw error(400, { message: '', message1: LL.error['register'].failedRegisterMsg1(), message2: [''], message3: LL.error['startOverMsg3']() });
                }
            }
        }

        default: {
            return { error: true, unauthOps: true };
        }
    }
};

export const actions: Actions = { register };
