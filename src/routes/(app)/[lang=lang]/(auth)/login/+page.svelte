<script lang="ts">
    import type { ActionData, PageData } from './$types';
    import { applyAction, enhance } from '$app/forms';
    import { page } from '$app/state';
    import { PUBLIC_MAIN_DOMAIN, PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';
    import LL, { locale } from '$i18n/i18n-svelte';
    import { loadArticle, switchBtnInAuth } from '$lib/utils/client';
    import { fade, slide } from 'svelte/transition';
    import { Turnstile } from 'svelte-turnstile';

    let { data, form }: { data: PageData; form: ActionData } = $props();
    let btnStage = $state(0);
    let captchaNotPassed = $state(true);
    let captchaClientErr = $state(false);
    let captchaErrMsg = $state('');
    let rememberMe = $state(false);

    const enableSubmitButton = () => {
        switchBtnInAuth(true, document.getElementById('btn'));
        btnStage = 1;
    };

    const handleCaptchaError = (msg: string) => {
        captchaClientErr = true;
        captchaErrMsg = msg;
        enableSubmitButton();
    };
</script>

<main class="main_inner login">
    <h1>{$LL.login['title']()}</h1>

    {#if form?.error || captchaNotPassed || captchaClientErr}
        <div transition:fade={{ delay: 200 }} class="err_display" class:warning={!captchaClientErr && captchaNotPassed}>
            <span class="material-icons">
                {#if form?.error || captchaClientErr}
                    error
                {:else if captchaNotPassed}
                    warning
                {/if}
            </span>

            <span class="err_text">
                {#if form?.invalidUsername}
                    {$LL.register['invUsername']()}
                {:else if form?.invalidPassword}
                    {$LL.register['invPassword']()}
                {:else if form?.noUser}
                    {$LL.login['noUser']()}
                {:else if form?.incPassword}
                    {$LL.login['incPassword']()}
                {:else if form?.errorCaptcha}
                    {form?.errorCaptchaMsg}
                {:else if form?.errorServer}
                    {form?.errorServerMsg}
                {:else if captchaClientErr}
                    {@html captchaErrMsg}
                {:else if captchaNotPassed}
                    {$LL.login['captchaInProg']()}
                {/if}
            </span>
        </div>
    {/if}

    <form
        class="form_area"
        class:disabled_elm={captchaNotPassed}
        action="?/login"
        method="POST"
        use:enhance={() => {
            // 送信ボタンクリック時
            const nowBtnStage = btnStage;
            const btnElm = document.getElementById('btn');
            const labelElm = document.getElementsByClassName('part_label');
            const inputElm = document.querySelectorAll('.part_input, .wrap_part_label, .form_area_msg_only');
            switchBtnInAuth(false, btnElm, labelElm, inputElm);
            btnStage = 0;

            return async ({ result }) => {
                await applyAction(result);

                if (form?.redirect) {
                    // リダイレクト
                    window.location.assign(!data.redirectURL ? PUBLIC_MAIN_DOMAIN : data.redirectURL);
                } else {
                    // 失敗
                    switchBtnInAuth(true, btnElm, labelElm, inputElm);
                    btnStage = nowBtnStage;
                }
            };
        }}
    >
        {#if !(captchaClientErr && captchaNotPassed)}
            <div out:slide={{ duration: 800, axis: 'y' }} class="form_area_item">
                <label for="username" class="part_label">{$LL.login['usernameLabel']()}</label>
                <input class="part_input" class:error_input={form?.errorUsername} id="username" name="username" type="text" placeholder={$LL.login['usernameLabel']()} autocomplete="off" />

                <label for="password" class="part_label">{$LL.login['passwordLabel']()}</label>
                <input class="part_input" class:error_input={form?.errorPassword} id="password" name="password" type="password" placeholder={$LL.login['passwordLabel']()} autocomplete="off" />

                <div class="wrap_part_label">
                    <label for="remember_me">
                        <span class="material-icons-outlined remember">{rememberMe ? 'radio_button_checked' : 'radio_button_unchecked'}</span>
                        <input class="part_input" style="display: none;" id="remember_me" name="remember_me" type="checkbox" bind:checked={rememberMe} />
                        {$LL.login['rememberMe']()}
                    </label>

                    <button class="forgot_password" onclick={(e) => loadArticle(e, page.url, $locale, 'login/?type=reset-password')} type="button">
                        <span class="material-icons-outlined">chevron_right</span>
                        {$LL.login['forgotPassword']()}
                    </button>
                </div>

                <button class="form_area_msg_only" onclick={(e) => loadArticle(e, page.url, $locale, 'register/')} type="button">
                    <span class="material-icons-outlined">chevron_right</span>
                    {$LL.login['notRegister']()}
                </button>
            </div>
        {/if}

        <Turnstile
            siteKey={PUBLIC_TURNSTILE_SITE_KEY}
            on:callback={(e) => {
                if (e.detail.token) {
                    captchaNotPassed = false;
                    enableSubmitButton();
                } else {
                    handleCaptchaError('Failed to get token. Please try again.');
                }
            }}
            on:error={(e) => {
                if (e.detail.code) {
                    handleCaptchaError(`Captcha verification has failed. Please try again.<br />Code: ${e.detail.code}.`);
                }
            }}
            on:expired={() => handleCaptchaError('Captcha verification expired. Please try again.')}
            on:timeout={() => handleCaptchaError('Captcha verification timed out. Please try again.')}
        />

        {#if !(captchaClientErr && captchaNotPassed)}
            <button id="btn" class="blue_btn loading_btn disabled_elm" type={captchaNotPassed ? 'button' : 'submit'}>
                {#if btnStage === 0}
                    <span in:fade class="loading"></span>
                {:else}
                    <span in:fade={{ delay: 400 }} class="btn_icon material-icons">login</span>
                    <span in:fade={{ delay: 400 }} class="btn_text">{$LL.login['buttonLabel']()}</span>
                {/if}
            </button>
        {/if}
    </form>
</main>

<svelte:head>
    <title>{$LL.login['title']()} | {$LL.serverTitle()}</title>
    <meta name="description" content={$LL.login['metaDesc']()} />
    <meta property="og:title" content="{$LL.login['title']()} | {$LL.serverTitle()}" />
    <meta property="og:description" content={$LL.login['metaDesc']()} />
</svelte:head>
