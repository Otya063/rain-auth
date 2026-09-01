import type { Action, Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { TURNSTILE_SECRET_KEY } from '$env/static/private';
import { PostgresManager, getUserData, sendDirectMessages, convFormDataToObj, validateToken, setSession, getSession, clearSession } from '$lib/utils/server';
import type { ResetPasswordData } from '$lib/types';
import bcrypt from 'bcryptjs';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-])(?=.*\d).{10,32}$/;
const SESSION_NAME = 'resetPassword';
const RESET_PASSWORD_TTL_SECONDS = 60 * 10;

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
    const { charId: linkedCharId, userId: linkedUserId } = await new PostgresManager('get', 'discordData', { discordId }).execute();
    if (!linkedCharId || !linkedUserId) {
        throw error(400, { message: '', message1: LL.error['oauth'].message1(), message2: [LL.error['resetPassword'].noLinkedUser()], message3: LL.error['linkDiscordFirst']() });
    }

    const resetPassUserData = await new PostgresManager('get', 'userById', { id: linkedUserId }).execute();
    if (!resetPassUserData) {
        throw error(400, { message: '', message1: LL.error['oauth'].message1(), message2: [LL.error['oauth'].failedGetUser()], message3: LL.error['startOverMsg3']() });
    }

    tokenData = null;

    const salt = await bcrypt.genSalt(12);
    const plainVerificationCode = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16)))).substring(0, 16);
    const hashedVerificationCode = await bcrypt.hash(plainVerificationCode, salt);
    const createdDM = await sendDirectMessages(discordId, plainVerificationCode, 10, 'reset-password', LL);
    if (!createdDM) {
        throw error(400, {
            message: '',
            message1: LL.error['oauth'].message1(),
            message2: [LL.error['resetPassword'].failedSendDM()],
            message3: LL.error['resetPassword'].failedSendDMMsg3(),
        });
    }

    await setSession(cookies, SESSION_NAME, { userId: resetPassUserData.id, username: resetPassUserData.username, hashedVerificationCode }, RESET_PASSWORD_TTL_SECONDS);

    return { username: resetPassUserData.username };
};

const resetPassword: Action = async ({ request, cookies, locals: { LL } }) => {
    const data = await request.formData();
    const { stage } = convFormDataToObj(data);

    // セッションの検証（未開始・改竄・期限切れをまとめて弾く）
    const session = await getSession<ResetPasswordData>(cookies, SESSION_NAME);
    if (Number(stage) > 1 && !session) {
        throw error(400, { message: '', message1: LL.error['failedApiMsg1'](), message2: [LL.error['noPreRegData'](), LL.error['sessionExpired']()], message3: LL.error['startOverMsg3']() });
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

            const { userId, username } = session!;
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

            clearSession(cookies, SESSION_NAME);

            return { currentStage: 3, nextStage: 4 };
        }

        default: {
            return { error: true, unauthOps: true };
        }
    }
};

export const actions: Actions = { resetPassword };
