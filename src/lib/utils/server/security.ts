import type { ValidateToken, TokenValidateResponse } from '$lib/types';

/* トークン用ランダム文字列の生成
====================================================*/
export const getRandomString = (length: number): string => {
    const randomValues = crypto.getRandomValues(new Uint8Array(length));
    const base64url = btoa(String.fromCharCode(...randomValues))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    return base64url;
};

/* Turnstileトークンの検証
====================================================*/
export const validateToken = async (token: string, secret: string): Promise<ValidateToken> => {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            response: token,
            secret: secret,
        }),
    });

    const data: TokenValidateResponse = await res.json();

    return {
        // ステータスを返す
        validateSuccess: data.success,

        // 最初のエラーがあれば返す
        validateError: data['error-codes']?.length ? data['error-codes'][0] : null,
    };
};
