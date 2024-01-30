<script lang="ts">
    import type { PageData } from './$types';
    import LL, { setLocale } from '$i18n/i18n-svelte';
    import { onMount } from 'svelte';
    import { DateTime } from 'luxon';
    import '$scss/style_error.scss';

    export let data: PageData;
    const { date, url } = data;
    const arrStr: string[] = date.split(',');
    const arrNum: number[] = arrStr.map((str) => parseInt(str, 10));
    const origin = url.origin;
    setLocale(data.locale);

    // break out of the application-side layout
    onMount(() => {
        const wrapper = document.getElementById('wrapper');
        wrapper?.classList.add('disable_default_wrapper');
    });
</script>

<div class="wrapper_error">
    <main class="main_inner_error">
        <p class="delivery_cat">
            <img src="/img/common/delivery_cat.webp" alt="delivery_cat" />
        </p>

        <h1 class="h1_error">{$LL.maintenance['title']()}</h1>

        <div class="inner_text_error">
            <p>
                <!-- message1 -->
                {$LL.maintenance['message1']()}
            </p>

            <ul class="error_cause">
                <!-- message2 -->
                <li>
                    {$LL.maintenance['message2']()}
                    {#if !date}
                        TBD
                    {:else}
                        <!-- UTC -->
                        {DateTime.utc(arrNum[0], arrNum[1], arrNum[2], arrNum[3], arrNum[4]).setZone(DateTime.local().zoneName).toLocaleString(DateTime.DATETIME_FULL)}
                    {/if}
                </li>
            </ul>

            <p>
                <!-- message3 -->
                {$LL.maintenance['message3']()}
            </p>
        </div>
    </main>

    <footer>
        <section class="footer_inner_error">
            <img class="footer_logo_error" src="/img/common/rain_textlogo.webp" alt="rain_textlogo" />
            <p class="footer_text_error">{@html $LL.footerText()}</p>
        </section>
    </footer>
</div>

<svelte:head>
    <title>{$LL.maintenance['title']()} | {$LL.serverTitle()}</title>
    <meta name="robots" content="noindex,nofollow" />
    <!-- ogp -->
    <meta property="og:image" content="{origin}/img/common/sns_share.webp" />
    <!-- twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <!-- favicon -->
    <link rel="icon" href="/rain-favicon.ico" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <!-- mobile -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="format-detection" content="telephone=no" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <!-- font -->
    <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="true" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
    {#if data.locale === 'ja'}
        <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700;900&family=Noto+Serif+JP:wght@400;500;700&display=swap" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700;900&family=Noto+Serif+JP:wght@400;500;700&display=swap" />
    {:else}
        <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;700&family=Open+Sans:wght@400;700;800&family=Roboto:wght@400;700;900&display=swap" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;700&family=Open+Sans:wght@400;700;800&family=Roboto:wght@400;700;900&display=swap" />
    {/if}
</svelte:head>
