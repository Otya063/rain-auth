import type { Locales } from '$i18n/i18n-types';
import type { LinkedCharacterData } from '$lib/types';
import { writable, type Writable } from 'svelte/store';

export const showTip = writable(false);
export const linkCharsData: Writable<LinkedCharacterData[]> = writable([]);

/* URL内のロケールスラッグを置換
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

/* 認証中のボタン切り替え
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

/* 記事の読み込み
====================================================*/
export const loadArticle = (e: MouseEvent, url: URL, langCode: Locales, pathname?: string): void => {
    e.stopPropagation();
    let newURL: string;

    // 新しいURLを生成
    if (pathname) {
        newURL = `${url.origin}/${langCode}/${pathname}`;
    } else {
        newURL = replaceLocaleInUrl(url, langCode);
    }

    location.href = newURL;
};

/* パスワードの表示・非表示切り替え
====================================================*/
export const toggleHidePass = (e: MouseEvent): void => {
    const btnElm = e.target as HTMLButtonElement;
    const inputElm = btnElm.previousElementSibling as HTMLInputElement;

    if (inputElm.type === 'text') {
        // パスワードを隠す
        inputElm.type = 'password';
        btnElm.textContent = 'visibility_off';
    } else {
        // パスワードを表示
        inputElm.type = 'text';
        btnElm.textContent = 'visibility';
    }
};
