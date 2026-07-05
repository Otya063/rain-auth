import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: vitePreprocess(),

    kit: {
        adapter: adapter({
            platformProxy: {
                environment: 'development',
            },
        }),
        alias: {
            $lib: 'src/lib',
            $i18n: 'src/i18n',
            $scss: 'static/sass',
        },
    },
    compilerOptions: {
        preserveComments: true,
    },
};

export default config;
