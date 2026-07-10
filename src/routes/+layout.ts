import type { LayoutLoad } from './$types';
import type { Locales } from '$i18n/i18n-types';
import { loadLocaleAsync } from '$i18n/i18n-util.async';

export const load: LayoutLoad<{ locale: Locales }> = async ({ data: { locale }, url }) => {
    // ロケールを読み込む
    await loadLocaleAsync(locale);

    return { url, locale };
};

export const trailingSlash = 'always';