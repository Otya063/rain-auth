import type { Locales } from '$i18n/i18n-types';
import type { WeaponType, ValidateToken, LinkedCharacterData, TokenValidateResponse } from '$lib/types';
import { writable, type Writable } from 'svelte/store';

export * from './converter';
export const showTip = writable(false);
export const linkCharsData: Writable<LinkedCharacterData[]> = writable([]);

/* Replaces the Locale Slug in a URL
====================================================*/
export const replaceLocaleInUrl = (url: URL, locale: string, full = false): string => {
    const [, , ...rest] = url.pathname.split('/');
    const new_pathname = `/${[locale, ...rest].join('/')}`;
    if (!full) {
        return `${new_pathname}${url.search}`;
    }
    const newUrl = new URL(url.toString());
    newUrl.pathname = new_pathname;
    newUrl.search = '';
    return newUrl.toString();
};

/* Switching Buttons During Authentication
====================================================*/
export const switchBtnInAuth = (enable: boolean, btnElm: HTMLElement | null, labelElm: HTMLCollectionOf<Element> | null = null, inputElm: NodeListOf<Element> | null = null): void => {
    if (enable) {
        btnElm?.classList.remove('loading_btn', 'disabled_elm');

        if (labelElm) {
            Array.from(labelElm).forEach((elm) => {
                elm.classList.remove('disabled_elm');
            });
        }

        inputElm?.forEach((elm) => {
            elm.classList.remove('disabled_elm');
        });
    } else {
        btnElm?.classList.add('loading_btn', 'disabled_elm');

        if (labelElm) {
            Array.from(labelElm).forEach((elm) => {
                elm.classList.add('disabled_elm');
            });
        }

        inputElm?.forEach((elm) => {
            elm.classList.add('disabled_elm');
        });
    }
};

/* Load Article
====================================================*/
export const loadArticle = (e: MouseEvent, url: URL, langCode: Locales, pathname?: string): void => {
    e.stopPropagation();
    let newURL: string;

    // generate new URL
    if (pathname) {
        newURL = `${url.origin}/${langCode}/${pathname}`;
    } else {
        newURL = replaceLocaleInUrl(url, langCode);
    }

    location.href = newURL;
};

/* Switch Display / Hide Password
====================================================*/
export const toggleHidePass = (e: MouseEvent): void => {
    const btnElm = e.target as HTMLButtonElement;
    const inputElm = btnElm.previousElementSibling as HTMLInputElement;

    if (inputElm.type === 'text') {
        // hide password
        inputElm.type = 'password';
        btnElm.textContent = 'visibility_off';
    } else {
        // show password
        inputElm.type = 'text';
        btnElm.textContent = 'visibility';
    }
};

/* Disable Hide Password Button
====================================================*/
export const disableHidePass = (hidePass: HTMLCollectionOf<Element>): void => {
    Array.from(hidePass).forEach((elm) => {
        let element = elm as HTMLElement;
        element.style.display = 'none';
    });
};

/* Generate Random String for Token
====================================================*/
export const getRandomString = (length: number): string => {
    const randomValues = crypto.getRandomValues(new Uint8Array(length));
    const base64url = btoa(String.fromCharCode(...randomValues))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    return base64url;
};

/* Validate Turnstile's Token
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
        // return the status
        validateSuccess: data.success,

        // return the first error if it exists
        validateError: data['error-codes']?.length ? data['error-codes'][0] : null,
    };
};
