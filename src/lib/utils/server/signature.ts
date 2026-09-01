/* 一時セッションペイロードの署名・検証（HMAC-SHA256）
   cookieに載せるデータは利用者が書き換えられるため、署名で改竄を弾き有効期限も内側に持たせる
====================================================*/

// グローバルスコープでは暗号処理を実行できないため呼び出しごとにimportする
const getSigningKey = (secret: string) => crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);

const encodeBase64Url = (bytes: Uint8Array): string =>
    btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

const decodeBase64Url = (value: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

export const signPayload = async (secret: string, data: object, ttlSeconds: number): Promise<string> => {
    const payload = encodeBase64Url(new TextEncoder().encode(JSON.stringify({ ...data, exp: Math.floor(Date.now() / 1000) + ttlSeconds })));
    const signature = await crypto.subtle.sign('HMAC', await getSigningKey(secret), new TextEncoder().encode(payload));

    return `${payload}.${encodeBase64Url(new Uint8Array(signature))}`;
};

/* 署名と有効期限を検証して取り出す 不正・期限切れはnull（旧KVエントリのexpirationTtlに相当）
====================================================*/
export const verifyPayload = async <T>(secret: string, token: string): Promise<T | null> => {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) {
        return null;
    }

    try {
        const valid = await crypto.subtle.verify('HMAC', await getSigningKey(secret), decodeBase64Url(signature), new TextEncoder().encode(payload));
        if (!valid) {
            return null;
        }

        const data = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload)));

        return data.exp > Math.floor(Date.now() / 1000) ? (data as T) : null;
    } catch {
        return null;
    }
};
