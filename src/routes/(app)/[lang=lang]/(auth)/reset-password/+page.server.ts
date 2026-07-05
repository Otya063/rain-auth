import type { Action, Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { TURNSTILE_SECRET_KEY } from '$env/static/private';
import { PostgresManager, getUserData, sendDirectMessages, convFormDataToObj, validateToken } from '$lib/utils/server';
import type { ResetPasswordData } from '$lib/types';
import bcrypt from 'bcryptjs';
import { DateTime } from 'luxon';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-])(?=.*\d).{10,32}$/;
const RESET_PASSWORD_TTL_SECONDS = 60 * 10;

let resetPasswordData: ResetPasswordData | undefined;
let resetPasswordStartTime: DateTime | undefined;
let hashedVerificationCode: string | undefined;

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
    const { charId: linkedCharId, userId: linkedUserId } = await new PostgresManager('get', 'discordData', { discordId }).execute();
    if (!linkedCharId || !linkedUserId) {
        throw error(400, { message: '', message1: LL.error['oauth'].message1(), message2: [LL.error['resetPassword'].noLinkedUser()], message3: LL.error['linkDiscordFirst']() });
    }

    const resetPassUserData = await new PostgresManager('get', 'userById', { id: linkedUserId }).execute();
    if (!resetPassUserData) {
        throw error(400, { message: '', message1: LL.error['oauth'].message1(), message2: [LL.error['oauth'].failedGetUser()], message3: LL.error['startOverMsg3']() });
    }

    tokenData = null;

    resetPasswordData = { discordAccessToken, discordId, userId: resetPassUserData.id, username: resetPassUserData.username };
    resetPasswordStartTime = DateTime.local();

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

    return { username: resetPassUserData.username };
};

const resetPassword: Action = async ({ request, locals: { LL } }) => {
    const data = await request.formData();
    const { stage } = convFormDataToObj(data);

    switch (Number(stage)) {
        case 1: {
            return { currentStage: 1, nextStage: 2 };
        }

        case 2: {
            if (!hashedVerificationCode) {
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

            return { currentStage: 2, nextStage: 3 };
        }

        case 3: {
            if (!resetPasswordData || !resetPasswordStartTime) {
                return fail(400, { error: true, unauthOps: true });
            }

            const { password, conf_password } = convFormDataToObj(data);

            // パスワードのバリデーション
            if (typeof password !== 'string' || typeof conf_password !== 'string' || !password || !conf_password) {
                return fail(400, { error: true, invalidPassword: true, errorPassword: true });
            }
            if (password !== conf_password) {
                return fail(400, { error: true, invalidConfPassword: true, errorPassword: true });
            }
            if (!passwordRegex.test(password)) {
                return fail(400, { error: true, invalidPasswordStrength: true, errorPassword: true });
            }

            // セッションの検証
            const elapsedSeconds = DateTime.local().diff(resetPasswordStartTime, 'seconds').seconds;
            if (elapsedSeconds > RESET_PASSWORD_TTL_SECONDS) {
                throw error(400, { message: '', message1: LL.error['failedApiMsg1'](), message2: [LL.error['noPreRegData'](), LL.error['sessionExpired']()], message3: LL.error['startOverMsg3']() });
            }

            const { userId, username } = resetPasswordData;
            const currentUser = await new PostgresManager('get', 'userByUsername', { username }).execute();
            if (currentUser && (await bcrypt.compare(password, currentUser.password))) {
                return fail(400, { error: true, samePassword: true, errorPassword: true });
            }

            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(password, salt);

            const { success: passwordUpdated, message: updateMsg } = await new PostgresManager('update', 'password', { id: userId, username, value: hashedPassword }).execute();
            if (!passwordUpdated) {
                throw error(400, { message: '', message1: LL.error['resetPassword'].failedResetMsg1(), message2: [updateMsg || LL.error['noUserData']()], message3: LL.error['startOverMsg3']() });
            }

            resetPasswordData = undefined;
            resetPasswordStartTime = undefined;
            hashedVerificationCode = undefined;

            return { currentStage: 3, nextStage: 4 };
        }

        default: {
            return { error: true, unauthOps: true };
        }
    }
};

export const actions: Actions = { resetPassword };
