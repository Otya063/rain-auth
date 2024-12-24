<script lang="ts">
    import type { LayoutData } from './$types';
    import LL, { setLocale } from '$i18n/i18n-svelte';
    import Header from '$lib/Header.svelte';
    import Alternate from '$lib/Alternate.svelte';
    import Analytics from '$lib/Analytics.svelte';
    import Footer from '$lib/Footer.svelte';
    import '$scss/style_auth.scss';

    export let data: LayoutData;
    const { url } = data;
    const origin = url.origin;
    const pathname = url.pathname;

    // at the top, set the locale before the store is accessed and before the actual rendering takes place
    setLocale(data.locale);
</script>

<Analytics />

<Header {pathname} />

<div class="background_img" />

<slot />

<Footer />

<svelte:head>
    <!-- ogp -->
    <meta property="og:image" content="{origin}/img/common/sns_share.webp" />
    <meta property="og:url" content={String(url)} />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content={$LL.serverTitle()} />
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
    <!-- alternate -->
    <Alternate />
    <link rel="canonical" href={String(url)} />
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
    <!-- icon -->
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons%7CMaterial+Icons+Outlined" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0" />
</svelte:head>
