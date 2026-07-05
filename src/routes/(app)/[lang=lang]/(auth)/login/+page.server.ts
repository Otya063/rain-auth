import type { Action, Actions, PageServerLoad } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { PUBLIC_AUTH_DOMAIN } from '$env/static/public';
import { COOKIES_DOMAIN, DISCORD_CLIENT_ID, TURNSTILE_SECRET_KEY } from '$env/static/private';
import { PostgresManager, convFormDataToObj, getRandomString, validateToken } from '$lib/utils/server';
import bcrypt from 'bcryptjs';

const mobileUserAgentRegex = /iphone;|(android|nokia|blackberry|bb10;).+mobile|android.+fennec|opera.+mobi|windows phone|symbianos/i;

export const load: PageServerLoad = async ({ url }) => {
    const redirectURL: string | null = url.searchParams.get('redirect_url');
    const reqType: string | null = url.searchParams.get('type');
    if (reqType === 'reset-password' || reqType === 'link-discord' || reqType === 'register' || reqType === 'switch-character') {
        throw redirect(
            303,
            `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&response_type=code&redirect_uri=${decodeURIComponent(
                PUBLIC_AUTH_DOMAIN
            )}%2Foauth%2F%3FreqType%3D${reqType}&scope=identify+guilds`
        );
    } else {
        return { redirectURL };
    }
};

const login: Action = async ({ request, cookies, locals: { LL } }) => {
    const data = await request.formData();
    const { username, password, remember_me } = convFormDataToObj(data);

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

    // turnstileキャプチャの検証
    const token = data.get('cf-turnstile-response');
    const { validateSuccess, validateError } = await validateToken(String(token), TURNSTILE_SECRET_KEY);
    if (!validateSuccess) {
        return fail(400, { error: true, errorCaptcha: true, errorCaptchaMsg: `${validateError}. Please try again.` || LL.error['invalidCaptcha']() });
    }

    const isMobile = mobileUserAgentRegex.test(request.headers.get('user-agent')!);
    const userLoginKey = getRandomString(32);
    const { success: keyUpdated, message: keyUpdateMsg } = await new PostgresManager('update', 'loginKey', {
        username,
        column: isMobile ? 'web_login_key_mobile' : 'web_login_key',
        value: userLoginKey,
    }).execute();
    if (!keyUpdated) {
        return fail(400, { error: true, errorServer: true, errorServerMsg: `${LL.error['login'].failedLoginMsg1()} ${keyUpdateMsg || LL.error['unexpectedErr']()}` });
    }

    cookies.set('rainLoginKey', userLoginKey, {
        domain: COOKIES_DOMAIN,
        path: '/',
        maxAge: remember_me === 'on' ? 60 * 60 * 24 * 30 : undefined,
        secure: true,
        httpOnly: true,
    });

    return { redirect: true };
};

export const actions: Actions = { login };
