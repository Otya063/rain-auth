import type { PageServerLoad } from './$types';
import type { discord, discord_register, users } from '@prisma/client/edge';
import { fail, error, type Action, type Actions, type NumericRange } from '@sveltejs/kit';
import { TURNSTILE_SECRET_KEY } from '$env/static/private';
import ServerData, { db } from '$lib/database';
import { getUserData, sendDirectMessages } from '$lib/discord';
import type { RainApiPostResponseData, ResetPasswordGetData } from '$lib/types';
import { convFormDataToObj, validateToken } from '$lib/utils';
import bcrypt from 'bcryptjs';

let hashedVerificationCode: string;
let userKey: string;

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
    const discordData: discord | null = await ServerData.getLinkedCharactersByDiscordId(discordId);
    const discordRegisterData: discord_register | null = await ServerData.getLinkedUserByDiscordId(discordId);
    if (!discordData || !discordRegisterData) {
        throw error(400, { message: '', message1: LL.error['oauth'].message1(), message2: [LL.error['resetPassword'].noLinkedUser()], message3: LL.error['startOverMsg3']() });
    }

    const resetPassUserData: users | null = await ServerData.getUserByUserId(discordRegisterData.user_id);
    if (!resetPassUserData) {
        throw error(400, { message: '', message1: LL.error['oauth'].message1(), message2: [LL.error['oauth'].failedGetUser()], message3: LL.error['startOverMsg3']() });
    }

    tokenData = null;
    const userId = resetPassUserData.id;
    const username = resetPassUserData.username;
    let resStatus: number;
    let resStatusText: string;
    try {
        const res = await fetch(`https://api.rain-server.com/reset-password`, {
            method: 'POST',
            body: JSON.stringify({ discord_access_token: discordAccessToken, discord_id: discordId, user_id: userId, username }),
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
    const createdDM = await sendDirectMessages(userData.id, plainVerificationCode, 10, 'reset-password', LL);
    if (!createdDM) {
        throw error(400, {
            message: '',
            message1: LL.error['oauth'].message1(),
            message2: [LL.error['resetPassword'].failedSendDM()],
            message3: LL.error['resetPassword'].failedSendDMMsg3(),
        });
    }

    return { username };
};

const resetPassword: Action = async ({ url, request, locals: { LL } }) => {
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
            const { password, conf_password } = convFormDataToObj(data);
            const salt = await bcrypt.genSalt(12);
            const hashed_pass = await bcrypt.hash(String(password), salt);
            const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-])(?=.*\d).{10,32}$/;

            // password validations
            if (typeof password !== 'string' || typeof conf_password !== 'string' || !password || !conf_password) {
                return fail(400, { error: true, invalidPassword: true, errorPassword: true });
            }
            if (password !== conf_password) {
                return fail(400, { error: true, invalidConfPassword: true, errorPassword: true });
            }
            if (!passRegex.test(String(password))) {
                return fail(400, { error: true, invalidPasswordStrength: true, errorPassword: true });
            }

            let fetchData: ResetPasswordGetData;
            let resStatus: number;
            let resStatusText: string;
            try {
                const res = await fetch(`https://api.rain-server.com/reset-password/${userKey}`, {
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

            const user = await db.users.findFirst({
                where: {
                    id: fetchData.user_id,
                    username: fetchData.username,
                },
            });
            if (!user) {
                throw error(400, { message: '', message1: LL.error['resetPassword'].failedResetMsg1(), message2: [LL.error['noUserData']()], message3: LL.error['startOverMsg3']() });
            }

            try {
                await db.users.update({
                    where: {
                        id: fetchData.user_id,
                        username: fetchData.username,
                    },
                    data: {
                        password: hashed_pass,
                    },
                });

                return { currentStage: 3, nextStage: 4 };
            } catch (err) {
                if (err instanceof Error) {
                    throw error(400, { message: '', message1: LL.error['resetPassword'].failedResetMsg1(), message2: [err.message], message3: LL.error['startOverMsg3']() });
                } else if (typeof err === 'string') {
                    throw error(400, { message: '', message1: LL.error['resetPassword'].failedResetMsg1(), message2: [err], message3: LL.error['startOverMsg3']() });
                } else {
                    throw error(400, { message: '', message1: LL.error['resetPassword'].failedResetMsg1(), message2: [''], message3: LL.error['startOverMsg3']() });
                }
            }
        }

        default: {
            return { error: true, unauthOps: true };
        }
    }
};

export const actions: Actions = { resetPassword };
