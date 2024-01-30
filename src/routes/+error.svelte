<script lang="ts">
    import type { LayoutData } from './$types';
    import { page } from '$app/stores';
    import LL, { setLocale } from '$i18n/i18n-svelte';
    import { onMount } from 'svelte';
    import '$scss/style_error.scss';

    export let data: LayoutData;
    const { url } = data;
    const origin = url.origin;
    const status = $page.status;
    setLocale(data.locale);

    // break out of the application-side layout
    onMount(() => {
        const wrapper = document.getElementById('wrapper');
        wrapper?.classList.add('disable_default_wrapper');
    });
</script>

<div class="wrapper_error">
    <main class="main_inner_error">
        <p class="ouch_cat">
            <img src="/img/common/ouch_cat.webp" alt="ouch_cat" />
        </p>

        <h1 class="h1_error">
            {#if status === 404}
                {$LL.error[404].title()}
            {:else if status === 403}
                {$LL.error[403].title()}
            {:else if status === 400}
                {$LL.error[400].title()}
            {:else if status === 401}
                {$LL.error[401].title()}
            {:else if status === 422}
                {$LL.error[422].title()}
            {:else if status === 500}
                {$LL.error[500].title()}
            {:else}
                {$LL.error['unexpectedErr']()}
            {/if}
        </h1>

        <div class="inner_text_error">
            <p>
                <!-- message1 -->
                {#if !$page.error?.message1}
                    {#if status === 404}
                        {$LL.error[404].message1()}
                    {:else if status === 403 || status === 401}
                        {$LL.error[403].message1()}
                    {:else if status === 400}
                        {$LL.error[400].message1()}
                    {:else if status === 422}
                        {$LL.error[422].message1()}
                    {:else if status === 500}
                        {$LL.error[500].message1()}
                    {:else}
                        {$LL.error['otherMessage1']()}
                    {/if}
                {:else}
                    {$page.error?.message1}
                {/if}
            </p>

            <ul class="error_cause">
                <!-- message2 -->
                {#if !$page.error?.message2}
                    {#if status === 404}
                        {#each Object.entries($LL.error[404].message2) as [_, cause]}
                            <li>{cause()}</li>
                        {/each}
                    {:else if status === 403}
                        {#each Object.entries($LL.error[403].message2) as [_, cause]}
                            <li>{cause()}</li>
                        {/each}
                    {:else if status === 400 || status === 500}
                        <li>{$page.error?.message}</li>
                    {:else}
                        <li>{$LL.error['otherMessage2']()}</li>
                    {/if}
                {:else}
                    {#each Object.entries($page.error?.message2) as [_, cause]}
                        <li>{cause}</li>
                    {/each}
                {/if}
            </ul>

            <p>
                <!-- message3 -->
                {#if !$page.error?.message3}
                    {#if status === 404}
                        {$LL.error[404].message3()}
                    {:else if status === 403}
                        {$LL.error[403].message3()}
                    {:else if status === 500}
                        {$LL.error[500].message3()}
                    {/if}
                {:else}
                    {@html $page.error?.message3}
                {/if}
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
    <title
        >{status} - {status === 404
            ? $LL.error[404].title()
            : status === 403
              ? $LL.error[403].title()
              : status === 400
                ? $LL.error[400].title()
                : status === 401
                  ? $LL.error[401].title()
                  : status === 422
                    ? $LL.error[422].title()
                    : status === 500
                      ? $LL.error[500].title()
                      : $page.error?.message} | {$LL.serverTitle()}</title
    >

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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
