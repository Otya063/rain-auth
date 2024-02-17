import type { Action, Actions, PageServerLoad } from './$types';
import type { users } from '@prisma/client/edge';
import { redirect, error, fail } from '@sveltejs/kit';
import { PUBLIC_AUTH_DOMAIN } from '$env/static/public';
import { COOKIES_DOMAIN, DISCORD_CLIENT_ID, TURNSTILE_SECRET_KEY } from '$env/static/private';
import ServerData, { db } from '$lib/database';
import { convFormDataToObj, getRandomString, validateToken } from '$lib/utils';
import bcrypt from 'bcryptjs';

export const load: PageServerLoad = async ({ url }) => {
    const redirectURL: string | null = url.searchParams.get('redirect_url');
    const reqType: string | null = url.searchParams.get('type');
    if (reqType === 'reset-password' || reqType === 'link-discord' || reqType === 'register') {
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

    // turnstile captcha validation
    const token = data.get('cf-turnstile-response');
    const { validateSuccess, validateError } = await validateToken(String(token), TURNSTILE_SECRET_KEY);
    if (!validateSuccess) {
        return fail(400, { error: true, errorCaptcha: true, errorCaptchaMsg: `${validateError}. Please try again.` || LL.error['invalidCaptcha']() });
    }

    try {
        const regex = /iphone;|(android|nokia|blackberry|bb10;).+mobile|android.+fennec|opera.+mobi|windows phone|symbianos/i;
        const isMobile = regex.test(request.headers.get('user-agent')!);

        const authUser = !isMobile
            ? // pc
              await db.users.update({
                  where: {
                      username: String(username),
                  },
                  data: {
                      web_login_key: getRandomString(32),
                  },
              })
            : // mobile
              await db.users.update({
                  where: {
                      username: String(username),
                  },
                  data: {
                      web_login_key_mobile: getRandomString(32),
                  },
              });

        const userLoginKey = !isMobile ? authUser.web_login_key! : authUser.web_login_key_mobile!;

        cookies.set('rainLoginKey', userLoginKey, {
            domain: COOKIES_DOMAIN,
            path: '/',
            maxAge: remember_me === 'on' ? 60 * 60 * 24 * 30 : undefined,
            secure: true,
            httpOnly: true,
        });

        return { redirect: true };
    } catch (err) {
        if (err instanceof Error) {
            throw error(400, { message: '', message1: LL.error['login'].failedLoginMsg1(), message2: [err.message], message3: undefined });
        } else if (typeof err === 'string') {
            throw error(400, { message: '', message1: LL.error['login'].failedLoginMsg1(), message2: [err], message3: undefined });
        } else {
            throw error(400, { message: '', message1: LL.error['login'].failedLoginMsg1(), message2: undefined, message3: undefined});
        }
    }
};

export const actions: Actions = { login };
