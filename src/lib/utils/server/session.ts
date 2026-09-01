import type { Cookies } from '@sveltejs/kit';
import { COOKIES_DOMAIN, DISCORD_CLIENT_SECRET } from '$env/static/private';
import { signPayload, verifyPayload } from './signature';

/* 認証フローの一時セッション（署名付きcookie）
   Workerのisolateは複数リクエストで共有されるため、モジュール変数に一時データを持つと
   同時アクセス時に他人のセッションを掴む。リクエストごとにcookieへ閉じ込める
====================================================*/

// ponytail: HMAC鍵はDISCORD_CLIENT_SECRETを流用。専用のSESSION_SECRETを切るならここを差し替える
const COOKIE_OPTIONS = { domain: COOKIES_DOMAIN, path: '/', secure: true, httpOnly: true } as const;

export const setSession = async (cookies: Cookies, name: string, data: object, ttlSeconds: number): Promise<void> =>
    cookies.set(name, await signPayload(DISCORD_CLIENT_SECRET, data, ttlSeconds), { ...COOKIE_OPTIONS, maxAge: ttlSeconds });

export const getSession = <T>(cookies: Cookies, name: string): Promise<T | null> => verifyPayload<T>(DISCORD_CLIENT_SECRET, cookies.get(name) ?? '');

export const clearSession = (cookies: Cookies, name: string): void => cookies.delete(name, COOKIE_OPTIONS);
