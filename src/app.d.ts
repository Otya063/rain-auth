import type { Locales, TranslationFunctions } from '$i18n/i18n-types';
import type { Token } from '$lib/types';

declare global {
    namespace App {
        interface Error {
            message1?: string;
            message2?: string[];
            message3?: string;
        }
        interface Locals {
            locale: Locales;
            LL: TranslationFunctions;
            tokenData: Token | null;
        }
        // interface PageData {}
        interface Platform {
            env: {
                MAINTENANCE_MODE: string;
                MAINTENANCE_DATE: string;
            }
        }
    }
}

export {};
