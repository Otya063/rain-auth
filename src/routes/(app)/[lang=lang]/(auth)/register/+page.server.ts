import type { Action, Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { COOKIES_DOMAIN, TURNSTILE_SECRET_KEY } from '$env/static/private';
import { PostgresManager, getGuildMember, getUserData, addRoleToUser, sendDirectMessages, convFormDataToObj, validateToken } from '$lib/utils/server';
import type { PreRegisterData } from '$lib/types';
import bcrypt from 'bcryptjs';
import { DateTime } from 'luxon';

const usernameRegex = /^[a-zA-Z0-9]{6,20}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-])(?=.*\d).{10,32}$/;
const PRE_REGISTER_TTL_SECONDS = 60 * 5;

let preRegisterData: PreRegisterData | undefined;
let preRegisterStartTime: DateTime | undefined;
let hashedVerificationCode: string | undefined;

export const load: PageServerLoad = async ({ url, cookies, locals: { LL, tokenData } }) => {
    const code = url.searchParams.get('code');
    if (!code) {
        // discord認証前のアクセス ロードするものはまだなくstage1のフォームで処理する
        return;
    }

    const username = cookies.get('username');
    const hashedPassword = cookies.get('hashedPassword');
    if (!username || !hashedPassword) {
        throw error(401, { message: '', message1: LL.error['oauth'].message1(), message2: [LL.error['oauth'].noDataForAuth()], message3: LL.error['oauth'].noDataForAuthMsg3() });
    }

    cookies.delete('username', { domain: COOKIES_DOMAIN, path: '/', secure: true, httpOnly: true });
    cookies.delete('hashedPassword', { domain: COOKIES_DOMAIN, path: '/', secure: true, httpOnly: true });

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
    if (linkedCharId || linkedUserId) {
        throw error(400, { message: '', message1: LL.error['linkDiscord'].failedLinkMsg1(), message2: [LL.error['linkDiscord'].existLinkedUser()], message3: LL.error['startOverMsg3']() });
    }

    tokenData = null;

    preRegisterData = { discordAccessToken, discordId, username, hashedPassword };
    preRegisterStartTime = DateTime.local();

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

const register: Action = async ({ request, cookies, locals: { LL } }) => {
    const data = await request.formData();
    const { stage } = convFormDataToObj(data);

    switch (Number(stage)) {
        case 1: {
            const { username, password, conf_password } = convFormDataToObj(data);

            // ユーザー名のバリデーション
            if (typeof username !== 'string' || !username) {
                return fail(400, { error: true, invalidUsername: true, errorUsername: true });
            }
            if (!usernameRegex.test(username)) {
                return fail(400, { error: true, invalidUsernameChar: true, errorUsername: true });
            }

            const userExist = await new PostgresManager('get', 'chkUserExist', { username }).execute();
            if (userExist) {
                return fail(400, { error: true, userExist: true, errorUsername: true });
            }

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

            // turnstileキャプチャの検証
            const token = data.get('cf-turnstile-response');
            const { validateSuccess, validateError } = await validateToken(String(token), TURNSTILE_SECRET_KEY);
            if (!validateSuccess) {
                return fail(400, { error: true, errorCaptcha: true, errorCaptchaMsg: `${validateError}. Please try again.` || LL.error['invalidCaptcha']() });
            }

            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(password, salt);

            cookies.set('username', username, { domain: COOKIES_DOMAIN, path: '/', secure: true, httpOnly: true });
            cookies.set('hashedPassword', hashedPassword, { domain: COOKIES_DOMAIN, path: '/', secure: true, httpOnly: true });

            return { currentStage: 1, nextStage: 2 };
        }

        case 2: {
            // 通知のみのstage discordへリダイレクトする直前でバリデーション不要
            return { currentStage: 2 };
        }

        case 3: {
            // 通知のみのstage DMで認証コードを送信した直後でバリデーション不要
            return { currentStage: 3, nextStage: 4 };
        }

        case 4: {
            if (!preRegisterData || !preRegisterStartTime || !hashedVerificationCode) {
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

            // セッションの検証（旧KVエントリのexpirationTtlに相当）
            const elapsedSeconds = DateTime.local().diff(preRegisterStartTime, 'seconds').seconds;
            if (elapsedSeconds > PRE_REGISTER_TTL_SECONDS) {
                throw error(400, { message: '', message1: LL.error['failedApiMsg1'](), message2: [LL.error['noPreRegData'](), LL.error['sessionExpired']()], message3: LL.error['startOverMsg3']() });
            }

            const { discordAccessToken, discordId, username, hashedPassword } = preRegisterData;

            const guildMemberData = await getGuildMember(discordAccessToken);
            if (!guildMemberData) {
                throw error(400, { message: '', message1: LL.error['linkDiscord'].failedLinkMsg1(), message2: [LL.error['linkDiscord'].notJoinedDiscord()], message3: LL.error['startOverMsg3']() });
            }

            if (!guildMemberData.roles.includes('1017643913667936318')) {
                const registeredRoleStatus = await addRoleToUser(discordId, '1017643913667936318');
                if (registeredRoleStatus !== 204) {
                    throw error(400, {
                        message: '',
                        message1: LL.error['linkDiscord'].failedLinkMsg1(),
                        message2: [LL.error['linkDiscord'].failedAddRole()],
                        message3: LL.error['linkDiscord'].failedAddRoleMsg3(),
                    });
                }
            }

            // ユーザーアカウントと最初のキャラクターをまとめて作成
            const { success: accountCreated, message: accountMsg, userId, charId } = await new PostgresManager('create', 'account', { username, hashedPassword }).execute();
            if (!accountCreated || !userId || !charId) {
                throw error(400, { message: '', message1: LL.error['register'].failedCreateUser(), message2: [accountMsg], message3: LL.error['startOverMsg3']() });
            }

            // ディスコード連携(discordとdiscord_registerをまとめて処理)
            const { success: discordLinked, message: discordLinkMsg } = await new PostgresManager('create', 'discordLink', { charId, userId, discordId }).execute();
            if (!discordLinked) {
                throw error(400, { message: '', message1: LL.error['register'].failedRegisterMsg1(), message2: [discordLinkMsg], message3: LL.error['startOverMsg3']() });
            }

            preRegisterData = undefined;
            preRegisterStartTime = undefined;
            hashedVerificationCode = undefined;

            return { currentStage: 4, nextStage: 5 };
        }

        default: {
            return { error: true, unauthOps: true };
        }
    }
};

export const actions: Actions = { register };
