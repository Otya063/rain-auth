import type { Handle, RequestEvent } from '@sveltejs/kit';
import { ADMIN_CREDENTIALS } from '$env/static/private';
import { PUBLIC_AUTH_DOMAIN } from '$env/static/public';
import type { Locales } from '$i18n/i18n-types';
import { loadAllLocales } from '$i18n/i18n-util.sync';
import { detectLocale, i18n, isLocale } from '$i18n/i18n-util';
import { getToken } from '$lib/discord';
import { initAcceptLanguageHeaderDetector } from 'typesafe-i18n/detectors';

loadAllLocales();
const L = i18n();

export const handle: Handle = async ({ event, resolve }) => {
    // basic auth for accessing dev site
    const auth = event.request.headers.get('Authorization');
    if (event.url.origin.includes('auth.dev')) {
        if (auth !== `Basic ${btoa(ADMIN_CREDENTIALS)}`) {
            return new Response('Unauthorized User', {
                status: 401,
                headers: {
                    'WWW-Authenticate': 'Basic realm="Incorrect credentials.", charset="UTF-8"',
                },
            });
        }
    }

    if (event.platform?.env.MAINTENANCE_MODE === 'true' && event.url.pathname !== '/maintenance/') {
        return new Response(null, {
            status: 302,
            headers: { Location: '/maintenance' },
        });
    }

    const [, lang] = event.url.pathname.split('/');
    const locale = isLocale(lang) ? (lang as Locales) : getPreferredLocale(event);
    const LL = L[locale];

    event.locals.locale = locale;
    event.locals.LL = LL;

    if (!lang) {
        const redirectUrl = `${PUBLIC_AUTH_DOMAIN}/${locale}/login`;
        return new Response(null, {
            status: 302,
            headers: { Location: redirectUrl },
        });
    }

    const pathname = event.url.pathname.replace(/\/ja\/|\/en\//, '');
    if (pathname === '/oauth/') {
        let type: string | null;
        let redirectUrl: string;
        event.url.searchParams.get('reqType') === 'register' ? (type = 'register/done') : (type = event.url.searchParams.get('reqType'));
        const code = event.url.searchParams.get('code');

        if (!code || !type) {
            return resolve(event, {
                transformPageChunk: ({ html }) => html.replace('%lang%', locale),
            });
        }

        redirectUrl = `${PUBLIC_AUTH_DOMAIN}/${event.locals.locale}/${type}/?code=${code}`;
        return new Response(null, {
            status: 302,
            headers: { Location: redirectUrl },
        });
    } else if (pathname === 'reset-password/' || pathname === 'link-discord/' || pathname === 'register/done/') {
        const code = event.url.searchParams.get('code')!;
        let type: string;
        pathname === 'register/done/' ? (type = 'register') : (type = pathname.replace('/', ''));
        event.locals.tokenData = await getToken(code, type);
    }

    return resolve(event, {
        transformPageChunk: ({ html }) => html.replace('%lang%', locale),
    });
};

const getPreferredLocale = ({ request }: RequestEvent) => {
    const acceptLanguageDetector = initAcceptLanguageHeaderDetector(request);
    return detectLocale(acceptLanguageDetector);
};
