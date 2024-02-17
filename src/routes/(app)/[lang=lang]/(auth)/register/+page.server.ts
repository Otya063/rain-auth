import type { Action, Actions } from './$types';
import type { users } from '@prisma/client/edge';
import { fail } from '@sveltejs/kit';
import { COOKIES_DOMAIN, TURNSTILE_SECRET_KEY } from '$env/static/private';
import ServerData from '$lib/database';
import { convFormDataToObj, validateToken } from '$lib/utils';
import bcrypt from 'bcryptjs';

const prepRegister: Action = async ({ request, cookies, locals: { LL } }) => {
    const data = await request.formData();
    const { stage } = convFormDataToObj(data);

    switch (Number(stage)) {
        case 1: {
            const { username, password, conf_password } = convFormDataToObj(data);
            const salt = await bcrypt.genSalt(12);
            const hashed_pass = await bcrypt.hash(String(password), salt);
            const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-])(?=.*\d).{10,32}$/;

            // username validations
            if (typeof username !== 'string' || !username) {
                return fail(400, { error: true, invalidUsername: true, errorUsername: true });
            }
            if (!/^([a-zA-Z0-9]{6,20})$/.test(String(username))) {
                return fail(400, { error: true, invalidUsernameChar: true, errorUsername: true });
            }

            const userExist: users | null = await ServerData.getUserByUsername(String(username));
            if (userExist) {
                return fail(400, { error: true, userExist: true, errorUsername: true });
            }

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

            // turnstile captcha validation
            const token = data.get('cf-turnstile-response');
            const { validateSuccess, validateError } = await validateToken(String(token), TURNSTILE_SECRET_KEY);
            if (!validateSuccess) {
                return fail(400, { error: true, errorCaptcha: true, errorCaptchaMsg: `${validateError}. Please try again.` || LL.error['invalidCaptcha']() });
            }

            cookies.set('username', String(username), {
                domain: COOKIES_DOMAIN,
                path: '/',
                secure: true,
                httpOnly: true,
            });
            cookies.set('hashedPassword', hashed_pass, {
                domain: COOKIES_DOMAIN,
                path: '/',
                secure: true,
                httpOnly: true,
            });

            return { currentStage: 1, nextStage: 2 };
        }

        case 2: {
            return { currentStage: 2 };
        }

        default: {
            return { error: true, unauthOps: true };
        }
    }
};

export const actions: Actions = { prepRegister };
