import type { ParamMatcher } from '@sveltejs/kit';
import { isLocale } from '$i18n/i18n-util';

// URLセグメントとして有効な言語のみ受け付ける
export const match: ParamMatcher = (param) => {
    return isLocale(param);
};
