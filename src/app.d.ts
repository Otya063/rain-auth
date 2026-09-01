import type { ExecutionContext, Hyperdrive } from '@cloudflare/workers-types';
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
            ctx: ExecutionContext;
            env: {
                MAINTENANCE_MODE: string;
                MAINTENANCE_DATE: string;
                HYPERDRIVE: Hyperdrive;
            }
        }
    }
}

export {};
